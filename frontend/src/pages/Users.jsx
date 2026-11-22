import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api';
import { useToast } from '../toast';
import Icon from '../components/Icon';
import { ConfirmModal } from '../components/Modal';
import { EmptyState, PageHeader, Pagination, SkeletonGrid } from '../components/Common';

const TABS = [
  { value: 'false', label: 'Laukia patvirtinimo' },
  { value: 'true', label: 'Patvirtinti' },
  { value: '', label: 'Visi' },
];

export default function Users() {
  const toast = useToast();
  const [approved, setApproved] = useState('false');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setData(null);
    api(`/api/users${qs({ approved, page, pageSize: 10 })}`)
      .then(setData)
      .catch((e) => toast.error('Nepavyko įkelti naudotojų', e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved, page]);

  useEffect(load, [load]);

  const setApproval = async (u, value) => {
    setBusyId(u.id);
    try {
      await api(`/api/users/${u.id}/approval`, { method: 'PATCH', body: { isApproved: value } });
      toast.success(value ? 'Narys patvirtintas' : 'Patvirtinimas atšauktas', u.fullName);
      load();
    } catch (e) {
      toast.error('Nepavyko', e.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId(deleting.id);
    try {
      await api(`/api/users/${deleting.id}`, { method: 'DELETE' });
      toast.success('Naudotojas pašalintas', deleting.fullName);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error('Nepavyko pašalinti', e.message);
      setDeleting(null);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container page">
      <PageHeader eyebrow="Administravimas" title="Naudotojai" text="Tvirtinkite naujų narių registracijas ir valdykite paskyras." />

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={approved === t.value}
            className={`tabs__tab${approved === t.value ? ' is-active' : ''}`}
            onClick={() => {
              setApproved(t.value);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <SkeletonGrid count={3} variant="row" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="users" title="Naudotojų nėra" text={approved === 'false' ? 'Visos registracijos jau peržiūrėtos.' : undefined} />
      ) : (
        <ul className="list">
          {data.items.map((u, i) => (
            <li key={u.id} className="row row--user" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="avatar">{u.fullName.charAt(0)}</span>
              <div className="row__main">
                <h3>{u.fullName}</h3>
                <p className="muted"><Icon name="mail" size={16} /> {u.email}</p>
              </div>
              <span className={`badge ${u.role === 'Admin' ? 'badge--accent' : 'badge--info'}`}>{u.role === 'Admin' ? 'Administratorius' : 'Narys'}</span>
              <span className={`badge ${u.isApproved ? 'badge--ok' : 'badge--warn'}`}>{u.isApproved ? 'Patvirtintas' : 'Laukia'}</span>
              {u.role !== 'Admin' ? (
                <div className="icon-actions">
                  {u.isApproved ? (
                    <button type="button" className="btn btn--ghost btn--sm" disabled={busyId === u.id} onClick={() => setApproval(u, false)}>
                      <Icon name="ban" size={16} /> Atšaukti
                    </button>
                  ) : (
                    <button type="button" className="btn btn--primary btn--sm" disabled={busyId === u.id} onClick={() => setApproval(u, true)}>
                      <Icon name="check" size={16} /> Patvirtinti
                    </button>
                  )}
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleting(u)} aria-label={`Pašalinti ${u.fullName}`} title="Pašalinti">
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ) : (
                <span className="icon-actions" />
              )}
            </li>
          ))}
        </ul>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {deleting && (
        <ConfirmModal
          title="Pašalinti naudotoją?"
          message={`${deleting.fullName} (${deleting.email}) ir visos jo rezervacijos bus ištrintos.`}
          confirmLabel="Pašalinti"
          busy={busyId === deleting.id}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
