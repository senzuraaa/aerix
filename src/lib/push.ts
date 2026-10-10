// Pembantu Web Push di sisi browser.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

export function vapidConfigured(): boolean {
  return Boolean(VAPID_PUBLIC);
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export type EnableResult = 'ok' | 'denied' | 'unsupported' | 'nokey' | 'noworker' | 'error';

/** Minta izin notifikasi, berlangganan push, lalu kirim langganan ke server. Harus dipanggil dari klik tombol. */
export async function enablePush(): Promise<EnableResult> {
  if (!pushSupported()) return 'unsupported';
  if (!VAPID_PUBLIC) return 'nokey';
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
    const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.ready);
    if (!reg) return 'noworker';
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) }));
    const pin = localStorage.getItem('aerix.pin');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(pin ? { 'x-app-pin': pin } : {}) },
      body: JSON.stringify({ subscription: sub.toJSON(), role: 'teknisi' }),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
