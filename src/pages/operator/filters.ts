import { createContext, useContext } from 'react';
import type { Action, Panel } from '../../lib/types';

export type Severity = 'semua' | 'temuan' | 'tinggi' | 'sedang' | 'rendah' | 'kotor';

export const SEVERITIES: { value: Severity; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'temuan', label: 'Hanya temuan' },
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'rendah', label: 'Rendah' },
  { value: 'kotor', label: 'Kotor' },
];

export interface PanelFilter {
  zone: number; // 0 = semua zona
  severity: Severity;
  query: string;
}

/** Satu konteks bersama untuk Peta Kondisi dan Rekomendasi Tindakan. */
export interface OperatorState extends PanelFilter {
  setZone: (zone: number) => void;
  setSeverity: (severity: Severity) => void;
  setQuery: (query: string) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  overrides: Record<string, Action>; // hasil tombol "Ubah" sebelum diputuskan
  setOverride: (panelId: string, action: Action) => void;
}

export const OperatorContext = createContext<OperatorState | null>(null);

export function useOperator(): OperatorState {
  const v = useContext(OperatorContext);
  if (!v) throw new Error('useOperator harus dipakai di dalam OperatorLayout');
  return v;
}

export function matches(p: Panel, zone: number, severity: Severity, query: string): boolean {
  if (zone !== 0 && p.zone !== zone) return false;
  switch (severity) {
    case 'temuan':
      if (p.cls === 'normal') return false;
      break;
    case 'tinggi':
      if (p.priority !== 'Tinggi') return false;
      break;
    case 'sedang':
      if (p.priority !== 'Sedang') return false;
      break;
    case 'rendah':
      if (p.priority !== 'Rendah') return false;
      break;
    case 'kotor':
      if (p.cls !== 'kotor') return false;
      break;
    case 'semua':
      break;
  }
  const q = query.trim().toLowerCase();
  return q === '' || p.id.toLowerCase().includes(q);
}
