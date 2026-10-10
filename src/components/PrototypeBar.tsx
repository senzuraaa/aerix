import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../lib/store';
import ConfirmDialog from './ConfirmDialog';

/** Strip prototipe di atas setiap layar: peran, simulasi offline, mode backend, atur ulang, dan label data. */
export default function PrototypeBar() {
  const { mode, online, forcedOffline, setForcedOffline, resetDemo, pendingCount, serverError } = useStore();
  const { pathname } = useLocation();
  const [confirm, setConfirm] = useState(false);
  const isTech = pathname.startsWith('/teknisi');

  const modeText =
    mode === 'memuat'
      ? 'Memeriksa server…'
      : mode === 'lokal'
        ? 'Mode lokal (tanpa server)'
        : online
          ? 'Terhubung ke server'
          : 'Server (sedang offline)';

  return (
    <header className="proto-bar">
      <nav className="seg seg-dark" aria-label="Peran">
        <Link to="/operator/peta" className="seg-item" aria-current={isTech ? undefined : 'page'}>
          Operator (PC)
        </Link>
        <Link to="/teknisi" className="seg-item" aria-current={isTech ? 'page' : undefined}>
          Teknisi (HP)
        </Link>
      </nav>

      <button type="button" role="switch" aria-checked={forcedOffline} className="switch" onClick={() => setForcedOffline(!forcedOffline)}>
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        Simulasi offline
      </button>

      <span className="proto-mode" data-mode={mode} data-online={online}>
        <span className="status-dot" aria-hidden="true" />
        {modeText}
      </span>
      {pendingCount > 0 && <span className="proto-pill">{pendingCount} aksi menunggu sinkron</span>}
      {serverError && (
        <span className="proto-pill warn" title={serverError}>
          Galat server: {serverError}
        </span>
      )}

      <span className="proto-spacer" />

      <button type="button" className="proto-btn" onClick={() => setConfirm(true)}>
        Atur ulang demo
      </button>
      <span className="proto-label">Data ilustratif</span>

      <ConfirmDialog
        open={confirm}
        title="Atur ulang demo?"
        confirmLabel="Atur ulang"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void resetDemo();
        }}
      >
        <p>Semua keputusan operator dan tugas teknisi pada demo ini akan dihapus. Tindakan ini tidak bisa dibatalkan.</p>
      </ConfirmDialog>
    </header>
  );
}
