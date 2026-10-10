import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icon, { Brand, type IconName } from '../../components/Icon';
import { WIND_LIMIT } from '../../lib/actions';
import { missionLabel, setWindHold, useMission } from '../../lib/mission';
import { PANELS, ZONES } from '../../lib/panels';
import { useStore } from '../../lib/store';
import type { Action } from '../../lib/types';
import { OperatorContext, SEVERITIES, matches, type OperatorState, type Severity } from './filters';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/operator/beranda', label: 'Beranda', icon: 'home' },
  { to: '/operator/jadwal', label: 'Jadwal & Pemicu', icon: 'calendar' },
  { to: '/operator/misi', label: 'Misi Langsung', icon: 'radio' },
  { to: '/operator/peta', label: 'Peta Kondisi', icon: 'map' },
  { to: '/operator/rekomendasi', label: 'Rekomendasi Tindakan', icon: 'list' },
  { to: '/operator/laporan', label: 'Laporan', icon: 'file' },
  { to: '/operator/analitik', label: 'Analitik', icon: 'chart' },
  { to: '/operator/armada', label: 'Armada Drone', icon: 'drone' },
  { to: '/operator/pengaturan', label: 'Pengaturan', icon: 'gear' },
];

const TITLES: Record<string, string> = {
  peta: 'Peta Kondisi',
  rekomendasi: 'Rekomendasi Tindakan',
  misi: 'Misi Langsung',
  laporan: 'Laporan',
  jadwal: 'Jadwal & Pemicu',
  analitik: 'Analitik',
  armada: 'Armada Drone',
  pengaturan: 'Pengaturan',
};

const FILTER_PAGES = new Set(['peta', 'rekomendasi']);

function DroneStatus() {
  const m = useMission();
  return (
    <div className="op-drone">
      <span className="op-drone-icon" aria-hidden="true">
        <Icon name="drone" size={18} />
      </span>
      <div>
        <p className="op-drone-name">Drone AERIX-01</p>
        <p className="op-drone-state">{missionLabel(m)}</p>
        <p className="op-drone-state">Baterai {Math.round(m.battery)}% (simulasi)</p>
      </div>
    </div>
  );
}

export default function OperatorLayout() {
  const { wind, toast } = useStore();
  const { pathname } = useLocation();
  const page = pathname.split('/')[2] ?? 'peta';
  const showFilters = FILTER_PAGES.has(page);

  const [zone, setZone] = useState(0);
  const [severity, setSeverity] = useState<Severity>('semua');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('Z2-S04-B09-K06');
  const [overrides, setOverrides] = useState<Record<string, Action>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const setOverride = useCallback((panelId: string, action: Action) => {
    setOverrides((prev) => ({ ...prev, [panelId]: action }));
  }, []);

  const ctx = useMemo<OperatorState>(
    () => ({ zone, setZone, severity, setSeverity, query, setQuery, selectedId, setSelectedId, overrides, setOverride }),
    [zone, severity, query, selectedId, overrides, setOverride]
  );

  // Angin di atas batas menunda misi (simulasi).
  useEffect(() => {
    setWindHold(wind > WIND_LIMIT);
  }, [wind]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const today = useMemo(() => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const hit = PANELS.find((p) => matches(p, zone, severity, query));
    if (hit) {
      setSelectedId(hit.id);
      toast(`Panel ${hit.id} dipilih`, 'info');
    } else {
      toast('Tidak ada panel yang cocok dengan pencarian dan filter', 'warn');
    }
  };

  return (
    <OperatorContext.Provider value={ctx}>
      <div className="op-shell">
        <aside className="op-side">
          <div className="op-side-inner">
            <div className="op-brand-row">
              <div className="op-brand">
                <span className="op-brand-mark">
                  <Brand size={30} />
                </span>
                <div>
                  <p className="op-brand-name">AERIX</p>
                  <p className="op-brand-sub">Aerial Fix</p>
                </div>
              </div>
              <button type="button" className="op-menu-btn" aria-expanded={menuOpen} aria-controls="op-nav" onClick={() => setMenuOpen((v) => !v)}>
                <Icon name={menuOpen ? 'close' : 'list'} size={18} />
                Menu
              </button>
            </div>

            <nav id="op-nav" className={menuOpen ? 'op-nav open' : 'op-nav'} aria-label="Menu operator">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className="op-nav-link">
                  <Icon name={n.icon} size={18} />
                  {n.label}
                </NavLink>
              ))}
            </nav>

            <div className="op-side-cards">
              <div className="op-site">
                <p className="op-site-name">PLTS Oelpuah</p>
                <p>5 MWp · Kupang, NTT</p>
                <p>Sekitar 22.000 panel · 5 zona</p>
              </div>
              <DroneStatus />
            </div>
          </div>
        </aside>

        <div className="op-main">
          <header className="op-top">
            <h1 className="op-title">{TITLES[page] ?? 'Operator'}</h1>
            {showFilters && (
              <div className="op-filters">
                <label className="sr-only" htmlFor="op-zone">
                  Zona
                </label>
                <select id="op-zone" className="select" value={zone} onChange={(e) => setZone(Number(e.target.value))}>
                  <option value={0}>Zona 1 - Zona 5</option>
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      Zona {z}
                    </option>
                  ))}
                </select>

                <button type="button" className="btn op-date" onClick={() => toast('Pemilih tanggal belum tersedia di prototipe ini', 'info')}>
                  <Icon name="calendar" size={16} />
                  {today}
                </button>

                <label className="sr-only" htmlFor="op-sev">
                  Filter keparahan
                </label>
                <span className="select-wrap">
                  <Icon name="filter" size={16} />
                  <select id="op-sev" className="select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                    {SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </span>

                <form className="op-search" role="search" onSubmit={onSearch}>
                  <label className="sr-only" htmlFor="op-q">
                    Cari ID panel
                  </label>
                  <Icon name="search" size={16} />
                  <input id="op-q" type="search" placeholder="Cari ID panel" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
                </form>
              </div>
            )}
            <div className="op-avatar">
              <span className="op-avatar-pic" aria-hidden="true">
                <Icon name="user" size={18} />
              </span>
              Operator
            </div>
          </header>

          <main className="op-content">
            <Outlet />
          </main>
        </div>
      </div>
    </OperatorContext.Provider>
  );
}
