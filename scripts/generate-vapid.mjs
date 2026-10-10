// Membuat pasangan kunci VAPID untuk Web Push.
// Jalankan: npm run vapid
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();
console.log('\nSalin ke Vercel (Environment Variables) dan .env.local:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\nVAPID_PRIVATE_KEY bersifat rahasia. Jangan commit atau bagikan.\n');
