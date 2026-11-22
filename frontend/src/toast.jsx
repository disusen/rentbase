// Feedback messages shown in the corner of the screen (instead of browser alert()).
import { createContext, useCallback, useContext, useState } from 'react';
import Icon from './components/Icon';

const ToastContext = createContext(() => {});

const ICONS = { success: 'check', error: 'alert', info: 'info' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 250);
  }, []);

  const push = useCallback(
    (type, title, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, type, title, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}${t.leaving ? ' is-leaving' : ''}`}>
            <Icon name={ICONS[t.type]} size={20} />
            <div>
              <strong>{t.title}</strong>
              {t.message && <p>{t.message}</p>}
            </div>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Uždaryti">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  return {
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
  };
}
