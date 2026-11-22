import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../api';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { Link } from '../router';
import Icon from '../components/Icon';
import { ConfirmModal } from '../components/Modal';
import { EmptyState, PageHeader, Pagination, SkeletonGrid, buildingImage } from '../components/Common';
import BuildingForm from '../forms/BuildingForm';

const PAGE_SIZE = 6;

export default function Buildings() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | building
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setData(null);
    api(`/api/buildings${qs({ city, page, pageSize: PAGE_SIZE })}`)
      .then(setData)
      .catch((e) => toast.error('Nepavyko įkelti pastatų', e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, page]);

  useEffect(load, [load]);

  useEffect(() => {
    api('/api/buildings?pageSize=100')
      .then((d) => setCities([...new Set(d.items.map((b) => b.city))].sort()))
      .catch(() => {});
  }, [data?.totalCount]);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/buildings/${deleting.id}`, { method: 'DELETE' });
      toast.success('Pastatas ištrintas', deleting.name);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error('Nepavyko ištrinti', e.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Katalogas"
        title="Pastatai"
        text="Visi platformoje registruoti gyvenamieji pastatai."
        actions={
          isAdmin && (
            <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
              <Icon name="plus" size={18} /> Naujas pastatas
            </button>
          )
        }
      />

      <div className="toolbar">
        <label className="toolbar__field">
          <Icon name="filter" size={18} />
          <span className="sr-only">Miestas</span>
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Visi miestai</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        {data && <span className="muted">Rasta: {data.totalCount}</span>}
      </div>

      {!data ? (
        <SkeletonGrid count={PAGE_SIZE} />
      ) : data.items.length === 0 ? (
        <EmptyState icon="building" title="Pastatų nerasta" text="Pabandykite pasirinkti kitą miestą." />
      ) : (
        <div className="grid grid--cards">
          {data.items.map((b, i) => (
            <article key={b.id} className="card" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="card__media">
                <img src={buildingImage(b.id)} alt={`Pastatas ${b.name}`} loading="lazy" />
                <span className="badge badge--city">{b.city}</span>
              </div>
              <div className="card__body">
                <h3>{b.name}</h3>
                <p className="muted"><Icon name="pin" size={16} /> {b.address}</p>
                <p className="card__desc">{b.description}</p>
                <ul className="meta">
                  <li><Icon name="clock" size={16} /> {b.yearBuilt} m.</li>
                  <li><Icon name="key" size={16} /> {b.apartmentCount} butai</li>
                </ul>
              </div>
              <div className="card__footer">
                <Link to={`/buildings/${b.id}`} className="btn btn--soft btn--sm">
                  Butai <Icon name="arrowRight" size={16} />
                </Link>
                {isAdmin && (
                  <div className="icon-actions">
                    <button type="button" className="icon-btn" onClick={() => setEditing(b)} aria-label={`Redaguoti ${b.name}`} title="Redaguoti">
                      <Icon name="edit" size={18} />
                    </button>
                    <button type="button" className="icon-btn icon-btn--danger" onClick={() => setDeleting(b)} aria-label={`Ištrinti ${b.name}`} title="Ištrinti">
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {editing && (
        <BuildingForm
          building={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Ištrinti pastatą?"
          message={`Pastatas „${deleting.name}“ bus ištrintas visam laikui. Pastatą su butais ištrinti negalima – pirmiau pašalinkite jo butus.`}
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
