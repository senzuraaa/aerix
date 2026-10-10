import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon, { type IconName } from '../../components/Icon';
import { notificationText } from '../../lib/notify';
import { useStore } from '../../lib/store';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/teknisi', label: 'Tugas', icon: 'clipboard' },
  { to: '/teknisi/peta', label: 'Peta', icon: 'map' },
  { to: '/teknisi/pindai', label: 'Pindai QR', icon: 'qr' },
  { to: '/teknisi/pesan', label: 'Pesan', icon: 'chat' },
  { to: '/teknisi/profil', label: 'Profil', icon: 'user' },
];

function isActive(to: string, pathname: string): boolean {
  if (to === '/teknisi') return pathname === '/teknisi' || pathname === '/teknisi/' || pathname.startsWith('/teknisi/tugas');
  return pathname.startsWith(to);
}

export default function TechLayout() {
  const { tasks, mode, toast, unreadCount } = useStore();
  const { pathname } = useLocation();
  const known = useRef<Set<string> | null>(null);

  // Toast di dalam aplikasi saat tugas baru masuk: bandingkan dengan ID tugas yang sudah dikenal.
  useEffect(() => {
    if (mode === 'memuat') return;
    const prev = known.current;
    if (prev) {
      for (const t of tasks) {
        if (!prev.has(t.id)) toast(`Tugas baru. ${notificationText(t).title}`, 'info');
      }
    }
    known.current = new Set(tasks.map((t) => t.id));
  }, [tasks, mode, toast]);

  return (
    <div className="tech-shell">
      <div className="tech-frame">
        <main className="tech-main">
          <Outlet />
          <p className="tech-note">Data ilustratif</p>
        </main>
        <nav className="tabbar" aria-label="Menu teknisi">
          {TABS.map((t) => {
            const active = isActive(t.to, pathname);
            return (
              <Link key={t.to} to={t.to} className="tab" aria-current={active ? 'page' : undefined}>
                <span className="tab-icon">
                  <Icon name={t.icon} size={22} />
                  {t.to === '/teknisi/pesan' && unreadCount > 0 && (
                    <span className="tab-badge" aria-label={`${unreadCount} pesan belum dibaca`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
