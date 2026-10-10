import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { badRequest, fail, guard } from './_lib/http';
import { buildMessage, sendPush, sendTelegram } from './_lib/notify';
import { ACTIONS, CLASS_LABEL, DECISION_STATUSES, PANEL_ID, PRIORITIES, oneOf } from './_lib/types';

interface TaskInput {
  cls: string;
  priority: string;
  distanceM: number;
  actionText: string;
  lat?: number;
  lng?: number;
}
interface Item {
  panelId: string;
  action: string;
  status: string;
  waterMl: number;
  task?: TaskInput;
}

// POST /api/decision  { items: [{ panelId, action, status, waterMl, task? }] }
// Menyimpan keputusan operator. Persetujuan "Lapor" membuat tugas teknisi
// (jika belum ada) lalu mengirim notifikasi push dan Telegram.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['POST'])) return;
  try {
    const raw = (req.body ?? {}) as { items?: unknown };
    if (!Array.isArray(raw.items) || raw.items.length === 0 || raw.items.length > 500) {
      return badRequest(res, 'items harus berisi 1 sampai 500 entri');
    }
    const items: Item[] = [];
    for (const i of raw.items as Item[]) {
      if (
        !i ||
        typeof i.panelId !== 'string' ||
        !PANEL_ID.test(i.panelId) ||
        !oneOf(ACTIONS, i.action) ||
        !oneOf(DECISION_STATUSES, i.status)
      ) {
        return badRequest(res, 'Entri keputusan tidak valid');
      }
      const water = Number(i.waterMl);
      if (!Number.isFinite(water) || water < 0 || water > 1000) return badRequest(res, 'waterMl tidak valid');
      if (i.task) {
        const t = i.task;
        if (!(t.cls in CLASS_LABEL) || !oneOf(PRIORITIES, t.priority) || typeof t.actionText !== 'string') {
          return badRequest(res, 'Data tugas tidak valid');
        }
      }
      items.push({ ...i, waterMl: Math.round(water) });
    }

    const sb = db();
    const now = new Date().toISOString();
    const up = await sb.from('decisions').upsert(
      items.map((i) => ({
        panel_id: i.panelId,
        action: i.action,
        status: i.status,
        water_ml: i.waterMl,
        updated_at: now,
      })),
      { onConflict: 'panel_id' }
    );
    if (up.error) throw up.error;

    const lapor = items.filter((i) => i.status === 'disetujui' && i.action === 'Lapor' && i.task);
    const created: string[] = [];
    let pushCount = 0;
    let telegramSent = false;

    if (lapor.length) {
      const ids = lapor.map((i) => i.panelId);
      const existing = await sb.from('tasks').select('id').in('id', ids);
      if (existing.error) throw existing.error;
      const have = new Set((existing.data ?? []).map((r) => r.id as string));
      const fresh = lapor.filter((i) => !have.has(i.panelId));

      if (fresh.length) {
        const ins = await sb.from('tasks').insert(
          fresh.map((i) => ({
            id: i.panelId,
            panel_id: i.panelId,
            cls: i.task!.cls,
            priority: i.task!.priority,
            distance_m: Math.round(Number(i.task!.distanceM) || 0),
            action_text: String(i.task!.actionText).slice(0, 200),
            status: 'baru',
            created_at: now,
            updated_at: now,
          }))
        );
        if (ins.error) throw ins.error;

        for (const i of fresh) {
          created.push(i.panelId);
          const msg = buildMessage({
            panelId: i.panelId,
            cls: i.task!.cls,
            priority: i.task!.priority,
            distanceM: Math.round(Number(i.task!.distanceM) || 0),
            actionText: i.task!.actionText,
          });
          const loc =
            typeof i.task!.lat === 'number' && typeof i.task!.lng === 'number'
              ? { lat: i.task!.lat, lng: i.task!.lng }
              : undefined;
          const [p, tg] = await Promise.all([sendPush(msg).catch(() => 0), sendTelegram(msg, loc)]);
          pushCount += p;
          telegramSent = telegramSent || tg;
        }
      }
    }

    res.status(200).json({ ok: true, created, push: pushCount, telegram: telegramSent });
  } catch (e) {
    fail(res, e);
  }
}
