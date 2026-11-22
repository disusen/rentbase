import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Link } from '../router';
import Icon from '../components/Icon';
import { EmptyState, SkeletonGrid, buildingImage } from '../components/Common';
import ApartmentGrid from '../components/ApartmentGrid';
import ApartmentForm from '../forms/ApartmentForm';

export default function BuildingDetail({ id }) {
  const { isAdmin } = useAuth();
  const [building, setBuilding] = useState(null);
  const [apartments, setApartments] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setApartments(null);
    api(`/api/buildings/${id}`)
      .then(setBuilding)
      .catch(() => setNotFound(true));
    // Hierarchical endpoint: /buildings/{id}/apartments
    api(`/api/buildings/${id}/apartments?pageSize=100`)
      .then((d) => setApartments(d.items))
      .catch(() => setApartments([]));
  }, [id]);

  useEffect(load, [load]);

  if (notFound) {
    return (
      <div className="container page">
        <EmptyState
          icon="alert"
          title="Pastatas nerastas"
          text={`Pastato Nr. ${id} nėra.`}
          action={<Link to="/buildings" className="btn btn--primary">Grįžti į sąrašą</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to="/buildings" className="back-link">
        <Icon name="chevronLeft" size={18} /> Visi pastatai
      </Link>

      {!building ? (
        <div className="skeleton skeleton--hero" />
      ) : (
        <section className="detail">
          <div className="detail__media">
            <img src={buildingImage(building.id)} alt={`Pastatas ${building.name}`} />
          </div>
          <div className="detail__body">
            <span className="badge badge--city">{building.city}</span>
            <h1>{building.name}</h1>
            <p className="muted"><Icon name="pin" size={18} /> {building.address}, {building.city}</p>
            <p>{building.description}</p>
            <ul className="meta meta--lg">
              <li><Icon name="clock" size={18} /> Pastatytas {building.yearBuilt} m.</li>
              <li><Icon name="key" size={18} /> {building.apartmentCount} butai</li>
            </ul>
          </div>
        </section>
      )}

      <div className="section__head">
        <h2 className="section__title">Butai šiame pastate</h2>
        {isAdmin && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> Pridėti butą
          </button>
        )}
      </div>

      {!apartments ? (
        <SkeletonGrid count={3} variant="apt" />
      ) : apartments.length === 0 ? (
        <EmptyState icon="key" title="Butų dar nėra" />
      ) : (
        <ApartmentGrid items={apartments} onChanged={load} showBuilding={false} />
      )}

      {creating && (
        <ApartmentForm
          buildingId={Number(id)}
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
