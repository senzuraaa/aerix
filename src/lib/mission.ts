import { useSyncExternalStore } from 'react';
import { WIND_LIMIT } from './actions';

// Simulasi misi drone. Keadaan disimpan di luar komponen supaya tidak reset saat pindah halaman.
// Semua angka di sini ilustratif, bukan telemetri drone sungguhan.

export interface Pt {
  x: number;
  y: number;
}

export const MISSION_VIEW = { w: 300, h: 180 };
export const BASE: Pt = { x: 22, y: 160 };

const LANES = 6;

function buildPath(): Pt[] {
  const left = 60;
  const right = 278;
  const top = 22;
  const bottom = 140;
  const pts: Pt[] = [];
  for (let i = 0; i < LANES; i++) {
    const y = top + ((bottom - top) / (LANES - 1)) * i;
    if (i % 2 === 0) pts.push({ x: left, y }, { x: right, y });
    else pts.push({ x: right, y }, { x: left, y });
  }
  return pts;
}

export const PATH: Pt[] = buildPath();
export const PATH_D = PATH.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

const SEG = PATH.slice(1).map((p, i) => Math.hypot(p.x - PATH[i].x, p.y - PATH[i].y));
const TOTAL = SEG.reduce((a, b) => a + b, 0);

function pointAt(fraction: number): Pt {
  let d = Math.min(1, Math.max(0, fraction)) * TOTAL;
  for (let i = 0; i < SEG.length; i++) {
    if (d <= SEG[i]) {
      const t = SEG[i] === 0 ? 0 : d / SEG[i];
      return { x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * t, y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * t };
    }
    d -= SEG[i];
  }
  return PATH[PATH.length - 1];
}

export type MissionPhase = 'terbang' | 'jeda' | 'kembali' | 'pangkalan' | 'selesai';

export interface MissionState {
  phase: MissionPhase;
  progress: number; // 0..1 sepanjang jalur
  x: number;
  y: number;
  battery: number; // persen
  waterMl: number;
  spraying: boolean;
  windHold: boolean;
  emergency: boolean;
  ticks: number;
}

const START = 0.58;
const SPEED = 0.003; // bagian jalur per detik
const RETURN_STEP = 26; // satuan peta per detik
const DRAIN = 0.04; // persen baterai per detik
const SPRAY_ML = 12;

function initial(windHold: boolean): MissionState {
  const p = pointAt(START);
  return { phase: 'terbang', progress: START, x: p.x, y: p.y, battery: 62, waterMl: 1600, spraying: false, windHold, emergency: false, ticks: 0 };
}

let state: MissionState = initial(false);
const listeners = new Set<() => void>();
let timer: number | undefined;

function set(patch: Partial<MissionState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

function tick(): void {
  const s = state;
  if (s.phase === 'kembali') {
    const dx = BASE.x - s.x;
    const dy = BASE.y - s.y;
    const d = Math.hypot(dx, dy);
    const battery = Math.max(0, s.battery - DRAIN);
    if (d <= RETURN_STEP) set({ x: BASE.x, y: BASE.y, battery, phase: s.emergency ? 'pangkalan' : 'selesai' });
    else set({ x: s.x + (dx / d) * RETURN_STEP, y: s.y + (dy / d) * RETURN_STEP, battery });
    return;
  }
  if (s.phase !== 'terbang') return;
  if (s.windHold) {
    if (s.spraying) set({ spraying: false });
    return;
  }
  const ticks = s.ticks + 1;
  const spraying = s.waterMl > 0 && ticks % 9 < 3;
  const progress = Math.min(1, s.progress + SPEED);
  const p = pointAt(progress);
  const done = progress >= 1;
  set({
    ticks,
    progress,
    x: p.x,
    y: p.y,
    spraying: spraying && !done,
    waterMl: spraying ? Math.max(0, s.waterMl - SPRAY_ML) : s.waterMl,
    battery: Math.max(0, s.battery - DRAIN),
    phase: done ? 'kembali' : 'terbang',
  });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  if (timer === undefined) timer = window.setInterval(tick, 1000);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

const getSnapshot = (): MissionState => state;

export function useMission(): MissionState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function inAir(s: MissionState): boolean {
  return s.phase === 'terbang' || s.phase === 'jeda';
}

export function togglePause(): void {
  if (state.phase === 'terbang') set({ phase: 'jeda', spraying: false });
  else if (state.phase === 'jeda') set({ phase: 'terbang' });
}

export function returnToBase(): void {
  if (inAir(state)) set({ phase: 'kembali', emergency: true, spraying: false });
}

export function restartMission(): void {
  set(initial(state.windHold));
}

export function setWindHold(hold: boolean): void {
  if (state.windHold !== hold) set({ windHold: hold });
}

export function missionLabel(s: MissionState): string {
  switch (s.phase) {
    case 'terbang':
      if (s.windHold) return `Ditunda: angin di atas ${WIND_LIMIT} km/jam`;
      return s.spraying ? 'Terbang, sedang menyemprot' : 'Terbang';
    case 'jeda':
      return 'Dijeda operator';
    case 'kembali':
      return s.emergency ? 'Kembali ke pangkalan (darurat)' : 'Cakupan selesai, kembali ke pangkalan';
    case 'pangkalan':
      return 'Di pangkalan setelah pulang darurat';
    case 'selesai':
      return 'Misi selesai, drone di pangkalan';
  }
}
