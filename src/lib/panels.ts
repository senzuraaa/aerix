import { CLASS_INFO, PRIORITY_RANK } from './classes';
import type { Action, Panel, PanelClass, Priority } from './types';

// Data panel CONTOH yang dibangkitkan deterministik (seed tetap).
// 5 zona x (12 baris x 10 kolom) = 600 panel contoh dari sekitar 22.000 panel PLTS Oelpuah.

export const ROWS = 12;
export const COLS = 10;
export const ZONES = [1, 2, 3, 4, 5];

const SITE = { lat: -10.1376, lng: 123.7021 }; // titik contoh, bukan koordinat resmi
const TECH = { lat: -10.1381, lng: 123.7019 }; // posisi teknisi contoh

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Pin {
  string: number;
  cls: PanelClass;
  conf: number;
  temp?: number;
  dirt?: 1 | 2 | 3;
  water?: number;
}

// Panel "pin": sama dengan yang ada di mockup, sehingga gambar di esai dan prototipe konsisten.
export const PINNED_KEYS = ['4-8-2', '4-11-7', '5-1-10', '2-12-5', '2-9-6', '4-6-6', '1-5-7'];
const PINNED: Record<string, Pin> = {
  '4-8-2': { string: 3, cls: 'kotor', conf: 93, dirt: 2 },
  '4-11-7': { string: 5, cls: 'kotor', conf: 95, dirt: 3, water: 80 },
  '5-1-10': { string: 2, cls: 'vegetasi', conf: 88 },
  '2-12-5': { string: 7, cls: 'sel_panas', conf: 94, temp: 74.2 },
  '2-9-6': { string: 4, cls: 'sel_panas_ganda', conf: 91, temp: 68.5 },
  '4-6-6': { string: 8, cls: 'sirkuit_terbuka', conf: 90 },
  '1-5-7': { string: 6, cls: 'retak_sel', conf: 87 },
};

const IEC: Partial<Record<PanelClass, number>> = {
  sel_panas: 2,
  sel_panas_ganda: 3,
  sirkuit_terbuka: 4,
  retak_sel: 3,
};

interface Derived {
  recommended: Action | null;
  reason: string;
  waterMl: number;
  priority: Priority | null;
  actionText: string;
}

function derive(cls: PanelClass, dirt: number, temp: number, waterOverride: number | undefined, rng: () => number): Derived {
  switch (cls) {
    case 'normal':
      return { recommended: null, reason: 'Panel normal', waterMl: 0, priority: null, actionText: '' };
    case 'kotor':
      if (dirt === 1)
        return { recommended: 'Tunggu', reason: 'Kotor ringan, di bawah ambang pembersihan', waterMl: 0, priority: null, actionText: 'Bersihkan manual' };
      if (dirt === 2)
        return { recommended: 'Hembus', reason: 'Debu tipis merata, angin tenang', waterMl: 0, priority: null, actionText: 'Bersihkan manual' };
      return {
        recommended: 'Semprot',
        reason: 'Kotoran lekat, hembusan tidak cukup',
        waterMl: waterOverride ?? 50 + Math.floor(rng() * 11) * 5,
        priority: null,
        actionText: 'Bersihkan manual',
      };
    case 'vegetasi':
      return { recommended: 'Lapor', reason: 'Tumbuhan menutupi tepi panel', waterMl: 0, priority: 'Rendah', actionText: 'Pangkas tumbuhan di tepi panel' };
    case 'sel_panas':
      return {
        recommended: 'Lapor',
        reason: `Suhu ${temp.toFixed(1).replace('.', ',')} °C, jauh di atas sekitar`,
        waterMl: 0,
        priority: 'Tinggi',
        actionText: 'Cek sambungan, ukur ulang suhu',
      };
    case 'sel_panas_ganda':
      return { recommended: 'Lapor', reason: 'Beberapa sel panas dalam satu panel', waterMl: 0, priority: 'Tinggi', actionText: 'Cek sambungan, ganti bila perlu' };
    case 'sirkuit_terbuka':
      return { recommended: 'Lapor', reason: 'Daya string turun, panel tidak menghantar', waterMl: 0, priority: 'Tinggi', actionText: 'Periksa string dan kabel' };
    case 'retak_sel':
      return { recommended: 'Lapor', reason: 'Pola retak tampak pada citra IR', waterMl: 0, priority: 'Sedang', actionText: 'Ganti panel, catat serial' };
  }
}

const DIRT_BASE = [0.08, 0.12, 0.22, 0.26, 0.14];

function buildPanels(): Panel[] {
  const out: Panel[] = [];
  for (const zone of ZONES) {
    for (let row = 1; row <= ROWS; row++) {
      for (let col = 1; col <= COLS; col++) {
        const key = `${zone}-${row}-${col}`;
        const pin = PINNED[key];
        const rng = mulberry32(hash(`aerix-${key}`));
        let cls: PanelClass;
        let dirt: 0 | 1 | 2 | 3 = 0;

        if (pin) {
          cls = pin.cls;
          dirt = pin.dirt ?? 0;
        } else {
          const n = (Math.sin(col * 0.85 + zone * 1.7) + Math.sin(row * 0.6 + zone * 2.3) + 2) / 4;
          const pDirt = DIRT_BASE[zone - 1] * (0.35 + 1.5 * n);
          const edge = col === COLS || row === 1 || row === ROWS ? 4 : 1;
          const u = rng();
          const v = rng();
          const d = rng();
          const veg = 0.007 * edge;
          if (u < pDirt) {
            cls = 'kotor';
            dirt = d < 0.35 ? 1 : d < 0.75 ? 2 : 3;
          } else if (v < veg) cls = 'vegetasi';
          else if (v < veg + 0.008) cls = 'sel_panas';
          else if (v < veg + 0.012) cls = 'sel_panas_ganda';
          else if (v < veg + 0.017) cls = 'sirkuit_terbuka';
          else if (v < veg + 0.023) cls = 'retak_sel';
          else cls = 'normal';
        }

        const stringNo = pin ? pin.string : ((row + col * 2 + zone) % 8) + 1;
        const temp =
          pin?.temp ??
          (cls === 'sel_panas'
            ? 70 + rng() * 10
            : cls === 'sel_panas_ganda'
              ? 62 + rng() * 10
              : 36 + rng() * 8);
        const rounded = Math.round(temp * 10) / 10;
        const conf = pin?.conf ?? 82 + Math.floor(rng() * 17);
        const lat = SITE.lat - (zone >= 4 ? 0.0022 : 0) - row * 0.000013;
        const lng = SITE.lng + ((zone - 1) % 3) * 0.0014 + col * 0.000019;
        const info = derive(cls, dirt, rounded, pin?.water, rng);

        out.push({
          id: `Z${zone}-S${pad(stringNo)}-B${pad(row)}-K${pad(col)}`,
          key,
          zone,
          row,
          col,
          string: stringNo,
          cls,
          confidence: conf,
          tempMax: rounded,
          iecScore: IEC[cls] ?? null,
          lat,
          lng,
          distanceM: Math.round(haversine(TECH.lat, TECH.lng, lat, lng)),
          dirt,
          recommended: info.recommended,
          reason: info.reason,
          waterMl: info.waterMl,
          locked: CLASS_INFO[cls].locked,
          priority: info.priority,
          actionText: info.actionText,
          pinned: Boolean(pin),
          seed: hash(`img-${key}`),
        });
      }
    }
  }
  return out;
}

export const PANELS: Panel[] = buildPanels();
export const PANEL_BY_ID = new Map(PANELS.map((p) => [p.id, p]));
export const PINNED_IDS: string[] = PINNED_KEYS.map((k) => PANELS.find((p) => p.key === k)!.id);

/** Urutan tabel rekomendasi: panel pin dulu (sama dengan mockup), lalu sisanya menurut prioritas. */
export function tableOrder(): Panel[] {
  const pinned = PINNED_IDS.map((id) => PANEL_BY_ID.get(id)!);
  const pinnedSet = new Set(PINNED_IDS);
  const rest = PANELS.filter((p) => p.cls !== 'normal' && !pinnedSet.has(p.id)).sort((a, b) => {
    const ra = a.priority ? PRIORITY_RANK[a.priority] : 3;
    const rb = b.priority ? PRIORITY_RANK[b.priority] : 3;
    return ra - rb || b.dirt - a.dirt || a.distanceM - b.distanceM;
  });
  return [...pinned, ...rest];
}

export const TABLE_ORDER: Panel[] = tableOrder();
export const REPORTABLE_COUNT = PANELS.filter((p) => p.recommended === 'Lapor').length;
