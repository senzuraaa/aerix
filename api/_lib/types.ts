export const ACTIONS = ['Tunggu', 'Hembus', 'Semprot', 'Lapor'] as const;
export const DECISION_STATUSES = ['menunggu', 'disetujui', 'ditolak'] as const;
export const TASK_STATUSES = ['baru', 'dikerjakan', 'selesai'] as const;
export const PRIORITIES = ['Tinggi', 'Sedang', 'Rendah'] as const;

export const CLASS_LABEL: Record<string, string> = {
  normal: 'Normal',
  kotor: 'Kotor',
  vegetasi: 'Vegetasi',
  sel_panas: 'Sel panas',
  sel_panas_ganda: 'Sel panas ganda',
  sirkuit_terbuka: 'Sirkuit terbuka',
  retak_sel: 'Retak sel',
};

export const PANEL_ID = /^Z[1-5]-S\d{2}-B\d{2}-K\d{2}$/;

export function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}
