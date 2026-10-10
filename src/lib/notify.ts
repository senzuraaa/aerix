import { CLASS_INFO } from './classes';
import type { Task } from './types';

/** Format pesan notifikasi, sama dengan yang dikirim server lewat Web Push/Telegram. */
export function notificationText(t: Pick<Task, 'panelId' | 'cls' | 'priority' | 'distanceM' | 'actionText'>) {
  return {
    title: `Prioritas ${t.priority}: ${t.panelId}`,
    body: `${CLASS_INFO[t.cls].label} · ${t.distanceM} m · ${t.actionText}`,
  };
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
}

export function formatId(n: number): string {
  return n.toLocaleString('id-ID');
}

export function liters(ml: number): string {
  return (ml / 1000).toFixed(1).replace('.', ',') + ' L';
}
