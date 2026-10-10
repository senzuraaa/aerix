import type { Action, PanelClass, Priority } from './types';

export const CLASS_ORDER: PanelClass[] = [
  'normal',
  'kotor',
  'vegetasi',
  'sel_panas',
  'sel_panas_ganda',
  'sirkuit_terbuka',
  'retak_sel',
];

export interface ClassInfo {
  label: string;
  color: string; // warna mode RGB / status
  heat: string; // warna mode termal
  group: string;
  locked: boolean;
}

export const CLASS_INFO: Record<PanelClass, ClassInfo> = {
  normal: { label: 'Normal', color: '#A8DABB', heat: '#5A2A82', group: 'Bersih', locked: false },
  kotor: { label: 'Kotor', color: '#F0A21F', heat: '#C4308B', group: 'Kotor', locked: false },
  vegetasi: { label: 'Vegetasi', color: '#7A55C8', heat: '#2E5BA8', group: 'Penghalang', locked: false },
  sel_panas: { label: 'Sel panas', color: '#E5483D', heat: '#FFC93C', group: 'Hotspot', locked: true },
  sel_panas_ganda: { label: 'Sel panas ganda', color: '#E5483D', heat: '#FFE27A', group: 'Hotspot', locked: true },
  sirkuit_terbuka: { label: 'Sirkuit terbuka', color: '#7A1616', heat: '#F26B2A', group: 'Rusak internal', locked: true },
  retak_sel: { label: 'Retak sel', color: '#7A1616', heat: '#E8452E', group: 'Rusak internal', locked: true },
};

export const ACTIONS: Action[] = ['Tunggu', 'Hembus', 'Semprot', 'Lapor'];

export const ACTION_STYLE: Record<Action, { bg: string; fg: string }> = {
  Tunggu: { bg: '#E9EDF2', fg: '#3A4B5D' },
  Hembus: { bg: '#E1ECFB', fg: '#1D4E9E' },
  Semprot: { bg: '#CFE0FA', fg: '#12408A' },
  Lapor: { bg: '#DFF0F2', fg: '#084F57' },
};

export const PRIORITY_STYLE: Record<Priority, { bg: string; fg: string }> = {
  Tinggi: { bg: '#FBE3E0', fg: '#A12414' },
  Sedang: { bg: '#FCE0C2', fg: '#8A4300' },
  Rendah: { bg: '#FBEFC0', fg: '#6B5200' },
};

export const PRIORITY_RANK: Record<Priority, number> = { Tinggi: 0, Sedang: 1, Rendah: 2 };
