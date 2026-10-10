// Semua konfigurasi server dibaca dari environment variables (lihat .env.example).
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : '';

export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  vapidPublic: process.env.VAPID_PUBLIC_KEY ?? '',
  vapidPrivate: process.env.VAPID_PRIVATE_KEY ?? '',
  vapidSubject: process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
  appUrl: (process.env.APP_URL || vercelUrl).replace(/\/$/, ''),
  appPin: process.env.APP_PIN ?? '',
};
