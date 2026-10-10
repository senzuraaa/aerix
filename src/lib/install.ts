import { useEffect, useState } from 'react';

// Menangkap `beforeinstallprompt` sedini mungkin (peristiwa ini bisa muncul sebelum halaman Profil dibuka).

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e as BeforeInstallPromptEvent;
  notify();
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  notify();
});

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export function useInstallPrompt(): { available: boolean; install: () => Promise<InstallOutcome> } {
  const [available, setAvailable] = useState(deferred !== null);

  useEffect(() => {
    const fn = () => setAvailable(deferred !== null);
    listeners.add(fn);
    fn();
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const install = async (): Promise<InstallOutcome> => {
    const e = deferred;
    if (!e) return 'unavailable';
    deferred = null;
    notify();
    await e.prompt();
    return (await e.userChoice).outcome;
  };

  return { available, install };
}
