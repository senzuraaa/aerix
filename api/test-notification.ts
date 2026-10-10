import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fail, guard } from './_lib/http';
import { sendPush, sendTelegram, pushConfigured, telegramConfigured } from './_lib/notify';

// POST /api/test-notification -> kirim notifikasi uji ke semua teknisi.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res, ['POST'])) return;
  try {
    const msg = {
      title: 'Notifikasi uji AERIX',
      body: 'Jika kamu melihat ini, notifikasi ke perangkat teknisi berfungsi.',
      url: '/teknisi',
      tag: 'aerix-uji',
    };
    const [push, telegram] = await Promise.all([sendPush(msg), sendTelegram(msg)]);
    res.status(200).json({
      ok: true,
      push,
      telegram,
      pushConfigured: pushConfigured(),
      telegramConfigured: telegramConfigured(),
    });
  } catch (e) {
    fail(res, e);
  }
}
