import type { Decision, DecisionItem, PostResult, ServerState, Task, TaskPatch } from './types';

export class ApiError extends Error {
  status: number;
  json: boolean;
  constructor(status: number, message: string, json = true) {
    super(message);
    this.status = status;
    this.json = json;
  }
}

export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError;
}

export interface Backend {
  getState(): Promise<ServerState>;
  postDecisions(items: DecisionItem[]): Promise<PostResult>;
  patchTask(patch: TaskPatch): Promise<void>;
  reset(): Promise<void>;
  testNotification(): Promise<{ push: number; telegram: boolean; pushConfigured: boolean; telegramConfigured: boolean }>;
}

/* ---------- Backend server (fungsi serverless Vercel + Supabase) ---------- */

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const pin = localStorage.getItem('aerix.pin');
  const res = await fetch('/api' + path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(pin ? { 'x-app-pin': pin } : {}) },
  });
  const type = res.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) throw new ApiError(res.status, 'Respons bukan JSON', false);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Kesalahan server');
  return data;
}

export const remoteBackend: Backend = {
  getState: () => call<ServerState>('/state'),
  postDecisions: (items) => call<PostResult>('/decision', { method: 'POST', body: JSON.stringify({ items }) }),
  patchTask: async (patch) => {
    await call('/task', { method: 'POST', body: JSON.stringify(patch) });
  },
  reset: async () => {
    await call('/reset', { method: 'POST' });
  },
  testNotification: () => call('/test-notification', { method: 'POST' }),
};

/* ---------- Mode lokal (tanpa server): localStorage, sinkron antar tab ---------- */

export const LOCAL_KEY = 'aerix.local.state';

interface LocalState {
  decisions: Decision[];
  tasks: Task[];
}

function read(): LocalState {
  try {
    const s = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '') as Partial<LocalState>;
    return { decisions: Array.isArray(s.decisions) ? s.decisions : [], tasks: Array.isArray(s.tasks) ? s.tasks : [] };
  } catch {
    return { decisions: [], tasks: [] };
  }
}

function write(s: LocalState): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
}

export const localBackend: Backend = {
  async getState() {
    return { ...read(), config: { push: false, telegram: false, pinRequired: false } };
  },
  async postDecisions(items) {
    const s = read();
    const now = new Date().toISOString();
    const map = new Map(s.decisions.map((d) => [d.panelId, d]));
    const have = new Set(s.tasks.map((t) => t.id));
    const created: string[] = [];
    for (const i of items) {
      map.set(i.panelId, { panelId: i.panelId, action: i.action, status: i.status, waterMl: i.waterMl, updatedAt: now });
      if (i.status === 'disetujui' && i.action === 'Lapor' && i.task && !have.has(i.panelId)) {
        s.tasks.unshift({
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
        have.add(i.panelId);
        created.push(i.panelId);
      }
    }
    s.decisions = [...map.values()];
    write(s);
    return { created, push: 0, telegram: false };
  },
  async patchTask(patch) {
    const s = read();
    const t = s.tasks.find((x) => x.id === patch.id);
    if (t) {
      if (patch.status !== undefined) t.status = patch.status;
      if (patch.actionDone !== undefined) t.actionDone = patch.actionDone;
      if (patch.note !== undefined) t.note = patch.note;
      if (patch.safetyChecked !== undefined) t.safetyChecked = patch.safetyChecked;
      t.updatedAt = new Date().toISOString();
      write(s);
    }
  },
  async reset() {
    write({ decisions: [], tasks: [] });
  },
  async testNotification() {
    return { push: 0, telegram: false, pushConfigured: false, telegramConfigured: false };
  },
};
