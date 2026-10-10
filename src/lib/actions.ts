import type { Action, DecisionItem, Panel, TaskInput } from './types';

export const WIND_LIMIT = 28; // km/jam, batas terbang pada prototipe
export const DEFAULT_SPRAY_ML = 60;

/** Estimasi air untuk sebuah tindakan pada panel. Hanya "Semprot" yang memakai air. */
export function waterFor(panel: Panel, action: Action): number {
  return action === 'Semprot' ? panel.waterMl || DEFAULT_SPRAY_ML : 0;
}

/** Semprot dan Hembus tidak boleh untuk kelas terkunci (rusak internal). */
export function allowedFor(panel: Panel, action: Action): boolean {
  return !(panel.locked && (action === 'Semprot' || action === 'Hembus'));
}

export function taskInputFor(panel: Panel): TaskInput {
  return {
    cls: panel.cls,
    priority: panel.priority ?? 'Rendah',
    distanceM: panel.distanceM,
    actionText: panel.actionText || 'Periksa panel',
    lat: panel.lat,
    lng: panel.lng,
  };
}

/** Keputusan "Lapor" yang disetujui, lengkap dengan data tugas untuk teknisi. */
export function laporItem(panel: Panel): DecisionItem {
  return { panelId: panel.id, action: 'Lapor', status: 'disetujui', waterMl: 0, task: taskInputFor(panel) };
}
