import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { badRequest, fail, guard } from './_lib/http';
import { PANEL_ID, TASK_STATUSES, oneOf } from './_lib/types';

// POST /api/task  { id, status?, actionDone?, note?, safetyChecked? }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['POST'])) return;
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    if (typeof b.id !== 'string' || !PANEL_ID.test(b.id)) return badRequest(res, 'id tidak valid');

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.status !== undefined) {
      if (!oneOf(TASK_STATUSES, b.status)) return badRequest(res, 'status tidak valid');
      patch.status = b.status;
    }
    if (b.actionDone !== undefined) patch.action_done = b.actionDone === null ? null : String(b.actionDone).slice(0, 100);
    if (b.note !== undefined) patch.note = b.note === null ? null : String(b.note).slice(0, 1000);
    if (b.safetyChecked !== undefined) patch.safety_checked = Boolean(b.safetyChecked);

    const r = await db().from('tasks').update(patch).eq('id', b.id);
    if (r.error) throw r.error;
    res.status(200).json({ ok: true });
  } catch (e) {
    fail(res, e);
  }
}
