import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClassChip, PriorityChip } from '../../components/Chips';
import ConfirmDialog from '../../components/ConfirmDialog';
import Icon from '../../components/Icon';
import { RgbImage, ThermalImage } from '../../components/PanelImages';
import { CLASS_INFO } from '../../lib/classes';
import { COLS, ROWS } from '../../lib/panels';
import { useStore } from '../../lib/store';
import type { Panel, PanelClass, Task } from '../../lib/types';

const DONE_ACTIONS = ['Bersihkan manual', 'Ganti panel', 'Cek sambungan', 'Pangkas vegetasi'];
const FALSE_ALARM = 'Salah deteksi / masalah tidak ditemukan';

const DEFAULT_ACTION: Record<PanelClass, string> = {
  normal: 'Bersihkan manual',
  kotor: 'Bersihkan manual',
  vegetasi: 'Pangkas vegetasi',
  sel_panas: 'Cek sambungan',
  sel_panas_ganda: 'Cek sambungan',
  sirkuit_terbuka: 'Cek sambungan',
  retak_sel: 'Ganti panel',
};

/** Skema posisi panel di antara lima zona. Bukan peta sebenarnya. */
function MiniMap({ panel }: { panel: Panel }) {
  const zoneRect = (z: number) => ({ x: 8 + ((z - 1) % 3) * 64, y: z >= 4 ? 62 : 8, w: 56, h: 46 });
  const r = zoneRect(panel.zone);
  const px = r.x + ((panel.col - 0.5) / COLS) * r.w;
  const py = r.y + ((panel.row - 0.5) / ROWS) * r.h;
  return (
    <svg className="minimap" viewBox="0 0 200 116" role="img" aria-label={`Skema lokasi: panel berada di Zona ${panel.zone}, baris ${panel.row}, kolom ${panel.col}`}>
      {[1, 2, 3, 4, 5].map((z) => {
        const q = zoneRect(z);
        return (
          <g key={z}>
            <rect className={z === panel.zone ? 'mini-zone on' : 'mini-zone'} x={q.x} y={q.y} width={q.w} height={q.h} rx="4" />
            <text className="mini-text" x={q.x + 5} y={q.y + 12}>
              Z{z}
            </text>
          </g>
        );
      })}
      <rect className="mini-base" x={136} y={62} width={56} height={46} rx="4" />
      <text className="mini-text" x={141} y={74}>
        Pangkalan
      </text>
      <circle className="mini-pin-halo" cx={px} cy={py} r="7" />
      <circle className="mini-pin" cx={px} cy={py} r="3.5" />
    </svg>
  );
}

function FollowUp({ task }: { task: Task }) {
  const { updateTask, toast, pendingTaskIds } = useStore();
  const navigate = useNavigate();
  const [action, setAction] = useState(task.actionDone ?? DEFAULT_ACTION[task.cls]);
  const [note, setNote] = useState(task.note ?? '');
  const [checked, setChecked] = useState(task.safetyChecked);
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmFalse, setConfirmFalse] = useState(false);
  const done = task.status === 'selesai';

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  // Interaksi pertama pada tugas baru mengubah statusnya menjadi "dikerjakan".
  const touch = (patch: { actionDone?: string; safetyChecked?: boolean; note?: string } = {}) => {
    if (done) return;
    void updateTask({ id: task.id, ...(task.status === 'baru' ? { status: 'dikerjakan' as const } : {}), ...patch });
  };

  const finish = (actionDone: string) => {
    void updateTask({ id: task.id, status: 'selesai', actionDone, note: note.trim() || null, safetyChecked: checked });
    toast(`Tugas ${task.panelId} ditandai selesai`, 'ok');
    navigate('/teknisi');
  };

  if (done) {
    return (
      <section className="card form-block" aria-labelledby="tl-title">
        <h2 id="tl-title" className="card-title">
          Tindak Lanjut
        </h2>
        <p className="badge ok">
          <Icon name="checkCircle" size={14} />
          Selesai
        </p>
        <dl className="kv">
          <div>
            <dt>Tindakan yang dilakukan</dt>
            <dd>{task.actionDone ?? '–'}</dd>
          </div>
          <div>
            <dt>Catatan</dt>
            <dd>{task.note || '–'}</dd>
          </div>
        </dl>
        {pendingTaskIds.has(task.id) && <p className="badge warn">Menunggu sinkron</p>}
      </section>
    );
  }

  return (
    <>
      <section className="card form-block" aria-labelledby="tl-title">
        <h2 id="tl-title" className="card-title">
          Tindak Lanjut
        </h2>

        <fieldset className="radio-list">
          <legend>Tindakan yang dilakukan</legend>
          {DONE_ACTIONS.map((a) => (
            <label key={a} className="radio-row">
              <input
                type="radio"
                name="tindakan"
                value={a}
                checked={action === a}
                onChange={() => {
                  setAction(a);
                  touch({ actionDone: a });
                }}
              />
              <span>{a}</span>
            </label>
          ))}
        </fieldset>

        <label className="field">
          <span>Catatan</span>
          <textarea
            className="input"
            rows={3}
            maxLength={1000}
            value={note}
            placeholder="Kondisi di lapangan, nomor seri pengganti, dan sebagainya"
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note.trim() !== (task.note ?? '')) touch({ note: note.trim() });
            }}
          />
        </label>

        <div className="photo">
          <input
            id="foto"
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhoto(URL.createObjectURL(f));
              touch();
            }}
          />
          <label htmlFor="foto" className="btn btn-block">
            <Icon name="camera" size={18} />
            {photo ? 'Ganti foto bukti' : 'Tambah foto bukti'}
          </label>
          {photo && <img className="photo-preview" src={photo} alt="Pratinjau foto bukti" />}
          <p className="muted small">Foto hanya pratinjau di perangkat ini. Prototipe belum mengunggah atau menyimpannya.</p>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked);
              touch({ safetyChecked: e.target.checked });
            }}
          />
          <span>Daftar periksa keselamatan selesai</span>
        </label>

        <button type="button" className="btn-link" onClick={() => setConfirmFalse(true)}>
          {FALSE_ALARM}
        </button>
      </section>

      <div className="sticky-action">
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={!checked} onClick={() => finish(action)}>
          <Icon name="check" size={20} />
          Tandai Selesai
        </button>
        {!checked && <p className="muted small center">Centang daftar periksa keselamatan untuk mengaktifkan tombol.</p>}
      </div>

      <ConfirmDialog
        open={confirmFalse}
        title="Tandai sebagai salah deteksi?"
        confirmLabel="Ya, tutup tugas"
        onCancel={() => setConfirmFalse(false)}
        onConfirm={() => {
          setConfirmFalse(false);
          finish(FALSE_ALARM);
        }}
      >
        <p>Tugas ditutup dengan keterangan "{FALSE_ALARM}". Catatan yang sudah ditulis ikut tersimpan.</p>
      </ConfirmDialog>
    </>
  );
}

export default function DetailTemuan() {
  const { panelId = '' } = useParams();
  const { panelById, tasks, mode } = useStore();
  const panel = panelById.get(panelId);
  const task = tasks.find((t) => t.panelId === panelId);

  if (!panel) {
    return (
      <>
        <header className="detail-head">
          <Link to="/teknisi" className="icon-btn" aria-label="Kembali ke Tugas Saya">
            <Icon name="arrowLeft" size={20} />
          </Link>
          <h1>Panel tidak ditemukan</h1>
        </header>
        <div className="card empty">
          <p>
            ID <span className="mono">{panelId}</span> tidak ada di data contoh.
          </p>
        </div>
      </>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${panel.lat.toFixed(6)},${panel.lng.toFixed(6)}`;

  return (
    <>
      <header className="detail-head">
        <Link to="/teknisi" className="icon-btn" aria-label="Kembali ke Tugas Saya">
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div>
          <p className="muted small">Detail Temuan</p>
          <h1 className="mono">{panel.id}</h1>
        </div>
      </header>
      <div className="task-chips">
        <ClassChip cls={panel.cls} />
        {task && <PriorityChip priority={task.priority} />}
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

      <section className="card" aria-label="Data panel">
        <dl className="kv">
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
            <dt>Kelas kerusakan</dt>
            <dd>{CLASS_INFO[panel.cls].label}</dd>
          </div>
          <div>
            <dt>Skor IEC</dt>
            <dd>{panel.iecScore !== null ? `${panel.iecScore} dari 5 (placeholder)` : '–'}</dd>
          </div>
          <div>
            <dt>Keyakinan model</dt>
            <dd>{panel.confidence}% (simulasi)</dd>
          </div>
        </dl>
        {task && <p className="detail-reason">{task.actionText}</p>}
      </section>

      <section className="card" aria-labelledby="lokasi-title">
        <h2 id="lokasi-title" className="card-title">
          Lokasi panel
        </h2>
        <MiniMap panel={panel} />
        <p className="muted small">Skema posisi, bukan peta sebenarnya. Koordinat panel adalah titik contoh.</p>
        <a className="btn btn-block" href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Icon name="pin" size={18} />
          Buka Navigasi ke Panel
        </a>
      </section>

      {task ? (
        <FollowUp key={task.id} task={task} />
      ) : (
        <div className="card empty">
          <p>{mode === 'memuat' ? 'Memuat data tugas…' : 'Belum ada tugas untuk panel ini. Tugas dibuat setelah operator menyetujui rekomendasi "Lapor".'}</p>
        </div>
      )}
    </>
  );
}
