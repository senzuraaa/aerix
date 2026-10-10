import { useState } from 'react';
import { WIND_LIMIT } from '../lib/actions';
import { BASE, MISSION_VIEW, PATH_D, inAir, missionLabel, restartMission, returnToBase, togglePause, useMission } from '../lib/mission';
import { liters } from '../lib/notify';
import { useStore } from '../lib/store';
import ConfirmDialog from './ConfirmDialog';
import Icon from './Icon';

/** Kartu "Misi Langsung": jalur zig-zag, telemetri, dan kendali. Seluruhnya simulasi. */
export default function MissionCard({ large = false }: { large?: boolean }) {
  const m = useMission();
  const { wind } = useStore();
  const [confirm, setConfirm] = useState(false);

  const flying = inAir(m);
  const held = m.phase === 'terbang' && m.windHold;
  const coverage = Math.round(m.progress * 100);
  const tone = held || m.emergency ? 'warn' : m.phase === 'selesai' ? 'ok' : 'info';

  return (
    <section className={large ? 'card mission mission-lg' : 'card mission'} aria-labelledby="mission-title">
      <header className="card-head">
        <h2 id="mission-title" className="card-title">
          Misi Langsung
        </h2>
        <span className="tag-sim">Simulasi</span>
      </header>

      <p className={`mission-status ${tone}`} role="status">
        {missionLabel(m)}
      </p>

      <div className="mission-grid">
        <svg className="mission-map" viewBox={`0 0 ${MISSION_VIEW.w} ${MISSION_VIEW.h}`} role="img" aria-label="Skema jalur zig-zag drone di atas zona (simulasi)">
          <rect className="mm-field" x="48" y="10" width="242" height="142" rx="6" />
          <path className="mm-path" d={PATH_D} />
          <path className="mm-done" d={PATH_D} pathLength={1} strokeDasharray={`${m.progress} 1`} />
          <g className="mm-base">
            <rect x={BASE.x - 11} y={BASE.y - 11} width="22" height="22" rx="5" />
            <text x={BASE.x} y={BASE.y + 4} textAnchor="middle">
              H
            </text>
          </g>
          <g className="mm-drone" style={{ transform: `translate(${m.x}px, ${m.y}px)` }}>
            {m.spraying && <circle className="mm-spray" r="13" />}
            <circle className="mm-rotor" cx="-6" cy="-6" r="3" />
            <circle className="mm-rotor" cx="6" cy="-6" r="3" />
            <circle className="mm-rotor" cx="-6" cy="6" r="3" />
            <circle className="mm-rotor" cx="6" cy="6" r="3" />
            <circle className="mm-body" r="4.5" />
          </g>
        </svg>

        <div className="mission-info">
          <dl className="telemetry">
            <div>
              <dt>
                <Icon name="battery" size={16} />
                Baterai
              </dt>
              <dd>{Math.round(m.battery)}%</dd>
            </div>
            <div>
              <dt>
                <Icon name="signal" size={16} />
                Sinyal RTK
              </dt>
              <dd>Fix</dd>
            </div>
            <div>
              <dt>
                <Icon name="lidar" size={16} />
                Jarak Lidar
              </dt>
              <dd>15 cm</dd>
            </div>
            <div>
              <dt>
                <Icon name="drop" size={16} />
                Air tersisa
              </dt>
              <dd>{liters(m.waterMl)}</dd>
            </div>
          </dl>

          <div className="progress-block">
            <div className="progress-label">
              <span id="coverage-label">Progres cakupan</span>
              <strong>{coverage}%</strong>
            </div>
            <div className="bar" role="progressbar" aria-labelledby="coverage-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coverage}>
              <span style={{ width: `${coverage}%` }} />
            </div>
          </div>

          {wind > WIND_LIMIT && (
            <p className="note warn">
              Angin {wind} km/jam di atas batas {WIND_LIMIT} km/jam, misi ditunda.
            </p>
          )}

          <div className="mission-actions">
            {flying ? (
              <button type="button" className="btn" onClick={togglePause}>
                <Icon name={m.phase === 'jeda' ? 'play' : 'pause'} size={16} />
                {m.phase === 'jeda' ? 'Lanjutkan' : 'Jeda'}
              </button>
            ) : (
              <button type="button" className="btn" onClick={restartMission} disabled={m.phase === 'kembali'}>
                <Icon name="play" size={16} />
                Ulangi simulasi
              </button>
            )}
            <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)} disabled={!flying}>
              <Icon name="home" size={16} />
              Kembali ke Pangkalan (Darurat)
            </button>
          </div>
          <p className="muted small">Telemetri dan posisi adalah simulasi, bukan data drone nyata.</p>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Kembali ke pangkalan sekarang?"
        confirmLabel="Ya, pulang darurat"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          returnToBase();
        }}
      >
        <p>Misi dihentikan dan drone langsung kembali ke titik H. Cakupan yang belum selesai tidak dilanjutkan.</p>
      </ConfirmDialog>
    </section>
  );
}
