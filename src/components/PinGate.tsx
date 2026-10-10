import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store';

/** Dialog PIN, muncul saat server menjawab 401 (env APP_PIN diisi). */
export default function PinGate() {
  const { needPin, submitPin } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (needPin && !d.open) d.showModal();
    if (!needPin && d.open) d.close();
  }, [needPin]);

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="pin-title" onCancel={(e) => e.preventDefault()}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = pin.trim();
          if (!value) return;
          submitPin(value);
          setPin('');
        }}
      >
        <h2 id="pin-title">Masukkan PIN</h2>
        <div className="dialog-body">
          <p>Server ini dilindungi PIN. Jika PIN salah, dialog ini akan muncul lagi.</p>
          <label className="field">
            <span>PIN aplikasi</span>
            <input className="input" type="password" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
        </div>
        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary" disabled={!pin.trim()}>
            Buka
          </button>
        </div>
      </form>
    </dialog>
  );
}
