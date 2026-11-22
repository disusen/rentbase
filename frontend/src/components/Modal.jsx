// Modal dialog used for create / edit / delete forms.
// Escape and the backdrop close it; focus moves into the dialog when it opens.
import { useEffect, useRef } from 'react';
import Icon from './Icon';

export default function Modal({ title, icon, onClose, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    const first = dialogRef.current?.querySelector('input, select, textarea, button:not(.modal__close)');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialogRef}>
        <header className="modal__header">
          {icon && (
            <span className="modal__icon">
              <Icon name={icon} size={20} />
            </span>
          )}
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Uždaryti">
            <Icon name="x" size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, confirmLabel = 'Ištrinti', onConfirm, onClose, busy }) {
  return (
    <Modal
      title={title}
      icon="trash"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Atšaukti
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="trash" size={18} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{message}</p>
    </Modal>
  );
}
