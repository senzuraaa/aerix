import { useEffect, useMemo, useState } from 'react';
import { ActionChip, ClassChip } from '../../components/Chips';
import Icon from '../../components/Icon';
import MissionCard from '../../components/MissionCard';
import { WIND_LIMIT, allowedFor, laporItem, waterFor } from '../../lib/actions';
import { ACTIONS } from '../../lib/classes';
import { useMission } from '../../lib/mission';
import { formatId, liters } from '../../lib/notify';
import { TABLE_ORDER, ZONES } from '../../lib/panels';
import { useStore } from '../../lib/store';
import type { Action, DecisionItem, Panel } from '../../lib/types';
import { matches, useOperator } from './filters';

const PAGE_SIZE = 7;
const BATTERY_MIN = 30;
const TANK_ML = 2500;
const DEFAULT_ORDER = [3, 4, 2, 5, 1];

function validOrder(order: unknown): number[] {
  if (Array.isArray(order) && order.length === ZONES.length && ZONES.every((z) => order.includes(z))) return order as number[];
  return DEFAULT_ORDER;
}

function SafetyCard() {
  const { wind, setWind } = useStore();
  const m = useMission();
  const battery = Math.round(m.battery);
  const windOk = wind <= WIND_LIMIT;
  const batteryOk = battery >= BATTERY_MIN;
  const safe = windOk && batteryOk;

  return (
    <section className="card" aria-labelledby="safety-title">
      <header className="card-head">
        <h2 id="safety-title" className="card-title">
          Cek Keselamatan
        </h2>
        <span className="tag-sim">Simulasi</span>
      </header>
      <p className={safe ? 'safety-status ok' : 'safety-status danger'} role="status">
        <Icon name={safe ? 'checkCircle' : 'flag'} size={18} />
        {safe ? 'Aman terbang' : 'Tunda terbang'}
      </p>
      <ul className="safety-list">
        <li data-ok={windOk}>
          <Icon name="wind" size={18} />
          <span>Angin</span>
          <strong>{wind} km/jam</strong>
          <small>batas {WIND_LIMIT} km/jam</small>
        </li>
        <li data-ok={batteryOk}>
          <Icon name="battery" size={18} />
          <span>Baterai</span>
          <strong>{battery}%</strong>
          <small>minimal {BATTERY_MIN}%</small>
        </li>
        <li data-ok="true">
          <Icon name="cloud" size={18} />
          <span>Hujan</span>
          <strong>Tidak hujan</strong>
          <small>nilai contoh</small>
        </li>
        <li data-ok="true">
          <Icon name="drop" size={18} />
          <span>Tangki air</span>
          <strong>{liters(m.waterMl)}</strong>
          <small>dari {liters(TANK_ML)}</small>
        </li>
      </ul>
      <label className="field">
        <span>Simulasi angin: {wind} km/jam</span>
        <input type="range" min={0} max={50} step={1} value={wind} onChange={(e) => setWind(Number(e.target.value))} />
      </label>
    </section>
  );
}

function SortieCard({ order }: { order: number[] }) {
  const { wind } = useStore();
  const running = wind > WIND_LIMIT ? 'Ditunda' : 'Berjalan';
  return (
    <section className="card" aria-labelledby="sortie-title">
      <header className="card-head">
        <h2 id="sortie-title" className="card-title">
          Sortie Pagi Ini
        </h2>
      </header>
      <ol className="sortie-list">
        {order.map((z, i) => {
          const status = i === 0 ? 'Selesai' : i === 1 ? running : 'Terjadwal';
          const tone = i === 0 ? 'ok' : i === 1 ? (running === 'Ditunda' ? 'danger' : 'info') : 'muted';
          return (
            <li key={z}>
              <span className="sortie-no">{i + 1}</span>
              <span className="sortie-name">
                Sortie {i + 1} · Zona {z}
              </span>
              <span className={`badge ${tone}`}>{status}</span>
            </li>
          );
        })}
      </ol>
      <p className="muted small">Urutan mengikuti "Prioritas zona" di bawah. Status adalah contoh.</p>
    </section>
  );
}

export default function Rekomendasi() {
  const { decisions, tasks, decide, toast, settings, setSettings } = useStore();
  const { zone, severity, query, overrides, setOverride } = useOperator();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState(String(settings.budgetMl));

  const order = validOrder(settings.zoneOrder);
  const taskByPanel = useMemo(() => new Map(tasks.map((t) => [t.panelId, t])), [tasks]);
  const rows = useMemo(() => TABLE_ORDER.filter((p) => matches(p, zone, severity, query)), [zone, severity, query]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [zone, severity, query]);

  const usedMl = useMemo(() => {
    let sum = 0;
    for (const d of decisions.values()) if (d.status === 'disetujui' && d.action === 'Semprot') sum += d.waterMl;
    return sum;
  }, [decisions]);
  const budget = settings.budgetMl;
  const usedPct = budget > 0 ? Math.min(100, Math.round((usedMl / budget) * 100)) : 100;

  const proposed = (p: Panel): Action => {
    const a = overrides[p.id] ?? decisions.get(p.id)?.action ?? p.recommended ?? 'Tunggu';
    return allowedFor(p, a) ? a : 'Lapor';
  };

  const approve = (p: Panel) => {
    const action = proposed(p);
    const water = waterFor(p, action);
    if (action === 'Semprot' && usedMl + water > budget) {
      toast(`Anggaran air tidak cukup untuk ${p.id} (${water} ml)`, 'warn');
      return;
    }
    setEditing(null);
    void decide([action === 'Lapor' ? laporItem(p) : { panelId: p.id, action, status: 'disetujui', waterMl: water }]);
  };

  const reject = (p: Panel) => {
    setEditing(null);
    void decide([{ panelId: p.id, action: proposed(p), status: 'ditolak', waterMl: 0 }]);
  };

  const undo = (p: Panel, action: Action) => {
    void decide([{ panelId: p.id, action, status: 'menunggu', waterMl: 0 }]);
  };

  const approveAllSafe = () => {
    let used = usedMl;
    let skipped = 0;
    const items: DecisionItem[] = [];
    for (const p of rows) {
      const d = decisions.get(p.id);
      if ((d && d.status !== 'menunggu') || taskByPanel.has(p.id) || p.locked) continue;
      const action = proposed(p);
      if (action === 'Lapor') continue;
      const water = waterFor(p, action);
      if (action === 'Semprot' && used + water > budget) {
        skipped += 1;
        continue;
      }
      used += water;
      items.push({ panelId: p.id, action, status: 'disetujui', waterMl: water });
    }
    if (items.length > 0) {
      void decide(items);
      toast(`${items.length} rekomendasi aman disetujui`, 'ok');
    } else if (skipped === 0) {
      toast('Tidak ada rekomendasi aman yang masih menunggu keputusan', 'info');
    }
    if (skipped > 0) toast(`${skipped} baris Semprot dilewati karena melebihi anggaran air`, 'warn');
  };

  const commitBudget = () => {
    const n = Math.round(Number(budgetDraft));
    if (Number.isFinite(n) && n >= 0 && n <= 20000) {
      if (n !== settings.budgetMl) setSettings({ budgetMl: n });
      setBudgetDraft(String(n));
    } else {
      setBudgetDraft(String(settings.budgetMl));
      toast('Anggaran air harus antara 0 dan 20.000 ml', 'warn');
    }
  };

  const moveZone = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[index], next[j]] = [next[j], next[index]];
    setSettings({ zoneOrder: next });
  };

  return (
    <div className="rek-layout">
      <div className="rek-left">
        <SafetyCard />
        <SortieCard order={order} />
      </div>

      <section className="card rek-center" aria-labelledby="rek-title">
        <header className="card-head rek-head">
          <div>
            <h2 id="rek-title" className="card-title">
              Rekomendasi AI per Panel
            </h2>
            <p className="muted small">Rekomendasi disimulasikan dengan aturan sederhana, bukan keluaran model RL sungguhan.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={approveAllSafe}>
            <Icon name="checks" size={16} />
            Setujui semua yang aman
          </button>
        </header>

        <div className="table-wrap">
          <table className="table rek-table">
            <caption className="sr-only">Rekomendasi tindakan per panel beserta keputusan operator</caption>
            <thead>
              <tr>
                <th scope="col">ID Panel</th>
                <th scope="col">Kelas</th>
                <th scope="col">Rekomendasi</th>
                <th scope="col">Alasan singkat</th>
                <th scope="col" className="num">
                  Estimasi air (ml)
                </th>
                <th scope="col">Keputusan</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const dec = decisions.get(p.id);
                const task = taskByPanel.get(p.id);
                const decided = dec && dec.status !== 'menunggu' ? dec : undefined;
                const action = decided ? decided.action : proposed(p);
                const water = decided ? decided.waterMl : waterFor(p, action);
                return (
                  <tr key={p.id}>
                    <th scope="row" className="mono">
                      {p.id}
                    </th>
                    <td>
                      <ClassChip cls={p.cls} />
                    </td>
                    <td>
                      {editing === p.id && !decided && !task ? (
                        <>
                          <label className="sr-only" htmlFor={`act-${p.id}`}>
                            Ubah tindakan untuk {p.id}
                          </label>
                          <select
                            id={`act-${p.id}`}
                            className="select"
                            value={action}
                            autoFocus
                            onChange={(e) => {
                              setOverride(p.id, e.target.value as Action);
                              setEditing(null);
                            }}
                          >
                            {ACTIONS.map((a) => (
                              <option key={a} value={a} disabled={!allowedFor(p, a)}>
                                {allowedFor(p, a) ? a : `${a} (dikunci)`}
                              </option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <ActionChip action={action} />
                      )}
                    </td>
                    <td>
                      {p.reason}
                      {p.locked && (
                        <span className="lock-note">
                          <Icon name="lock" size={14} />
                          Semprot dikunci: rusak internal
                        </span>
                      )}
                    </td>
                    <td className="num">{action === 'Semprot' && water > 0 ? water : '–'}</td>
                    <td>
                      {task ? (
                        <span className="badge info">
                          <Icon name="send" size={14} />
                          Diteruskan ke teknisi
                        </span>
                      ) : decided ? (
                        <div className="row-actions">
                          <span className={decided.status === 'disetujui' ? 'badge ok' : 'badge danger'}>{decided.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}</span>
                          <button type="button" className="btn btn-sm btn-ghost" aria-label={`Urungkan keputusan ${p.id}`} onClick={() => undo(p, decided.action)}>
                            Urungkan
                          </button>
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button type="button" className="btn btn-sm btn-primary" aria-label={`Setujui ${action} untuk ${p.id}`} onClick={() => approve(p)}>
                            Setujui
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            aria-label={`Ubah tindakan untuk ${p.id}`}
                            aria-expanded={editing === p.id}
                            onClick={() => setEditing(editing === p.id ? null : p.id)}
                          >
                            Ubah
                          </button>
                          <button type="button" className="btn btn-sm btn-ghost-danger" aria-label={`Tolak rekomendasi untuk ${p.id}`} onClick={() => reject(p)}>
                            Tolak
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    Tidak ada temuan yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="pager" aria-label="Paginasi tabel rekomendasi">
          <span className="muted small">
            {rows.length === 0 ? '0 baris' : `Baris ${current * PAGE_SIZE + 1} sampai ${current * PAGE_SIZE + visible.length} dari ${formatId(rows.length)}`}
          </span>
          <div className="pager-btns">
            <button type="button" className="btn btn-sm" onClick={() => setPage(current - 1)} disabled={current === 0}>
              <Icon name="chevronLeft" size={16} />
              Sebelumnya
            </button>
            <span className="small">
              Halaman {current + 1} dari {pages}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
              Berikutnya
              <Icon name="chevronRight" size={16} />
            </button>
          </div>
        </nav>
      </section>

      <div className="rek-right">
        <MissionCard />
      </div>

      <section className="card strip" aria-label="Batasan misi">
        <div className="strip-item">
          <label className="label" htmlFor="budget">
            Anggaran air per misi (ml)
          </label>
          <input
            id="budget"
            className="input"
            type="number"
            inputMode="numeric"
            min={0}
            max={20000}
            step={50}
            value={budgetDraft}
            onChange={(e) => setBudgetDraft(e.target.value)}
            onBlur={commitBudget}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitBudget();
            }}
          />
          <div className="bar" role="progressbar" aria-label="Anggaran air terpakai" aria-valuemin={0} aria-valuemax={100} aria-valuenow={usedPct} data-full={usedPct >= 100}>
            <span style={{ width: `${usedPct}%` }} />
          </div>
          <p className="muted small">
            {formatId(usedMl)} ml terpakai dari {formatId(budget)} ml ({usedPct}%)
          </p>
        </div>

        <div className="strip-item">
          <p className="label" id="cycles-label">
            Maks. siklus ulang: {settings.maxCycles}
          </p>
          <div className="seg" role="group" aria-labelledby="cycles-label">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" className="seg-item" aria-pressed={settings.maxCycles === n} onClick={() => setSettings({ maxCycles: n })}>
                {n}
              </button>
            ))}
          </div>
          <p className="muted small">Berapa kali drone boleh mengulang pembersihan satu panel.</p>
        </div>

        <div className="strip-item">
          <p className="label">Prioritas zona</p>
          <ol className="zone-order">
            {order.map((z, i) => (
              <li key={z}>
                <span>Zona {z}</span>
                <button type="button" className="icon-btn" aria-label={`Naikkan prioritas Zona ${z}`} disabled={i === 0} onClick={() => moveZone(i, -1)}>
                  <Icon name="arrowUp" size={16} />
                </button>
                <button type="button" className="icon-btn" aria-label={`Turunkan prioritas Zona ${z}`} disabled={i === order.length - 1} onClick={() => moveZone(i, 1)}>
                  <Icon name="arrowDown" size={16} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
