import { Link } from 'react-router-dom';
import Icon, { type IconName } from '../../components/Icon';

export default function SegeraHadir({ judul, icon }: { judul: string; icon: IconName }) {
  return (
    <section className="card soon" aria-labelledby="soon-title">
      <span className="soon-icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <h2 id="soon-title">{judul}: segera hadir</h2>
      <p className="muted">Halaman ini belum dibuat pada prototipe. Tidak ada data atau fungsi di baliknya.</p>
      <Link to="/operator/peta" className="btn btn-primary">
        Buka Peta Kondisi
      </Link>
    </section>
  );
}
