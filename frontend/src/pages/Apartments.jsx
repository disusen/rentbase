import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import Icon from '../components/Icon';
import { EmptyState, PageHeader, Pagination, SkeletonGrid } from '../components/Common';
import ApartmentGrid from '../components/ApartmentGrid';
import ApartmentForm from '../forms/ApartmentForm';

const PAGE_SIZE = 9;
const AVAILABILITY = [
  { value: 'true', label: 'Laisvi' },
  { value: 'false', label: 'Užimti' },
  { value: '', label: 'Visi' },
];

export default function Apartments() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [available, setAvailable] = useState('true');
  const [buildingId, setBuildingId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setData(null);
    api(`/api/apartments${qs({ available, buildingId, page, pageSize: PAGE_SIZE })}`)
      .then(setData)
      .catch((e) => toast.error('Nepavyko įkelti butų', e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, buildingId, page]);

  useEffect(load, [load]);

  useEffect(() => {
    api('/api/buildings?pageSize=100').then((d) => setBuildings(d.items)).catch(() => {});
  }, []);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Katalogas"
        title="Butai"
        text="Filtruokite pagal pastatą ir užimtumą, rezervuokite laisvą butą."
        actions={
          isAdmin && (
            <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={18} /> Naujas butas
            </button>
          )
        }
      />

      <div className="toolbar">
        <div className="segmented" role="radiogroup" aria-label="Užimtumas">
          {AVAILABILITY.map((o) => (
            <label key={o.label} className={`segmented__item${available === o.value ? ' is-checked' : ''}`}>
              <input
                type="radio"
                name="availability"
                value={o.value}
                checked={available === o.value}
                onChange={() => {
                  setAvailable(o.value);
                  setPage(1);
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
        <label className="toolbar__field">
          <Icon name="building" size={18} />
          <span className="sr-only">Pastatas</span>
          <select
            value={buildingId}
            onChange={(e) => {
              setBuildingId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Visi pastatai</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
        {data && <span className="muted">Rasta: {data.totalCount}</span>}
      </div>

      {!data ? (
        <SkeletonGrid count={6} variant="apt" />
      ) : data.items.length === 0 ? (
        <EmptyState icon="key" title="Butų nerasta" text="Pakeiskite filtrus arba užsukite vėliau." />
      ) : (
        <ApartmentGrid items={data.items} onChanged={load} />
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {creating && (
        <ApartmentForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}
