import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Field, FormError, money, nightsBetween } from '../components/Common';

const toIso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIso(d);
};

export default function ReservationForm({ reservation, apartmentId, onClose, onSaved }) {
  const editing = Boolean(reservation);
  const toast = useToast();
  const [apartments, setApartments] = useState([]);
  const [form, setForm] = useState({
    apartmentId: reservation?.apartmentId ?? apartmentId ?? '',
    startDate: reservation?.startDate ?? addDays(7),
    endDate: reservation?.endDate ?? addDays(37),
    notes: reservation?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/apartments?available=true&pageSize=100')
      .then((d) => {
        let items = d.items;
        // The apartment of an existing reservation may no longer be free; keep it in the list.
        const current = reservation?.apartmentId ?? apartmentId;
        if (current && !items.some((a) => a.id === Number(current))) {
          return api(`/api/apartments/${current}`).then((a) => [a, ...items]).catch(() => items);
        }
        return items;
      })
      .then((items) => {
        setApartments(items);
        setForm((f) => (f.apartmentId ? f : { ...f, apartmentId: items[0]?.id ?? '' }));
      })
      .catch(() => setError('Nepavyko gauti butų sąrašo.'));
  }, [reservation, apartmentId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const selected = apartments.find((a) => a.id === Number(form.apartmentId));
  const nights = nightsBetween(form.startDate, form.endDate);

  const submit = async (e) => {
    e.preventDefault();
    if (nights <= 0) {
      setError('Pabaigos data turi būti vėlesnė už pradžios datą.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { ...form, apartmentId: Number(form.apartmentId) };
      const saved = editing
        ? await api(`/api/reservations/${reservation.id}`, { method: 'PUT', body })
        : await api('/api/reservations', { method: 'POST', body });
      toast.success(editing ? 'Rezervacija atnaujinta' : 'Rezervacija sukurta', `${saved.buildingName}, butas ${saved.apartmentNumber}`);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Redaguoti rezervaciją' : 'Nauja rezervacija'}
      icon="calendar"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Atšaukti</button>
          <button type="submit" form="reservation-form" className="btn btn--primary" disabled={busy || !form.apartmentId}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={18} />}
            {editing ? 'Išsaugoti' : 'Rezervuoti'}
          </button>
        </>
      }
    >
      <form id="reservation-form" className="form-grid" onSubmit={submit} noValidate>
        <FormError message={error} />
        <Field label="Butas">
          <select value={form.apartmentId} onChange={set('apartmentId')} required>
            {apartments.length === 0 && <option value="">Laisvų butų nėra</option>}
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.buildingName}, butas {a.number} · {a.rooms} kamb. · {money(a.monthlyRent)}/mėn.
              </option>
            ))}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Nuo">
            <input type="date" value={form.startDate} onChange={set('startDate')} required />
          </Field>
          <Field label="Iki">
            <input type="date" value={form.endDate} min={form.startDate} onChange={set('endDate')} required />
          </Field>
        </div>
        <Field label="Pastabos" hint={`${form.notes.length}/500`}>
          <textarea rows="3" value={form.notes} onChange={set('notes')} maxLength={500} placeholder="pvz., atvyksiu vakare, reikės parkavimo vietos" />
        </Field>
        {selected && nights > 0 && (
          <div className="summary">
            <Icon name="clock" size={18} />
            <span>
              {nights} d. · apytikslė kaina <strong>{money((selected.monthlyRent / 30) * nights)}</strong>
            </span>
          </div>
        )}
      </form>
    </Modal>
  );
}
