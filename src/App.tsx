import { Navigate, Route, Routes } from 'react-router-dom';
import PinGate from './components/PinGate';
import PrototypeBar from './components/PrototypeBar';
import ToastHost from './components/ToastHost';
import Laporan from './pages/operator/Laporan';
import MisiLangsung from './pages/operator/MisiLangsung';
import OperatorLayout from './pages/operator/OperatorLayout';
import PetaKondisi from './pages/operator/PetaKondisi';
import Rekomendasi from './pages/operator/Rekomendasi';
import SegeraHadir from './pages/operator/SegeraHadir';
import DetailTemuan from './pages/teknisi/DetailTemuan';
import Pesan from './pages/teknisi/Pesan';
import PetaTeknisi from './pages/teknisi/PetaTeknisi';
import Pindai from './pages/teknisi/Pindai';
import Profil from './pages/teknisi/Profil';
import TechLayout from './pages/teknisi/TechLayout';
import TugasSaya from './pages/teknisi/TugasSaya';

function HomeRedirect() {
  return <Navigate to={window.innerWidth < 1024 ? '/teknisi' : '/operator/peta'} replace />;
}

export default function App() {
  return (
    <div className="app">
      <PrototypeBar />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/operator" element={<OperatorLayout />}>
          <Route index element={<Navigate to="/operator/peta" replace />} />
          <Route path="beranda" element={<Navigate to="/operator/peta" replace />} />
          <Route path="peta" element={<PetaKondisi />} />
          <Route path="rekomendasi" element={<Rekomendasi />} />
          <Route path="misi" element={<MisiLangsung />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="jadwal" element={<SegeraHadir judul="Jadwal & Pemicu" icon="calendar" />} />
          <Route path="analitik" element={<SegeraHadir judul="Analitik" icon="chart" />} />
          <Route path="armada" element={<SegeraHadir judul="Armada Drone" icon="drone" />} />
          <Route path="pengaturan" element={<SegeraHadir judul="Pengaturan" icon="gear" />} />
          <Route path="*" element={<Navigate to="/operator/peta" replace />} />
        </Route>
        <Route path="/teknisi" element={<TechLayout />}>
          <Route index element={<TugasSaya />} />
          <Route path="tugas/:panelId" element={<DetailTemuan />} />
          <Route path="peta" element={<PetaTeknisi />} />
          <Route path="pindai" element={<Pindai />} />
          <Route path="pesan" element={<Pesan />} />
          <Route path="profil" element={<Profil />} />
          <Route path="*" element={<Navigate to="/teknisi" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
      <PinGate />
    </div>
  );
}
