import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../toast';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Field, FormError } from '../components/Common';

const CITIES = ['Kaunas', 'Vilnius', 'Klaipėda', 'Šiauliai', 'Panevėžys'];

export default function BuildingForm({ building, onClose, onSaved }) {
  const editing = Boolean(building);
  const toast = useToast();
  const [form, setForm] = useState({
    name: building?.name ?? '',
    address: building?.address ?? '',
    city: building?.city ?? 'Kaunas',
    yearBuilt: building?.yearBuilt ?? 2020,
    description: building?.description ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      setError('Užpildykite pavadinimą ir adresą.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { ...form, yearBuilt: Number(form.yearBuilt) };
      const saved = editing
        ? await api(`/api/buildings/${building.id}`, { method: 'PUT', body })
        : await api('/api/buildings', { method: 'POST', body });
      toast.success(editing ? 'Pastatas atnaujintas' : 'Pastatas sukurtas', saved.name);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Redaguoti pastatą' : 'Naujas pastatas'}
      icon="building"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Atšaukti</button>
          <button type="submit" form="building-form" className="btn btn--primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={18} />}
            {editing ? 'Išsaugoti' : 'Sukurti'}
          </button>
        </>
      }
    >
      <form id="building-form" className="form-grid" onSubmit={submit} noValidate>
        <FormError message={error} />
        <Field label="Pavadinimas">
          <input type="text" value={form.name} onChange={set('name')} maxLength={160} required placeholder="pvz., Žaliakalnio rezidencija" />
        </Field>
        <div className="form-row">
          <Field label="Miestas">
            <select value={form.city} onChange={set('city')}>
              {[...new Set([...CITIES, form.city])].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Statybos metai" hint="1800–2100">
            <input type="number" min="1800" max="2100" value={form.yearBuilt} onChange={set('yearBuilt')} required />
          </Field>
        </div>
        <Field label="Adresas">
          <input type="text" value={form.address} onChange={set('address')} maxLength={200} required placeholder="Gatvė, namo nr." />
        </Field>
        <Field label="Aprašymas" hint={`${form.description.length}/1000`}>
          <textarea rows="4" value={form.description} onChange={set('description')} maxLength={1000} placeholder="Kuo išsiskiria šis pastatas?" />
        </Field>
      </form>
    </Modal>
  );
}
