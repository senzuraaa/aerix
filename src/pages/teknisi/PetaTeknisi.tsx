import { Link } from 'react-router-dom';
import { PriorityChip } from '../../components/Chips';
import Icon from '../../components/Icon';
import { PRIORITY_RANK } from '../../lib/classes';
import { useStore } from '../../lib/store';

const SITE_URL = 'https://www.google.com/maps/search/?api=1&query=PLTS%20Oelpuah%20Kupang';

export default function PetaTeknisi() {
  const { tasks } = useStore();
  const open = tasks.filter((t) => t.status !== 'selesai').sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.distanceM - b.distanceM);

  return (
    <>
      <header className="tech-head">
        <h1>Peta</h1>
      </header>

      <section className="card profile-block" aria-labelledby="peta-plts">
        <h2 id="peta-plts" className="card-title">
          PLTS Oelpuah
        </h2>
        <p className="muted">5 MWp · Kupang, NTT. Peta di dalam aplikasi belum tersedia pada prototipe, jadi lokasi dibuka di Google Maps.</p>
        <a className="btn btn-primary btn-block" href={SITE_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="map" size={18} />
          Buka lokasi PLTS di Google Maps
        </a>
      </section>

      <section className="card profile-block" aria-labelledby="peta-tugas">
        <h2 id="peta-tugas" className="card-title">
          Tugas yang belum selesai
        </h2>
        {open.length === 0 ? (
          <p className="muted">Tidak ada tugas terbuka.</p>
        ) : (
          <ul className="plain-list">
            {open.map((t) => (
              <li key={t.id}>
                <Link to={`/teknisi/tugas/${t.panelId}`} className="plain-link">
                  <span className="mono">{t.panelId}</span>
                  <PriorityChip priority={t.priority} />
                  <span className="muted small">{t.distanceM} m</span>
                  <Icon name="chevronRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="muted small">Jarak dihitung dari posisi teknisi contoh, bukan GPS perangkat.</p>
      </section>
    </>
  );
}
