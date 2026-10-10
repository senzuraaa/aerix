import { useStore } from '../lib/store';
import Icon from './Icon';

export default function ToastHost() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span className="toast-text">{t.text}</span>
          <button type="button" className="toast-close" aria-label="Tutup pemberitahuan" onClick={() => dismissToast(t.id)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
