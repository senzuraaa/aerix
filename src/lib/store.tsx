import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError, LOCAL_KEY, isNetworkError, localBackend, remoteBackend, type Backend } from './backend';
import { PANELS, PANEL_BY_ID } from './panels';
import type { Decision, DecisionItem, Panel, ServerConfig, ServerState, Task, TaskPatch } from './types';

type Mode = 'memuat' | 'server' | 'lokal';
type Op = { kind: 'decisions'; items: DecisionItem[] } | { kind: 'task'; patch: TaskPatch };
export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'ok' | 'warn';
}
export interface Settings {
  budgetMl: number;
  maxCycles: number;
  zoneOrder: number[];
}

const DEFAULT_SETTINGS: Settings = { budgetMl: 2500, maxCycles: 2, zoneOrder: [3, 4, 2, 5, 1] };
const DEFAULT_CONFIG: ServerConfig = { push: false, telegram: false, pinRequired: false };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* penyimpanan penuh atau diblokir: abaikan */
  }
}

interface Store {
  panels: Panel[];
  panelById: Map<string, Panel>;
  mode: Mode;
  serverError: string | null;
  config: ServerConfig;
  online: boolean;
  forcedOffline: boolean;
  setForcedOffline: (v: boolean) => void;
  decisions: Map<string, Decision>;
  tasks: Task[];
  pendingCount: number;
  pendingTaskIds: Set<string>;
  needPin: boolean;
  submitPin: (pin: string) => void;
  decide: (items: DecisionItem[]) => Promise<void>;
  updateTask: (patch: TaskPatch) => Promise<void>;
  resetDemo: () => Promise<void>;
  sendTestNotification: () => Promise<string>;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  wind: number;
  setWind: (v: number) => void;
  unreadCount: number;
  markSeen: () => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore harus dipakai di dalam AppProvider');
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const cached = useMemo(() => load<ServerState | null>('aerix.cache', null), []);
  const [mode, setMode] = useState<Mode>('memuat');
  const [serverError, setServerError] = useState<string | null>(null);
  const [config, setConfig] = useState<ServerConfig>(cached?.config ?? DEFAULT_CONFIG);
  const [decisionList, setDecisionList] = useState<Decision[]>(cached?.decisions ?? []);
  const [tasks, setTasks] = useState<Task[]>(cached?.tasks ?? []);
  const [needPin, setNeedPin] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  // sessionStorage: simulasi offline berlaku per tab, jadi tab operator dan teknisi bisa berbeda keadaan.
  const [forcedOffline, setForcedOfflineState] = useState(() => sessionStorage.getItem('aerix.forcedOffline') === '1');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettingsState] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>('aerix.settings', {}) }));
  const [wind, setWind] = useState(14);
  const [lastSeen, setLastSeen] = useState<string>(() => localStorage.getItem('aerix.lastSeen') ?? '1970-01-01T00:00:00.000Z');

  const backendRef = useRef<Backend>(localBackend);
  const pendingRef = useRef<Op[]>(load<Op[]>('aerix.pending', []));
  const [pendingCount, setPendingCount] = useState(pendingRef.current.length);
  const [pendingOps, setPendingOps] = useState<Op[]>(pendingRef.current);
  const flushing = useRef(false);
  const toastId = useRef(1);

  const online = browserOnline && !forcedOffline;
  const onlineRef = useRef(online);
  onlineRef.current = online;

  const setPending = useCallback((next: Op[]) => {
    pendingRef.current = next;
    save('aerix.pending', next);
    setPendingCount(next.length);
    setPendingOps(next);
  }, []);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5200);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const applyState = useCallback((s: ServerState) => {
    setDecisionList(s.decisions);
    setTasks(s.tasks);
    setConfig(s.config);
    save('aerix.cache', s);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      while (pendingRef.current.length > 0 && onlineRef.current) {
        const op = pendingRef.current[0];
        try {
          if (op.kind === 'decisions') await backendRef.current.postDecisions(op.items);
          else await backendRef.current.patchTask(op.patch);
          setPending(pendingRef.current.slice(1));
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) setNeedPin(true);
          else if (e instanceof ApiError && e.status >= 400 && e.status < 500) setPending(pendingRef.current.slice(1)); // data ditolak server: buang agar antrean tidak macet
          break;
        }
      }
    } finally {
      flushing.current = false;
    }
  }, [setPending]);

  const refresh = useCallback(async () => {
    if (!onlineRef.current) return;
    await flush();
    if (pendingRef.current.length > 0) return;
    try {
      const s = await backendRef.current.getState();
      applyState(s);
      setNeedPin(false);
      setServerError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setNeedPin(true);
      else if (e instanceof ApiError && e.json) setServerError(e.message);
    }
  }, [flush, applyState]);

  // Deteksi backend: server (Vercel + Supabase) atau mode lokal (localStorage).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await remoteBackend.getState();
        if (cancelled) return;
        backendRef.current = remoteBackend;
        localStorage.setItem('aerix.mode', 'server');
        setMode('server');
        applyState(s);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          backendRef.current = remoteBackend;
          localStorage.setItem('aerix.mode', 'server');
          setMode('server');
          setNeedPin(true);
        } else if (e instanceof ApiError && e.json) {
          backendRef.current = remoteBackend;
          localStorage.setItem('aerix.mode', 'server');
          setMode('server');
          setServerError(e.message);
        } else if (isNetworkError(e) && localStorage.getItem('aerix.mode') === 'server') {
          backendRef.current = remoteBackend; // perangkat offline, tetap pakai data terakhir
          setMode('server');
        } else {
          backendRef.current = localBackend;
          setMode('lokal');
          applyState(await localBackend.getState());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyState]);

  // Polling, fokus jendela, kembali online, dan sinkron antar tab (mode lokal).
  useEffect(() => {
    if (mode === 'memuat') return;
    const tick = () => void refresh();
    const id = window.setInterval(tick, 4000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCAL_KEY) tick();
    };
    window.addEventListener('focus', tick);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
      window.removeEventListener('storage', onStorage);
    };
  }, [mode, refresh]);

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    if (online && mode !== 'memuat') void refresh();
  }, [online, mode, refresh]);

  const setForcedOffline = useCallback((v: boolean) => {
    sessionStorage.setItem('aerix.forcedOffline', v ? '1' : '0');
    setForcedOfflineState(v);
  }, []);

  const decide = useCallback(
    async (items: DecisionItem[]) => {
      const now = new Date().toISOString();
      setDecisionList((prev) => {
        const m = new Map(prev.map((d) => [d.panelId, d]));
        for (const i of items) m.set(i.panelId, { panelId: i.panelId, action: i.action, status: i.status, waterMl: i.waterMl, updatedAt: now });
        return [...m.values()];
      });
      setTasks((prev) => {
        const ids = new Set(prev.map((t) => t.id));
        const add: Task[] = [];
        for (const i of items) {
          if (i.status === 'disetujui' && i.action === 'Lapor' && i.task && !ids.has(i.panelId)) {
            ids.add(i.panelId);
            add.push({
              id: i.panelId,
              panelId: i.panelId,
              cls: i.task.cls,
              priority: i.task.priority,
              distanceM: i.task.distanceM,
              actionText: i.task.actionText,
              status: 'baru',
              actionDone: null,
              note: null,
              safetyChecked: false,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        return add.length ? [...add, ...prev] : prev;
      });

      if (onlineRef.current) {
        try {
          const r = await backendRef.current.postDecisions(items);
          if (r.created.length > 0) {
            toast(
              backendRef.current === remoteBackend
                ? `${r.created.length} tugas dikirim ke teknisi · push: ${r.push} perangkat · Telegram: ${r.telegram ? 'terkirim' : 'tidak'}`
                : `${r.created.length} tugas dibuat untuk teknisi (mode lokal, tanpa push)`,
              'ok'
            );
          }
          void refresh();
          return;
        } catch (e) {
          if (e instanceof ApiError && e.status !== 401 && e.status < 500) {
            toast(`Ditolak server: ${e.message}`, 'warn');
            return;
          }
          if (e instanceof ApiError && e.status === 401) setNeedPin(true);
        }
      }
      setPending([...pendingRef.current, { kind: 'decisions', items }]);
      toast('Tersimpan di perangkat, akan disinkronkan saat online', 'info');
    },
    [refresh, setPending, toast]
  );

  const updateTask = useCallback(
    async (patch: TaskPatch) => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === patch.id
            ? {
                ...t,
                status: patch.status ?? t.status,
                actionDone: patch.actionDone !== undefined ? patch.actionDone : t.actionDone,
                note: patch.note !== undefined ? patch.note : t.note,
                safetyChecked: patch.safetyChecked ?? t.safetyChecked,
                updatedAt: now,
              }
            : t
        )
      );
      if (onlineRef.current) {
        try {
          await backendRef.current.patchTask(patch);
          void refresh();
          return;
        } catch (e) {
          if (e instanceof ApiError && e.status !== 401 && e.status < 500) {
            toast(`Ditolak server: ${e.message}`, 'warn');
            return;
          }
          if (e instanceof ApiError && e.status === 401) setNeedPin(true);
        }
      }
      setPending([...pendingRef.current, { kind: 'task', patch }]);
    },
    [refresh, setPending, toast]
  );

  const resetDemo = useCallback(async () => {
    if (!onlineRef.current) {
      toast('Atur ulang demo membutuhkan koneksi (matikan simulasi offline)', 'warn');
      return;
    }
    try {
      await backendRef.current.reset();
      setPending([]);
      setDecisionList([]);
      setTasks([]);
      toast('Demo diatur ulang', 'ok');
      void refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal mengatur ulang demo', 'warn');
    }
  }, [refresh, setPending, toast]);

  const sendTestNotification = useCallback(async () => {
    if (!onlineRef.current) return 'Perlu koneksi internet.';
    try {
      const r = await backendRef.current.testNotification();
      if (backendRef.current === localBackend) return 'Mode lokal: tidak ada server, jadi tidak ada push.';
      const parts = [`Push: ${r.pushConfigured ? `${r.push} perangkat` : 'belum dikonfigurasi'}`, `Telegram: ${r.telegramConfigured ? (r.telegram ? 'terkirim' : 'gagal') : 'belum dikonfigurasi'}`];
      return parts.join(' · ');
    } catch (e) {
      return e instanceof Error ? e.message : 'Gagal mengirim notifikasi uji.';
    }
  }, []);

  const submitPin = useCallback(
    (pin: string) => {
      localStorage.setItem('aerix.pin', pin);
      setNeedPin(false);
      void refresh();
    },
    [refresh]
  );

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      save('aerix.settings', next);
      return next;
    });
  }, []);

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem('aerix.lastSeen', now);
    setLastSeen(now);
  }, []);

  const decisions = useMemo(() => new Map(decisionList.map((d) => [d.panelId, d])), [decisionList]);
  const pendingTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const op of pendingOps) {
      if (op.kind === 'task') ids.add(op.patch.id);
      else for (const i of op.items) if (i.task) ids.add(i.panelId);
    }
    return ids;
  }, [pendingOps]);
  const unreadCount = useMemo(() => tasks.filter((t) => t.createdAt > lastSeen).length, [tasks, lastSeen]);

  const value: Store = {
    panels: PANELS,
    panelById: PANEL_BY_ID,
    mode,
    serverError,
    config,
    online,
    forcedOffline,
    setForcedOffline,
    decisions,
    tasks,
    pendingCount,
    pendingTaskIds,
    needPin,
    submitPin,
    decide,
    updateTask,
    resetDemo,
    sendTestNotification,
    toasts,
    toast,
    dismissToast,
    settings,
    setSettings,
    wind,
    setWind,
    unreadCount,
    markSeen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
