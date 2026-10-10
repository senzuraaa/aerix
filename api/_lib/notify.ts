import * as webpush from 'web-push';
import { db } from './db';
import { env } from './env';
import { CLASS_LABEL } from './types';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  urgency?: 'high' | 'normal';
}

export function buildMessage(t: {
  panelId: string;
  cls: string;
  priority: string;
  distanceM: number;
  actionText: string;
}): PushPayload {
  const kelas = CLASS_LABEL[t.cls] ?? t.cls;
  return {
    title: `Prioritas ${t.priority}: ${t.panelId}`,
    body: `${kelas} · ${t.distanceM} m · ${t.actionText}`,
    url: `/teknisi/tugas/${t.panelId}`,
    tag: t.panelId,
    urgency: t.priority === 'Tinggi' ? 'high' : 'normal',
  };
}

export function pushConfigured(): boolean {
  return Boolean(env.vapidPublic && env.vapidPrivate);
}

export function telegramConfigured(): boolean {
  return Boolean(env.telegramToken && env.telegramChatId);
}

/** Kirim Web Push ke semua perangkat teknisi yang berlangganan. Mengembalikan jumlah yang berhasil. */
export async function sendPush(payload: PushPayload): Promise<number> {
  if (!pushConfigured()) return 0;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublic, env.vapidPrivate);
  const { data, error } = await db().from('push_subscriptions').select('*').eq('role', 'teknisi');
  if (error) throw error;

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    (data ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
          JSON.stringify(payload),
          { TTL: 3600, urgency: payload.urgency === 'high' ? 'high' : 'normal' }
        );
        sent += 1;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint as string);
      }
    })
  );
  if (dead.length) await db().from('push_subscriptions').delete().in('endpoint', dead);
  return sent;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Kirim pesan ke chat Telegram (teks + tombol detail + pin lokasi). */
export async function sendTelegram(
  payload: PushPayload,
  loc?: { lat: number; lng: number }
): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const api = `https://api.telegram.org/bot${env.telegramToken}`;
  const detailUrl = env.appUrl ? `${env.appUrl}${payload.url}` : '';
  const text = `<b>${escapeHtml(payload.title)}</b>\n${escapeHtml(payload.body)}`;
  try {
    const r = await fetch(`${api}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        // Telegram hanya menerima tombol URL yang https.
        reply_markup: detailUrl.startsWith('https://')
          ? { inline_keyboard: [[{ text: 'Buka detail', url: detailUrl }]] }
          : undefined,
      }),
    });
    if (!r.ok) return false;
    if (loc) {
      await fetch(`${api}/sendLocation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: env.telegramChatId, latitude: loc.lat, longitude: loc.lng }),
      });
    }
    return true;
  } catch {
    return false;
  }
}
