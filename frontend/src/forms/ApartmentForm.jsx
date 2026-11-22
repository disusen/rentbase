import { useEffect, useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Field, FormError } from '../components/Common';

export default function ApartmentForm({ apartment, buildingId, onClose, onSaved }) {
  const editing = Boolean(apartment);
  const toast = useToast();
  const [buildings, setBuildings] = useState([]);
  const [form, setForm] = useState({
    buildingId: apartment?.buildingId ?? buildingId ?? '',
    number: apartment?.number ?? '',
    floor: apartment?.floor ?? 1,
    rooms: apartment?.rooms ?? 2,
    areaSqm: apartment?.areaSqm ?? 50,
    monthlyRent: apartment?.monthlyRent ?? 700,
    isAvailable: apartment?.isAvailable ?? true,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/buildings?pageSize=100')
      .then((d) => {
        setBuildings(d.items);
        setForm((f) => (f.buildingId ? f : { ...f, buildingId: d.items[0]?.id ?? '' }));
      })
      .catch(() => setError('Nepavyko gauti pastatų sąrašo.'));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.number.trim()) {
      setError('Įveskite buto numerį.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = {
        buildingId: Number(form.buildingId),
        number: form.number.trim(),
        floor: Number(form.floor),
        rooms: Number(form.rooms),
        areaSqm: Number(form.areaSqm),
        monthlyRent: Number(form.monthlyRent),
        isAvailable: form.isAvailable,
      };
      const saved = editing
        ? await api(`/api/apartments/${apartment.id}`, { method: 'PUT', body })
        : await api('/api/apartments', { method: 'POST', body });
      toast.success(editing ? 'Butas atnaujintas' : 'Butas pridėtas', `${saved.buildingName}, butas ${saved.number}`);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? `Redaguoti butą ${apartment.number}` : 'Naujas butas'}
      icon="key"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Atšaukti</button>
          <button type="submit" form="apartment-form" className="btn btn--primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={18} />}
            {editing ? 'Išsaugoti' : 'Pridėti'}
          </button>
        </>
      }
    >
      <form id="apartment-form" className="form-grid" onSubmit={submit} noValidate>
        <FormError message={error} />
        <Field label="Pastatas">
          <select value={form.buildingId} onChange={set('buildingId')} required>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
            ))}
          </select>
        </Field>
        <div className="form-row">
          <Field label="Buto nr.">
            <input type="text" value={form.number} onChange={set('number')} maxLength={20} required placeholder="pvz., 12A" />
          </Field>
          <Field label="Aukštas">
            <input type="number" min="0" max="80" value={form.floor} onChange={set('floor')} />
          </Field>
        </div>
        <Field label={`Kambariai: ${form.rooms}`}>
          <input type="range" min="1" max="6" value={form.rooms} onChange={set('rooms')} />
        </Field>
        <div className="form-row">
          <Field label="Plotas, m²">
            <input type="number" min="8" max="500" step="0.1" value={form.areaSqm} onChange={set('areaSqm')} />
          </Field>
          <Field label="Mėnesio kaina, €">
            <input type="number" min="1" max="20000" step="10" value={form.monthlyRent} onChange={set('monthlyRent')} />
          </Field>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
          />
          <span className="switch__track" aria-hidden="true" />
          <span>Butas laisvas rezervacijoms</span>
        </label>
      </form>
    </Modal>
  );
}
