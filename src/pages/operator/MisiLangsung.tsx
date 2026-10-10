import { Link } from 'react-router-dom';
import MissionCard from '../../components/MissionCard';
import { WIND_LIMIT } from '../../lib/actions';
import { useStore } from '../../lib/store';

export default function MisiLangsung() {
  const { wind, setWind } = useStore();
  return (
    <div className="stack">
      <MissionCard large />
      <section className="card" aria-labelledby="misi-angin">
        <h2 id="misi-angin" className="card-title">
          Simulasi angin
        </h2>
        <p className="muted">
          Geser untuk mencoba aturan keselamatan. Di atas {WIND_LIMIT} km/jam misi ditunda. Pengaturan lain ada di{' '}
          <Link to="/operator/rekomendasi">Rekomendasi Tindakan</Link>.
        </p>
        <label className="field">
          <span>Kecepatan angin: {wind} km/jam</span>
          <input type="range" min={0} max={50} step={1} value={wind} onChange={(e) => setWind(Number(e.target.value))} />
        </label>
      </section>
    </div>
  );
}
