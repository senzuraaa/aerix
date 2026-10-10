import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, toDecision, toTask } from './_lib/db';
import { env } from './_lib/env';
import { fail, guard } from './_lib/http';
import { pushConfigured, telegramConfigured } from './_lib/notify';

// GET /api/state -> seluruh keputusan, tugas, dan konfigurasi singkat server.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['GET'])) return;
  try {
    const sb = db();
    const [d, t] = await Promise.all([
      sb.from('decisions').select('*'),
      sb.from('tasks').select('*').order('created_at', { ascending: false }),
    ]);
    if (d.error) throw d.error;
    if (t.error) throw t.error;
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      decisions: (d.data ?? []).map(toDecision),
      tasks: (t.data ?? []).map(toTask),
      config: { push: pushConfigured(), telegram: telegramConfigured(), pinRequired: Boolean(env.appPin) },
    });
  } catch (e) {
    fail(res, e);
  }
}
