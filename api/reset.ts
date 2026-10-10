import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { fail, guard } from './_lib/http';

// POST /api/reset -> hapus keputusan dan tugas demo (langganan push tetap).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['POST'])) return;
  try {
    const sb = db();
    const a = await sb.from('decisions').delete().neq('panel_id', '__none__');
    if (a.error) throw a.error;
    const b = await sb.from('tasks').delete().neq('id', '__none__');
    if (b.error) throw b.error;
    res.status(200).json({ ok: true });
  } catch (e) {
    fail(res, e);
  }
}
