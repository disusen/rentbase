// Apartment cards with role-dependent actions, used on the apartments page and on a
// building's page. Admin: edit / delete. Member: reserve. Guest: prompted to log in.
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { useRouter } from '../router';
import Icon from './Icon';
import { ConfirmModal } from './Modal';
import { money } from './Common';
import ApartmentForm from '../forms/ApartmentForm';
import ReservationForm from '../forms/ReservationForm';

export default function ApartmentGrid({ items, onChanged, showBuilding = true }) {
  const { user, isAdmin } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [reserving, setReserving] = useState(null);
  const [busy, setBusy] = useState(false);

  const reserve = (a) => {
    if (!user) {
      toast.info('Prisijunkite', 'Rezervuoti gali tik patvirtinti nariai.');
      navigate('/login');
      return;
    }
    setReserving(a);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/apartments/${deleting.id}`, { method: 'DELETE' });
      toast.success('Butas ištrintas', `${deleting.buildingName}, butas ${deleting.number}`);
      setDeleting(null);
      onChanged();
    } catch (e) {
      toast.error('Nepavyko ištrinti', e.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid grid--apartments">
        {items.map((a, i) => (
          <article key={a.id} className={`apt${a.isAvailable ? '' : ' apt--taken'}`} style={{ animationDelay: `${i * 50}ms` }}>
            <header className="apt__head">
              <div>
                <span className="apt__number">Nr. {a.number}</span>
                {showBuilding && <span className="apt__building">{a.buildingName} · {a.city}</span>}
              </div>
              <span className={`badge ${a.isAvailable ? 'badge--ok' : 'badge--muted'}`}>{a.isAvailable ? 'Laisvas' : 'Užimtas'}</span>
            </header>
            <ul className="apt__facts">
              <li><Icon name="bed" size={18} /><span>{a.rooms}</span> kamb.</li>
              <li><Icon name="ruler" size={18} /><span>{a.areaSqm}</span> m²</li>
              <li><Icon name="layers" size={18} /><span>{a.floor}</span> aukštas</li>
            </ul>
            <div className="apt__foot">
              <p className="apt__price">
                {money(a.monthlyRent)} <small>/ mėn.</small>
              </p>
              <div className="icon-actions">
                {isAdmin && (
                  <>
                    <button type="button" className="icon-btn" onClick={() => setEditing(a)} aria-label={`Redaguoti butą ${a.number}`} title="Redaguoti">
                      <Icon name="edit" size={18} />
                    </button>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleting(a)} aria-label={`Ištrinti butą ${a.number}`} title="Ištrinti">
                      <Icon name="trash" size={18} />
                    </button>
                  </>
                )}
                {a.isAvailable && (
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => reserve(a)}>
                    <Icon name="calendar" size={16} /> Rezervuoti
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <ApartmentForm
          apartment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
      {reserving && (
        <ReservationForm
          apartmentId={reserving.id}
          onClose={() => setReserving(null)}
          onSaved={() => {
            setReserving(null);
            navigate('/reservations');
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Ištrinti butą?"
          message={`Butas ${deleting.number} (${deleting.buildingName}) bus ištrintas. Butą su rezervacijomis ištrinti negalima.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
