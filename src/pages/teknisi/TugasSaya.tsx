import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClassChip, PriorityChip } from '../../components/Chips';
import Icon from '../../components/Icon';
import { ThermalImage } from '../../components/PanelImages';
import { PRIORITY_RANK } from '../../lib/classes';
import { useStore } from '../../lib/store';
import type { TaskStatus } from '../../lib/types';

const TABS: { value: TaskStatus; label: string }[] = [
  { value: 'baru', label: 'Baru' },
  { value: 'dikerjakan', label: 'Dikerjakan' },
  { value: 'selesai', label: 'Selesai' },
];

const EMPTY: Record<TaskStatus, string> = {
  baru: 'Belum ada tugas baru. Tugas muncul di sini setelah operator menyetujui rekomendasi "Lapor" untuk sebuah panel.',
  dikerjakan: 'Belum ada tugas yang sedang dikerjakan. Buka sebuah tugas baru dan mulai mengisinya.',
  selesai: 'Belum ada tugas yang selesai.',
};

export default function TugasSaya() {
  const { tasks, panelById, online, mode, pendingCount, pendingTaskIds } = useStore();
  const [tab, setTab] = useState<TaskStatus>('baru');

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { baru: 0, dikerjakan: 0, selesai: 0 };
    for (const t of tasks) c[t.status] += 1;
    return c;
  }, [tasks]);

  const list = useMemo(
    () => tasks.filter((t) => t.status === tab).sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.distanceM - b.distanceM),
    [tasks, tab]
  );

  const sync = !online
    ? { text: 'Offline - data tersimpan', tone: 'warn', icon: 'cloudOff' as const }
    : mode === 'lokal'
      ? { text: 'Mode lokal', tone: 'muted', icon: 'cloud' as const }
      : pendingCount > 0 || mode === 'memuat'
        ? { text: 'Menyinkronkan…', tone: 'info', icon: 'cloud' as const }
        : { text: 'Tersinkron', tone: 'ok', icon: 'checkCircle' as const };

  return (
    <>
      <header className="tech-head">
        <div>
          <p className="muted small">Halo, Teknisi</p>
          <h1>Tugas Saya</h1>
        </div>
        <span className={`badge ${sync.tone}`}>
          <Icon name={sync.icon} size={14} />
          {sync.text}
        </span>
      </header>

      <div className="seg seg-full" role="group" aria-label="Status tugas">
        {TABS.map((t) => (
          <button key={t.value} type="button" className="seg-item" aria-pressed={tab === t.value} onClick={() => setTab(t.value)}>
            {t.label} <span className="seg-count">{counts[t.value]}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card empty">
          <Icon name="clipboard" size={28} />
          <p>{EMPTY[tab]}</p>
        </div>
      ) : (
        <ul className="task-list">
          {list.map((t) => {
            const p = panelById.get(t.panelId);
            return (
              <li key={t.id}>
                <Link to={`/teknisi/tugas/${t.panelId}`} className="card task-card">
                  <span className="task-thumb">{p ? <ThermalImage panel={p} variant="thumb" label={false} /> : <Icon name="scan" size={24} />}</span>
                  <span className="task-body">
                    <span className="mono task-id">{t.panelId}</span>
                    {p && (
                      <span className="muted small">
                        Zona {p.zone} · S{String(p.string).padStart(2, '0')} · B{String(p.row).padStart(2, '0')} / K{String(p.col).padStart(2, '0')}
                      </span>
                    )}
                    <span className="task-chips">
                      <ClassChip cls={t.cls} />
                      <PriorityChip priority={t.priority} />
                      <span className="task-dist">
                        <Icon name="pin" size={14} />
                        {t.distanceM} m
                      </span>
                    </span>
                    <span className="task-action">{t.status === 'selesai' && t.actionDone ? `Selesai: ${t.actionDone}` : t.actionText}</span>
                    {pendingTaskIds.has(t.id) && (
                      <span className="badge warn">
                        <Icon name="clock" size={14} />
                        Menunggu sinkron
                      </span>
                    )}
                  </span>
                  <span className="task-go" aria-hidden="true">
                    <Icon name="chevronRight" size={20} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
