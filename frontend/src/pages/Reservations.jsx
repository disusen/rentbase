import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import Icon from '../components/Icon';
import { ConfirmModal } from '../components/Modal';
import { EmptyState, MONTHS, PageHeader, Pagination, SkeletonGrid, date, nightsBetween } from '../components/Common';
import ReservationForm from '../forms/ReservationForm';

const PAGE_SIZE = 8;

export default function Reservations() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | reservation
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    api(`/api/reservations${qs({ userId: isAdmin ? userId : '', page, pageSize: PAGE_SIZE })}`)
      .then(setData)
      .catch((e) => toast.error('Nepavyko įkelti rezervacijų', e.message));
    // Profile: one resource built from the user and their reservations.
    api('/api/me/profile').then(setProfile).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userId, isAdmin]);

  useEffect(load, [load]);

  useEffect(() => {
    if (isAdmin) api('/api/users?pageSize=100').then((d) => setUsers(d.items)).catch(() => {});
  }, [isAdmin]);

  const cancel = async () => {
    setBusy(true);
    try {
      await api(`/api/reservations/${deleting.id}`, { method: 'DELETE' });
      toast.success('Rezervacija atšaukta', `${deleting.buildingName}, butas ${deleting.apartmentNumber}`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error('Nepavyko atšaukti', e.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const status = (r) =>
    r.endDate < today ? { label: 'Baigta', cls: 'badge--muted' } : r.startDate <= today ? { label: 'Vyksta', cls: 'badge--ok' } : { label: 'Laukiama', cls: 'badge--info' };

  return (
    <div className="container page">
      <PageHeader
        eyebrow={isAdmin ? 'Administravimas' : 'Mano paskyra'}
        title={isAdmin ? 'Visos rezervacijos' : 'Mano rezervacijos'}
        text={isAdmin ? 'Peržiūrėkite, redaguokite ir atšaukite bet kurio nario rezervacijas.' : 'Jūsų rezervacijų istorija ir artėjantys apsistojimai.'}
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
            <Icon name="plus" size={18} /> Nauja rezervacija
          </button>
        }
      />

      {profile && (
        <div className="profile-strip">
          <span className="profile-strip__avatar">{user.fullName.charAt(0)}</span>
          <div>
            <strong>{profile.user.fullName}</strong>
            <span className="muted">{profile.user.email}</span>
          </div>
          <div className="profile-strip__stat">
            <span>{profile.reservationCount}</span>
            <small>mano rezervacijos</small>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="toolbar">
          <label className="toolbar__field">
            <Icon name="user" size={18} />
            <span className="sr-only">Narys</span>
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Visi nariai</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </label>
          {data && <span className="muted">Rasta: {data.totalCount}</span>}
        </div>
      )}

      {!data ? (
        <SkeletonGrid count={4} variant="row" />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Rezervacijų nėra"
          text="Pasirinkite laisvą butą ir sukurkite pirmąją rezervaciją."
          action={<button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>Rezervuoti butą</button>}
        />
      ) : (
        <ul className="list">
          {data.items.map((r, i) => {
            const s = status(r);
            return (
              <li key={r.id} className="row" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="row__date">
                  <span>{r.startDate.slice(8, 10)}</span>
                  <small>{MONTHS[Number(r.startDate.slice(5, 7)) - 1]}</small>
                </div>
                <div className="row__main">
                  <h3>
                    {r.buildingName} · butas {r.apartmentNumber}
                  </h3>
                  <p className="muted">
                    <Icon name="calendar" size={16} /> {date(r.startDate)} – {date(r.endDate)} · {nightsBetween(r.startDate, r.endDate)} d.
                    {isAdmin && (
                      <>
                        {' '}· <Icon name="user" size={16} /> {r.userName}
                      </>
                    )}
                  </p>
                  {r.notes && (
                    <p className="row__notes">
                      <Icon name="note" size={16} /> {r.notes}
                    </p>
                  )}
                </div>
                <span className={`badge ${s.cls}`}>{s.label}</span>
                <div className="icon-actions">
                  <button type="button" className="icon-btn" onClick={() => setEditing(r)} aria-label="Redaguoti rezervaciją" title="Redaguoti">
                    <Icon name="edit" size={18} />
                  </button>
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleting(r)} aria-label="Atšaukti rezervaciją" title="Atšaukti">
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {editing && (
        <ReservationForm
          reservation={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Atšaukti rezervaciją?"
          message={`Rezervacija ${deleting.buildingName}, butas ${deleting.apartmentNumber} (${date(deleting.startDate)} – ${date(deleting.endDate)}) bus ištrinta.`}
          confirmLabel="Atšaukti rezervaciją"
          busy={busy}
          onConfirm={cancel}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
