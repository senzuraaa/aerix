import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env } from './env';

/** Cek metode HTTP dan PIN opsional. Mengembalikan false jika respons sudah dikirim. */
export function guard(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (!methods.includes(req.method ?? '')) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({ error: 'Metode tidak diizinkan' });
    return false;
  }
  if (env.appPin && req.headers['x-app-pin'] !== env.appPin) {
    res.status(401).json({ error: 'PIN diperlukan', pinRequired: true });
    return false;
  }
  return true;
}

export function fail(res: VercelResponse, e: unknown): void {
  let message = 'Terjadi kesalahan di server';
  if (e instanceof Error) message = e.message;
  else if (typeof e === 'object' && e !== null && 'message' in e) message = String((e as { message: unknown }).message);
  res.status(500).json({ error: message });
}

export function badRequest(res: VercelResponse, message: string): void {
  res.status(400).json({ error: message });
}
