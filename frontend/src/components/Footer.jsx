import { Link } from '../router';
import Icon from './Icon';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <span className="site-footer__logo">
            <img src="/favicon.svg" alt="" width="30" height="30" />
            RentBase
          </span>
          <p>Gyvenamųjų pastatų, butų ir nuomos rezervacijų valdymas vienoje vietoje.</p>
        </div>

        <div>
          <h4>Naršyti</h4>
          <ul>
            <li><Link to="/buildings" className="footer-link">Pastatai</Link></li>
            <li><Link to="/apartments" className="footer-link">Laisvi butai</Link></li>
            <li><Link to="/register" className="footer-link">Tapti nariu</Link></li>
          </ul>
        </div>

        <div>
          <h4>Kontaktai</h4>
          <ul className="site-footer__contacts">
            <li><Icon name="pin" size={16} /> Studentų g. 50, Kaunas</li>
            <li><Icon name="mail" size={16} /> <a className="footer-link" href="mailto:info@rentbase.lt">info@rentbase.lt</a></li>
            <li><Icon name="phone" size={16} /> +370 600 00000</li>
          </ul>
        </div>

        <div>
          <h4>Projektas</h4>
          <ul>
            <li><a className="footer-link" href="/swagger/index.html" target="_blank" rel="noreferrer">API dokumentacija</a></li>
            <li><a className="footer-link" href="https://github.com/disusen/rentbase" target="_blank" rel="noreferrer">GitHub</a></li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <div className="container">
          © 2026 RentBase · Gvidas Rakauskas, IFF-3/1 · KTU Saityno taikomųjų programų projektavimas
        </div>
      </div>
    </footer>
  );
}
