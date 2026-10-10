import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error('Supabase belum dikonfigurasi (SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY).');
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseKey, { auth: { persistSession: false } });
  }
  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export function toDecision(r: Row) {
  return {
    panelId: r.panel_id as string,
    action: r.action as string,
    status: r.status as string,
    waterMl: Number(r.water_ml ?? 0),
    updatedAt: r.updated_at as string,
  };
}

export function toTask(r: Row) {
  return {
    id: r.id as string,
    panelId: r.panel_id as string,
    cls: r.cls as string,
    priority: r.priority as string,
    distanceM: Number(r.distance_m ?? 0),
    actionText: (r.action_text ?? '') as string,
    status: r.status as string,
    actionDone: (r.action_done ?? null) as string | null,
    note: (r.note ?? null) as string | null,
    safetyChecked: Boolean(r.safety_checked),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
