import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from '../router';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { buildingImage } from '../components/Common';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    Promise.all([api('/api/buildings?pageSize=3'), api('/api/apartments?available=true&pageSize=1')])
      .then(([b, a]) => {
        setFeatured(b.items);
        setStats({ buildings: b.totalCount, free: a.totalCount });
      })
      .catch(() => setStats({ buildings: '–', free: '–' }));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__text">
            <span className="eyebrow eyebrow--light">Nuomos valdymo platforma</span>
            <h1>
              Pastatai, butai ir rezervacijos – <em>vienoje vietoje</em>
            </h1>
            <p>
              RentBase padeda administratoriams prižiūrėti gyvenamuosius pastatus, o nariams – greitai rasti laisvą butą ir
              jį rezervuoti norimoms datoms.
            </p>
            <div className="hero__actions">
              <Link to="/apartments" className="btn btn--accent btn--lg">
                Laisvi butai <Icon name="arrowRight" size={18} />
              </Link>
              {!user && (
                <Link to="/register" className="btn btn--light btn--lg">
                  <Icon name="userPlus" size={18} /> Tapti nariu
                </Link>
              )}
            </div>
            <dl className="hero__stats">
              <div>
                <dt>Pastatų</dt>
                <dd>{stats ? stats.buildings : <span className="dots" />}</dd>
              </div>
              <div>
                <dt>Laisvų butų</dt>
                <dd>{stats ? stats.free : <span className="dots" />}</dd>
              </div>
              <div>
                <dt>Miestai</dt>
                <dd>2</dd>
              </div>
            </dl>
          </div>
          <div className="hero__art">
            <img src="/images/hero.svg" alt="Iliustracija: miesto gyvenamieji namai" />
          </div>
        </div>
      </section>

      <section className="section container">
        <h2 className="section__title">Kaip tai veikia</h2>
        <div className="grid grid--three">
          {[
            { icon: 'building', title: 'Naršykite pastatus', text: 'Peržiūrėkite pastatus Kaune ir Vilniuje, jų aprašymus ir butų sąrašus – be registracijos.' },
            { icon: 'shield', title: 'Patvirtinta narystė', text: 'Užsiregistravę palaukite administratoriaus patvirtinimo – taip apsaugome nuomotojus ir nuomininkus.' },
            { icon: 'calendar', title: 'Rezervuokite datas', text: 'Pasirinkite butą ir laikotarpį. Sistema neleis rezervuoti jau užimtų datų.' },
          ].map((f, i) => (
            <article key={f.title} className="feature" style={{ animationDelay: `${i * 100}ms` }}>
              <span className="feature__icon">
                <Icon name={f.icon} size={26} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section container">
          <div className="section__head">
            <h2 className="section__title">Pastatai</h2>
            <Link to="/buildings" className="text-link">
              Visi pastatai <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <div className="grid grid--cards">
            {featured.map((b) => (
              <Link key={b.id} to={`/buildings/${b.id}`} className="card card--link">
                <div className="card__media">
                  <img src={buildingImage(b.id)} alt={`Pastatas ${b.name}`} loading="lazy" />
                  <span className="badge badge--city">{b.city}</span>
                </div>
                <div className="card__body">
                  <h3>{b.name}</h3>
                  <p className="muted"><Icon name="pin" size={16} /> {b.address}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
