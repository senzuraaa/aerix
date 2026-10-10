import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { formatTime, notificationText } from '../../lib/notify';
import { useStore } from '../../lib/store';

export default function Pesan() {
  const { tasks, markSeen } = useStore();
  // Batas "sudah dilihat" saat halaman dibuka, supaya tanda belum dibaca masih terlihat sekali.
  const [seenAt] = useState(() => localStorage.getItem('aerix.lastSeen') ?? '');

  useEffect(() => {
    markSeen();
  }, [tasks.length, markSeen]);

  const list = useMemo(() => [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [tasks]);

  return (
    <>
      <header className="tech-head">
        <h1>Pesan</h1>
      </header>
      <p className="muted small">Daftar ini dibuat dari tugas yang ada di aplikasi, bukan riwayat notifikasi push perangkat.</p>

      {list.length === 0 ? (
        <div className="card empty">
          <Icon name="bell" size={28} />
          <p>Belum ada pesan. Pesan muncul saat operator meneruskan temuan ke teknisi.</p>
        </div>
      ) : (
        <ul className="msg-list">
          {list.map((t) => {
            const n = notificationText(t);
            const unread = t.createdAt > seenAt;
            return (
              <li key={t.id}>
                <Link to={`/teknisi/tugas/${t.panelId}`} className="card msg">
                  <span className={unread ? 'msg-icon unread' : 'msg-icon'}>
                    <Icon name="bell" size={18} />
                  </span>
                  <span className="msg-body">
                    <span className="msg-title">
                      {n.title}
                      {unread && <span className="badge info">Baru</span>}
                    </span>
                    <span className="msg-text">{n.body}</span>
                  </span>
                  <time className="muted small" dateTime={t.createdAt}>
                    {formatTime(t.createdAt)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
