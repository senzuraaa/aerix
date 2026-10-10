import { memo, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ActionChip, ClassChip } from '../../components/Chips';
import Icon from '../../components/Icon';
import { RgbImage, ThermalImage } from '../../components/PanelImages';
import { laporItem } from '../../lib/actions';
import { CLASS_INFO, CLASS_ORDER } from '../../lib/classes';
import { missionLabel, useMission } from '../../lib/mission';
import { formatId, formatTime } from '../../lib/notify';
import { COLS, PANELS, REPORTABLE_COUNT, ROWS, ZONES } from '../../lib/panels';
import { useStore } from '../../lib/store';
import type { Panel, PanelClass } from '../../lib/types';
import { matches, useOperator, type Severity } from './filters';

type MapMode = 'rgb' | 'termal' | 'bandingkan';
const MODES: { value: MapMode; label: string }[] = [
  { value: 'rgb', label: 'RGB' },
  { value: 'termal', label: 'Termal' },
  { value: 'bandingkan', label: 'Bandingkan' },
];

const BY_ZONE = new Map(ZONES.map((z) => [z, PANELS.filter((p) => p.zone === z)]));

// Warna kelas diteruskan sebagai variabel CSS supaya CLASS_INFO tetap satu-satunya sumber warna.
const CLASS_VARS: CSSProperties & Record<`--${string}`, string> = {};
for (const c of CLASS_ORDER) {
  CLASS_VARS[`--c-${c}`] = CLASS_INFO[c].color;
  CLASS_VARS[`--h-${c}`] = CLASS_INFO[c].heat;
}

const LEGEND: { label: string; classes: PanelClass[] }[] = [
  { label: 'Normal', classes: ['normal'] },
  { label: 'Kotor', classes: ['kotor'] },
  { label: 'Vegetasi', classes: ['vegetasi'] },
  { label: 'Sel panas · Sel panas ganda', classes: ['sel_panas', 'sel_panas_ganda'] },
  { label: 'Sirkuit terbuka · Retak sel', classes: ['sirkuit_terbuka', 'retak_sel'] },
];

interface ZoneProps {
  zone: number;
  filterZone: number;
  severity: Severity;
  query: string;
  selectedId: string;
  onSelect: (id: string) => void;
}

const ZoneBlock = memo(function ZoneBlock({ zone, filterZone, severity, query, selectedId, onSelect }: ZoneProps) {
  const list = BY_ZONE.get(zone) ?? [];
  const ref = useRef<HTMLDivElement>(null);
  // Roving tabindex: satu kotak per zona yang masuk urutan Tab, sisanya dicapai dengan tombol panah.
  const [cursor, setCursor] = useState(() => list.find((p) => p.id === selectedId)?.key ?? `${zone}-1-1`);
  const findings = useMemo(() => list.filter((p) => p.cls !== 'normal').length, [list]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const row = Number(t.dataset.row);
    const col = Number(t.dataset.col);
    if (!row || !col) return;
    let r = row;
    let c = col;
    switch (e.key) {
      case 'ArrowRight':
        c = Math.min(COLS, col + 1);
        break;
      case 'ArrowLeft':
        c = Math.max(1, col - 1);
        break;
      case 'ArrowDown':
        r = Math.min(ROWS, row + 1);
        break;
      case 'ArrowUp':
        r = Math.max(1, row - 1);
        break;
      case 'Home':
        c = 1;
        break;
      case 'End':
        c = COLS;
        break;
      default:
        return;
    }
    e.preventDefault();
    const key = `${zone}-${r}-${c}`;
    setCursor(key);
    ref.current?.querySelector<HTMLButtonElement>(`[data-key="${key}"]`)?.focus();
  };

  return (
    <section className="zone" aria-label={`Zona ${zone}`}>
      <header className="zone-head">
        <h3>Zona {zone}</h3>
        <span>{findings} temuan</span>
      </header>
      <div className="zone-grid" ref={ref} onKeyDown={onKeyDown}>
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            className="cell"
            data-cls={p.cls}
            data-key={p.key}
            data-row={p.row}
            data-col={p.col}
            data-dim={matches(p, filterZone, severity, query) ? undefined : ''}
            aria-label={`${p.id}, ${CLASS_INFO[p.cls].label}`}
            aria-pressed={p.id === selectedId}
            title={`${p.id} · ${CLASS_INFO[p.cls].label}`}
            tabIndex={p.key === cursor ? 0 : -1}
            onClick={() => {
              setCursor(p.key);
              onSelect(p.id);
            }}
          />
        ))}
      </div>
    </section>
  );
});

function BaseBlock() {
  const m = useMission();
  return (
    <section className="zone zone-base" aria-label="Pangkalan Drone">
      <header className="zone-head">
        <h3>Pangkalan Drone</h3>
      </header>
      <div className="base-body">
        <span className="base-pad" aria-hidden="true">
          H
        </span>
        <p className="base-name">
          <Icon name="drone" size={18} />
          AERIX-01
        </p>
        <p className="muted small">{missionLabel(m)}</p>
        <p className="muted small">Status simulasi</p>
      </div>
    </section>
  );
}

function PanelDetail({ panel }: { panel: Panel }) {
  const { decisions, tasks, decide } = useStore();
  const dec = decisions.get(panel.id);
  const task = tasks.find((t) => t.panelId === panel.id);
  const normal = panel.cls === 'normal';

  const history: { text: string; time?: string }[] = [
    { text: 'Dipindai drone pada sortie pagi (contoh)' },
    { text: `Terdeteksi: ${CLASS_INFO[panel.cls].label} (simulasi)` },
  ];
  if (dec && dec.status !== 'menunggu') {
    history.push({ text: `Operator ${dec.status === 'disetujui' ? 'menyetujui' : 'menolak'} tindakan ${dec.action}`, time: formatTime(dec.updatedAt) });
  }
  if (task) {
    history.push({ text: 'Tugas dibuat untuk teknisi', time: formatTime(task.createdAt) });
    if (task.status === 'dikerjakan') history.push({ text: 'Sedang dikerjakan teknisi', time: formatTime(task.updatedAt) });
    if (task.status === 'selesai') history.push({ text: `Selesai oleh teknisi${task.actionDone ? `: ${task.actionDone}` : ''}`, time: formatTime(task.updatedAt) });
  }

  return (
    <aside className="card detail" aria-labelledby="detail-title">
      <header className="card-head">
        <h2 id="detail-title" className="card-title">
          Detail Panel
        </h2>
      </header>
      <div className="detail-id">
        <span className="mono">{panel.id}</span>
        <ClassChip cls={panel.cls} />
      </div>

      <div className="img-pair">
        <figure>
          <RgbImage panel={panel} />
          <figcaption>RGB</figcaption>
        </figure>
        <figure>
          <ThermalImage panel={panel} />
          <figcaption>Termal IR</figcaption>
        </figure>
      </div>
      <p className="muted small">Gambar dibuat dengan CSS sebagai ilustrasi, bukan foto drone.</p>

      <dl className="kv">
        <div>
          <dt>Zona</dt>
          <dd>Zona {panel.zone}</dd>
        </div>
        <div>
          <dt>String</dt>
          <dd>S{String(panel.string).padStart(2, '0')}</dd>
        </div>
        <div>
          <dt>Baris / Kolom</dt>
          <dd>
            {panel.row} / {panel.col}
          </dd>
        </div>
        <div>
          <dt>Koordinat GPS (contoh)</dt>
          <dd className="mono">
            {panel.lat.toFixed(5)}, {panel.lng.toFixed(5)}
          </dd>
        </div>
      </dl>

      <div className="progress-block">
        <div className="progress-label">
          <span id="conf-label">Keyakinan model (simulasi)</span>
          <strong>{panel.confidence}%</strong>
        </div>
        <div className="bar" role="progressbar" aria-labelledby="conf-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={panel.confidence}>
          <span style={{ width: `${panel.confidence}%` }} />
        </div>
      </div>

      <div className="detail-rec">
        <p className="label">Tindakan direkomendasikan</p>
        {panel.recommended ? <ActionChip action={panel.recommended} /> : <span className="chip chip-class">Tidak ada tindakan</span>}
        <p className="detail-reason">{panel.reason}</p>
        {panel.locked && (
          <p className="lock-note">
            <Icon name="lock" size={14} />
            Semprot dikunci: rusak internal
          </p>
        )}
      </div>

      <button type="button" className="btn btn-primary btn-block" disabled={normal || Boolean(task)} onClick={() => void decide([laporItem(panel)])}>
        <Icon name="send" size={16} />
        {task ? 'Sudah diteruskan ke teknisi' : 'Teruskan ke teknisi'}
      </button>
      {normal && <p className="muted small">Panel normal, tidak ada yang perlu diteruskan.</p>}

      <h3 className="detail-sub">Riwayat panel</h3>
      <ol className="timeline">
        {history.map((h, i) => (
          <li key={i}>
            <span>{h.text}</span>
            {h.time && <time>{h.time}</time>}
          </li>
        ))}
      </ol>
    </aside>
  );
}

export default function PetaKondisi() {
  const { panels, panelById, tasks } = useStore();
  const { zone, severity, query, selectedId, setSelectedId } = useOperator();
  const [mode, setMode] = useState<MapMode>('rgb');

  const counts = useMemo(
    () => ({
      total: panels.length,
      kotor: panels.filter((p) => p.cls === 'kotor').length,
      normal: panels.filter((p) => p.cls === 'normal').length,
    }),
    [panels]
  );
  const shown = useMemo(() => panels.filter((p) => matches(p, zone, severity, query)).length, [panels, zone, severity, query]);
  const selected = panelById.get(selectedId) ?? null;

  return (
    <div className="stack">
      <div className="stats">
        <div className="card stat">
          <p className="stat-label">Panel diperiksa</p>
          <p className="stat-value">{formatId(counts.total)}</p>
          <p className="stat-sub">panel contoh dari sekitar 22.000</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Perlu dibersihkan</p>
          <p className="stat-value">{formatId(counts.kotor)}</p>
          <p className="stat-sub">kelas Kotor</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Dilaporkan ke teknisi</p>
          <p className="stat-value">{formatId(tasks.length)}</p>
          <p className="stat-sub">dari {formatId(REPORTABLE_COUNT)} temuan yang perlu dilaporkan</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Panel normal</p>
          <p className="stat-value">{formatId(counts.normal)}</p>
          <p className="stat-sub">tanpa temuan</p>
        </div>
      </div>

      <div className="peta-layout">
        <section className="card map-card" aria-labelledby="map-title" data-mode={mode} style={CLASS_VARS}>
          <header className="card-head map-head">
            <div>
              <h2 id="map-title" className="card-title">
                Peta 5 zona
              </h2>
              <p className="muted small">
                {formatId(shown)} dari {formatId(counts.total)} panel cocok dengan filter. Tombol panah berpindah antar panel dalam satu zona.
              </p>
            </div>
            <div className="seg" role="group" aria-label="Tampilan peta">
              {MODES.map((m) => (
                <button key={m.value} type="button" className="seg-item" aria-pressed={mode === m.value} onClick={() => setMode(m.value)}>
                  {m.label}
                </button>
              ))}
            </div>
          </header>

          <ul className="legend" aria-label="Legenda">
            {LEGEND.map((l) => (
              <li key={l.label}>
                {l.classes.map((c) => (
                  <span key={c} className="swatch" data-cls={c} aria-hidden="true" />
                ))}
                {l.label}
              </li>
            ))}
          </ul>

          <div className="zones">
            {ZONES.map((z) => (
              <ZoneBlock key={z} zone={z} filterZone={zone} severity={severity} query={query} selectedId={selectedId} onSelect={setSelectedId} />
            ))}
            <BaseBlock />
          </div>
        </section>

        {selected ? (
          <PanelDetail panel={selected} />
        ) : (
          <aside className="card detail">
            <h2 className="card-title">Detail Panel</h2>
            <p className="muted">Pilih satu kotak pada peta untuk melihat detailnya.</p>
          </aside>
        )}
      </div>
    </div>
  );
}
