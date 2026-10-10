import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { badRequest, fail, guard } from './_lib/http';

// POST /api/subscribe  { subscription: PushSubscriptionJSON, role? }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['POST'])) return;
  try {
    const b = (req.body ?? {}) as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      role?: string;
    };
    const s = b.subscription;
    if (!s?.endpoint || !s.keys?.p256dh || !s.keys?.auth || !s.endpoint.startsWith('https://')) {
      return badRequest(res, 'Langganan push tidak valid');
    }
    const r = await db()
      .from('push_subscriptions')
      .upsert(
        { endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, role: b.role === 'operator' ? 'operator' : 'teknisi' },
        { onConflict: 'endpoint' }
      );
    if (r.error) throw r.error;
    res.status(200).json({ ok: true });
  } catch (e) {
    fail(res, e);
  }
}
