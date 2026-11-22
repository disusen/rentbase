import Icon from './Icon';

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="Puslapiai">
      <button type="button" className="pagination__btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Ankstesnis">
        <Icon name="chevronLeft" size={18} />
      </button>
      {pages.map((p) => (
        <button
          type="button"
          key={p}
          className={`pagination__btn${p === page ? ' is-current' : ''}`}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button type="button" className="pagination__btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Kitas">
        <Icon name="chevronRight" size={18} />
      </button>
    </nav>
  );
}

// Placeholder cards with a shimmer animation while data is loading.
export function SkeletonGrid({ count = 3, variant = 'card' }) {
  return (
    <div className={variant === 'row' ? 'list' : 'grid grid--cards'} aria-busy="true" aria-label="Kraunama">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton skeleton--${variant}`} style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon = 'info', title, text, action }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, text, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p className="lead">{text}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children, error }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

export function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="form-error" role="alert">
      <Icon name="alert" size={18} />
      <span>{message}</span>
    </div>
  );
}

const IMAGE_COUNT = 5;
export function buildingImage(id) {
  return `/images/building-${((id - 1) % IMAGE_COUNT + IMAGE_COUNT) % IMAGE_COUNT + 1}.svg`;
}

export const money = (v) =>
  new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export const MONTHS = ['saus.', 'vas.', 'kov.', 'bal.', 'geg.', 'birž.', 'liep.', 'rugp.', 'rugs.', 'spal.', 'lapkr.', 'gruod.'];

// "2026-12-01" → "2026 gruod. 1"
export const date = (v) => {
  const [y, m, d] = String(v).slice(0, 10).split('-').map(Number);
  return `${y} ${MONTHS[m - 1]} ${d}`;
};

export function nightsBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((new Date(end) - new Date(start)) / 86_400_000);
}
