export type PanelClass =
  | 'normal'
  | 'kotor'
  | 'vegetasi'
  | 'sel_panas'
  | 'sel_panas_ganda'
  | 'sirkuit_terbuka'
  | 'retak_sel';

export type Action = 'Tunggu' | 'Hembus' | 'Semprot' | 'Lapor';
export type Priority = 'Tinggi' | 'Sedang' | 'Rendah';
export type DecisionStatus = 'menunggu' | 'disetujui' | 'ditolak';
export type TaskStatus = 'baru' | 'dikerjakan' | 'selesai';

export interface Panel {
  id: string;
  key: string; // `${zona}-${baris}-${kolom}`
  zone: number;
  row: number;
  col: number;
  string: number;
  cls: PanelClass;
  confidence: number;
  tempMax: number;
  iecScore: number | null; // skala placeholder, sesuaikan dengan metode penilaian sebenarnya
  lat: number;
  lng: number;
  distanceM: number;
  dirt: 0 | 1 | 2 | 3;
  recommended: Action | null;
  reason: string;
  waterMl: number;
  locked: boolean; // semprot dikunci (rusak internal)
  priority: Priority | null;
  actionText: string;
  pinned: boolean;
  seed: number;
}

export interface Decision {
  panelId: string;
  action: Action;
  status: DecisionStatus;
  waterMl: number;
  updatedAt: string;
}

export interface Task {
  id: string;
  panelId: string;
  cls: PanelClass;
  priority: Priority;
  distanceM: number;
  actionText: string;
  status: TaskStatus;
  actionDone: string | null;
  note: string | null;
  safetyChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServerConfig {
  push: boolean;
  telegram: boolean;
  pinRequired: boolean;
}

export interface ServerState {
  decisions: Decision[];
  tasks: Task[];
  config: ServerConfig;
}

export interface TaskInput {
  cls: PanelClass;
  priority: Priority;
  distanceM: number;
  actionText: string;
  lat: number;
  lng: number;
}

export interface DecisionItem {
  panelId: string;
  action: Action;
  status: DecisionStatus;
  waterMl: number;
  task?: TaskInput;
}

export interface TaskPatch {
  id: string;
  status?: TaskStatus;
  actionDone?: string | null;
  note?: string | null;
  safetyChecked?: boolean;
}

export interface PostResult {
  created: string[];
  push: number;
  telegram: boolean;
}
