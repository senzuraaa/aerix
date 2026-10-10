import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { useInstallPrompt } from '../../lib/install';
import { enablePush, isIOS, isStandalone, pushSupported, vapidConfigured, type EnableResult } from '../../lib/push';
import { useStore } from '../../lib/store';

type Permission = NotificationPermission | 'unsupported';

const PERMISSION_TEXT: Record<Permission, string> = {
  granted: 'Diizinkan',
  denied: 'Ditolak (ubah lewat pengaturan situs di browser)',
  default: 'Belum diminta',
  unsupported: 'Tidak didukung browser ini',
};

const ENABLE_TEXT: Record<EnableResult, string> = {
  ok: 'Notifikasi aktif di perangkat ini.',
  denied: 'Izin notifikasi ditolak.',
  unsupported: 'Browser ini tidak mendukung Web Push.',
  nokey: 'Kunci VAPID belum dikonfigurasi (VITE_VAPID_PUBLIC_KEY), jadi push belum bisa diaktifkan.',
  noworker: 'Service worker belum aktif.',
  error: 'Gagal mengaktifkan notifikasi. Periksa koneksi lalu coba lagi.',
};

const readPermission = (): Permission => ('Notification' in window ? Notification.permission : 'unsupported');

export default function Profil() {
  const { mode, online, config, pendingCount, sendTestNotification } = useStore();
  const { available, install } = useInstallPrompt();
  const [permission, setPermission] = useState<Permission>(readPermission);
  const [hasWorker, setHasWorker] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [installMsg, setInstallMsg] = useState('');
  const standalone = isStandalone();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setHasWorker(false);
      return;
    }
    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (!cancelled) setHasWorker(Boolean(reg));
      })
      .catch(() => {
        if (!cancelled) setHasWorker(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Harus dipanggil langsung dari klik supaya browser mau menampilkan dialog izin.
  const onEnable = async () => {
    if (mode === 'lokal') {
      setPushMsg('Mode lokal: tidak ada server, jadi notifikasi push tidak tersedia.');
      return;
    }
    if (pushSupported() && vapidConfigured() && hasWorker === false) {
      setPushMsg('Service worker belum terpasang. Service worker hanya aktif pada build produksi, bukan saat `npm run dev`.');
      return;
    }
    setBusy(true);
    const result = await enablePush();
    setBusy(false);
    setPermission(readPermission());
    setPushMsg(ENABLE_TEXT[result]);
  };

  const onTest = async () => {
    setBusy(true);
    setTestMsg(await sendTestNotification());
    setBusy(false);
  };

  const onInstall = async () => {
    const outcome = await install();
    setInstallMsg(outcome === 'accepted' ? 'Aplikasi sedang dipasang.' : outcome === 'dismissed' ? 'Pemasangan dibatalkan.' : 'Pemasangan belum ditawarkan oleh browser.');
  };

  const modeText = mode === 'memuat' ? 'Memeriksa server…' : mode === 'lokal' ? 'Mode lokal (tanpa server)' : online ? 'Terhubung ke server' : 'Server (sedang offline)';

  return (
    <>
      <header className="tech-head">
        <h1>Profil</h1>
      </header>

      <section className="card profile-block" aria-labelledby="pf-notif">
        <h2 id="pf-notif" className="card-title">
          Notifikasi
        </h2>
        <dl className="kv">
          <div>
            <dt>Status izin</dt>
            <dd>{PERMISSION_TEXT[permission]}</dd>
          </div>
        </dl>
        <button type="button" className="btn btn-primary btn-block" onClick={() => void onEnable()} disabled={busy}>
          <Icon name="bell" size={18} />
          Aktifkan notifikasi
        </button>
        {pushMsg && (
          <p className="note" role="status">
            {pushMsg}
          </p>
        )}
        {isIOS() && !standalone && (
          <p className="note warn">Di iPhone, tambahkan ke Layar Utama dulu (Safari, Bagikan, Tambahkan ke Layar Utama), buka dari ikon aplikasi, baru aktifkan notifikasi.</p>
        )}
        <button type="button" className="btn btn-block" onClick={() => void onTest()} disabled={busy}>
          <Icon name="send" size={18} />
          Kirim notifikasi uji
        </button>
        {testMsg && (
          <p className="note" role="status">
            {testMsg}
          </p>
        )}
      </section>

      <section className="card profile-block" aria-labelledby="pf-pasang">
        <h2 id="pf-pasang" className="card-title">
          Pasang aplikasi
        </h2>
        {standalone ? (
          <p className="muted">Aplikasi sudah berjalan sebagai aplikasi terpasang.</p>
        ) : (
          <>
            <button type="button" className="btn btn-block" onClick={() => void onInstall()} disabled={!available}>
              <Icon name="download" size={18} />
              Pasang aplikasi
            </button>
            {!available && <p className="muted small">Browser belum menawarkan pemasangan. Di Chrome atau Edge tawaran muncul pada alamat https. Di iPhone gunakan Bagikan, lalu Tambahkan ke Layar Utama.</p>}
          </>
        )}
        {installMsg && (
          <p className="note" role="status">
            {installMsg}
          </p>
        )}
      </section>

      <section className="card profile-block" aria-labelledby="pf-mode">
        <h2 id="pf-mode" className="card-title">
          Info mode
        </h2>
        <dl className="kv">
          <div>
            <dt>Backend</dt>
            <dd>{modeText}</dd>
          </div>
          <div>
            <dt>Web Push di server</dt>
            <dd>{mode === 'server' ? (config.push ? 'Dikonfigurasi' : 'Belum dikonfigurasi') : 'Tidak tersedia'}</dd>
          </div>
          <div>
            <dt>Telegram di server</dt>
            <dd>{mode === 'server' ? (config.telegram ? 'Dikonfigurasi' : 'Belum dikonfigurasi') : 'Tidak tersedia'}</dd>
          </div>
          <div>
            <dt>Aksi menunggu sinkron</dt>
            <dd>{pendingCount}</dd>
          </div>
        </dl>
        <p className="muted small">Peran "Teknisi" pada prototipe ini tidak memakai akun. Semua data adalah contoh.</p>
      </section>
    </>
  );
}
