import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { PINNED_IDS } from '../../lib/panels';
import { useStore } from '../../lib/store';

export default function Pindai() {
  const { panelById } = useStore();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = value.trim().toUpperCase();
    if (!panelById.has(id)) {
      setError(`ID "${id || '(kosong)'}" tidak ada di data contoh. Format: Z2-S04-B09-K06.`);
      return;
    }
    navigate(`/teknisi/tugas/${id}`);
  };

  return (
    <>
      <header className="tech-head">
        <h1>Pindai QR</h1>
      </header>
      <div className="card empty">
        <Icon name="qr" size={28} />
        <p>Pemindaian kamera belum diimplementasikan pada prototipe ini. Untuk sementara, ketik ID panel yang tertera pada label.</p>
      </div>

      <form className="card form-block" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>ID panel</span>
          <input
            className="input mono"
            type="text"
            value={value}
            placeholder={PINNED_IDS[4]}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'pindai-error' : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError('');
            }}
          />
        </label>
        {error && (
          <p id="pindai-error" className="note warn" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block">
          Buka
        </button>
      </form>
    </>
  );
}
