import { useMemo } from 'react';
import { ActionChip, ClassChip, PriorityChip } from '../../components/Chips';
import Icon from '../../components/Icon';
import { CLASS_INFO } from '../../lib/classes';
import { formatId } from '../../lib/notify';
import { useStore } from '../../lib/store';
import type { TaskStatus } from '../../lib/types';

const TASK_LABEL: Record<TaskStatus, string> = { baru: 'Baru', dikerjakan: 'Dikerjakan', selesai: 'Selesai' };
const TASK_TONE: Record<TaskStatus, string> = { baru: 'info', dikerjakan: 'warn', selesai: 'ok' };

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // cegah teks catatan dibaca sebagai rumus oleh aplikasi lembar kerja
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function Laporan() {
  const { decisions, tasks, panelById, toast } = useStore();

  const decided = useMemo(
    () => [...decisions.values()].filter((d) => d.status !== 'menunggu').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [decisions]
  );
  const approved = decided.filter((d) => d.status === 'disetujui').length;
  const rejected = decided.filter((d) => d.status === 'ditolak').length;
  const waterMl = decided.reduce((sum, d) => (d.status === 'disetujui' && d.action === 'Semprot' ? sum + d.waterMl : sum), 0);

  const download = () => {
    const taskByPanel = new Map(tasks.map((t) => [t.panelId, t]));
    const ids = new Set<string>([...decided.map((d) => d.panelId), ...tasks.map((t) => t.panelId)]);
    const head = [
      'ID Panel',
      'Zona',
      'Kelas',
      'Tindakan',
      'Keputusan',
      'Estimasi air (ml)',
      'Waktu keputusan',
      'Diteruskan ke teknisi',
      'Prioritas',
      'Status tugas',
      'Tindakan teknisi',
      'Catatan teknisi',
      'Tugas diperbarui',
      'Keterangan',
    ];
    const lines = [head.map(csvCell).join(';')];
    for (const id of [...ids].sort()) {
      const d = decisions.get(id);
      const dec = d && d.status !== 'menunggu' ? d : undefined;
      const t = taskByPanel.get(id);
      const p = panelById.get(id);
      const cls = p?.cls ?? t?.cls;
      lines.push(
        [
          id,
          p ? p.zone : '',
          cls ? CLASS_INFO[cls].label : '',
          dec?.action ?? (t ? 'Lapor' : ''),
          dec ? (dec.status === 'disetujui' ? 'Disetujui' : 'Ditolak') : '',
          dec ? dec.waterMl : '',
          dec?.updatedAt ?? '',
          t ? 'Ya' : 'Tidak',
          t?.priority ?? '',
          t ? TASK_LABEL[t.status] : '',
          t?.actionDone ?? '',
          t?.note ?? '',
          t?.updatedAt ?? '',
          'Data ilustratif',
        ]
          .map(csvCell)
          .join(';')
      );
    }
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerix-ringkasan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Ringkasan diunduh (${ids.size} panel)`, 'ok');
  };

  return (
    <div className="stack">
      <div className="stats">
        <div className="card stat">
          <p className="stat-label">Disetujui</p>
          <p className="stat-value">{formatId(approved)}</p>
          <p className="stat-sub">keputusan operator</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Ditolak</p>
          <p className="stat-value">{formatId(rejected)}</p>
          <p className="stat-sub">keputusan operator</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Diteruskan ke teknisi</p>
          <p className="stat-value">{formatId(tasks.length)}</p>
          <p className="stat-sub">{formatId(tasks.filter((t) => t.status === 'selesai').length)} sudah selesai</p>
        </div>
        <div className="card stat">
          <p className="stat-label">Estimasi air terpakai</p>
          <p className="stat-value">{formatId(waterMl)} ml</p>
          <p className="stat-sub">dari Semprot yang disetujui</p>
        </div>
      </div>

      <section className="card" aria-labelledby="lap-keputusan">
        <header className="card-head">
          <div>
            <h2 id="lap-keputusan" className="card-title">
              Keputusan operator
            </h2>
            <p className="muted small">Berisi keputusan yang dibuat pada demo ini. Data ilustratif.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={download}>
            <Icon name="download" size={16} />
            Unduh ringkasan (CSV)
          </button>
        </header>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Daftar keputusan operator</caption>
            <thead>
              <tr>
                <th scope="col">ID Panel</th>
                <th scope="col">Kelas</th>
                <th scope="col">Tindakan</th>
                <th scope="col">Keputusan</th>
                <th scope="col" className="num">
                  Air (ml)
                </th>
                <th scope="col">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((d) => {
                const p = panelById.get(d.panelId);
                return (
                  <tr key={d.panelId}>
                    <th scope="row" className="mono">
                      {d.panelId}
                    </th>
                    <td>{p ? <ClassChip cls={p.cls} /> : '–'}</td>
                    <td>
                      <ActionChip action={d.action} />
                    </td>
                    <td>
                      <span className={d.status === 'disetujui' ? 'badge ok' : 'badge danger'}>{d.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}</span>
                    </td>
                    <td className="num">{d.waterMl > 0 ? d.waterMl : '–'}</td>
                    <td>{dateTime(d.updatedAt)}</td>
                  </tr>
                );
              })}
              {decided.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Belum ada keputusan. Buat keputusan di halaman Rekomendasi Tindakan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" aria-labelledby="lap-tugas">
        <header className="card-head">
          <h2 id="lap-tugas" className="card-title">
            Tugas teknisi
          </h2>
        </header>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Daftar tugas teknisi dan statusnya</caption>
            <thead>
              <tr>
                <th scope="col">ID Panel</th>
                <th scope="col">Kelas</th>
                <th scope="col">Prioritas</th>
                <th scope="col">Status</th>
                <th scope="col">Tindakan teknisi</th>
                <th scope="col">Catatan</th>
                <th scope="col">Diperbarui</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <th scope="row" className="mono">
                    {t.panelId}
                  </th>
                  <td>
                    <ClassChip cls={t.cls} />
                  </td>
                  <td>
                    <PriorityChip priority={t.priority} />
                  </td>
                  <td>
                    <span className={`badge ${TASK_TONE[t.status]}`}>{TASK_LABEL[t.status]}</span>
                  </td>
                  <td>{t.actionDone ?? '–'}</td>
                  <td className="wrap">{t.note || '–'}</td>
                  <td>{dateTime(t.updatedAt)}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    Belum ada tugas. Tugas dibuat saat operator menyetujui rekomendasi "Lapor".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
