import type { CSSProperties } from 'react';
import { mulberry32 } from '../lib/panels';
import type { Panel } from '../lib/types';

// Gambar RGB dan termal digambar dengan CSS (tanpa foto asli).
// Grid memakai persentase supaya skalanya ikut ukuran wadah.

export type Variant = 'detail' | 'thumb';
const GRID: Record<Variant, { cols: number; rows: number; ratio: string }> = {
  detail: { cols: 8, rows: 5, ratio: '8 / 5' },
  thumb: { cols: 5, rows: 5, ratio: '1 / 1' },
};

interface Spot {
  c: number;
  r: number;
}

function spots(panel: Panel, v: Variant): Spot[] {
  const { cols, rows } = GRID[v];
  const rng = mulberry32(panel.seed);
  const pick = (): Spot => ({ c: 1 + Math.floor(rng() * (cols - 2)), r: 1 + Math.floor(rng() * (rows - 2)) });
  const a = pick();
  if (panel.cls !== 'sel_panas_ganda') return [a];
  let b = pick();
  let guard = 0;
  while (b.c === a.c && b.r === a.r && guard++ < 10) b = pick();
  return [a, b];
}

const pct = (n: number, total: number) => `${((n / total) * 100).toFixed(2)}%`;

function Marker({ s, v }: { s: Spot; v: Variant }) {
  const { cols, rows } = GRID[v];
  const style: CSSProperties = { left: pct(s.c + 0.5, cols), top: pct(s.r + 0.5, rows), width: v === 'thumb' ? '36%' : '17%' };
  return <span className="img-ring" style={style} />;
}

function Heat({ s, v, size, core = '#FFF6B0' }: { s: Spot; v: Variant; size: string; core?: string }) {
  const { cols, rows } = GRID[v];
  const style: CSSProperties = {
    left: pct(s.c + 0.5, cols),
    top: pct(s.r + 0.5, rows),
    width: size,
    background: `radial-gradient(circle, ${core} 0 9%, #FFC93C 18%, #F26B2A 34%, rgba(196,48,139,0) 70%)`,
  };
  return <span className="img-heat" style={style} />;
}

export function ThermalImage({ panel, variant = 'detail', label = true }: { panel: Panel; variant?: Variant; label?: boolean }) {
  const g = GRID[variant];
  const sp = spots(panel, variant);
  const cls = panel.cls;
  const hot = cls === 'sel_panas' || cls === 'sel_panas_ganda';
  const baseGradient =
    cls === 'sirkuit_terbuka'
      ? 'linear-gradient(180deg, #3C1366 0%, #7A2A7C 58%, #D9532E 100%)'
      : cls === 'kotor'
        ? 'linear-gradient(135deg, #2A0B4D, #5B1A6B 55%, #A02E75)'
        : cls === 'vegetasi'
          ? 'linear-gradient(135deg, #2A0B4D, #4A1A70 60%, #6D1F7A)'
          : 'linear-gradient(135deg, #1B0B3B 0%, #3C1366 45%, #6D1F7A 100%)';
  return (
    <div className="img-box thermal" style={{ aspectRatio: g.ratio, background: baseGradient }}>
      <span className="img-grid" style={{ backgroundSize: `${100 / g.cols}% ${100 / g.rows}%` }} />
      {hot && sp.map((s, i) => <Heat key={i} s={s} v={variant} size={variant === 'thumb' ? '90%' : '46%'} />)}
      {cls === 'retak_sel' && <span className="img-crack" />}
      {cls === 'vegetasi' && <span className="img-cool" />}
      {cls !== 'normal' && cls !== 'kotor' && variant === 'detail' && sp.map((s, i) => <Marker key={`m${i}`} s={s} v={variant} />)}
      {label && variant === 'detail' && <span className="img-tag">{panel.tempMax.toFixed(1).replace('.', ',')} °C</span>}
    </div>
  );
}

export function RgbImage({ panel, variant = 'detail' }: { panel: Panel; variant?: Variant }) {
  const g = GRID[variant];
  const sp = spots(panel, variant);
  const cls = panel.cls;
  return (
    <div className="img-box rgb" style={{ aspectRatio: g.ratio }}>
      <span className="img-grid light" style={{ backgroundSize: `${100 / g.cols}% ${100 / g.rows}%` }} />
      {cls === 'kotor' && <span className="img-dust" data-level={panel.dirt} />}
      {cls === 'vegetasi' && <span className="img-green" />}
      {cls === 'retak_sel' && <span className="img-crack rgb" />}
      {(cls === 'sel_panas' || cls === 'sel_panas_ganda' || cls === 'sirkuit_terbuka') &&
        sp.map((s, i) => (
          <span
            key={i}
            className="img-tint"
            style={{ left: pct(s.c, g.cols), top: pct(s.r, g.rows), width: pct(1, g.cols), height: pct(1, g.rows) }}
          />
        ))}
      {cls !== 'normal' && cls !== 'kotor' && variant === 'detail' && sp.map((s, i) => <Marker key={`m${i}`} s={s} v={variant} />)}
    </div>
  );
}
