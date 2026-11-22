import { useEffect, useState } from 'react';
import { Link, useRouter } from '../router';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import Icon from './Icon';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { path, navigate } = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => setOpen(false), [path]);

  const links = [
    { to: '/', label: 'Pradžia', icon: 'home' },
    { to: '/buildings', label: 'Pastatai', icon: 'building' },
    { to: '/apartments', label: 'Butai', icon: 'key' },
  ];
  if (user) links.push({ to: '/reservations', label: isAdmin ? 'Rezervacijos' : 'Mano rezervacijos', icon: 'calendar' });
  if (isAdmin) links.push({ to: '/admin/users', label: 'Naudotojai', icon: 'users' });

  const handleLogout = async () => {
    await logout();
    toast.info('Atsijungta', 'Iki pasimatymo!');
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="RentBase pradžia">
          <img src="/favicon.svg" alt="" width="34" height="34" />
          <span>
            Rent<em>Base</em>
          </span>
        </Link>

        <button
          type="button"
          className={`hamburger${open ? ' is-open' : ''}`}
          aria-label={open ? 'Uždaryti meniu' : 'Atidaryti meniu'}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-nav" className={`main-nav${open ? ' is-open' : ''}`} aria-label="Pagrindinis meniu">
          <ul className="main-nav__links">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="nav-link">
                  <Icon name={l.icon} size={18} />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="main-nav__auth">
            {user ? (
              <>
                <span className="user-chip" title={user.email}>
                  <span className="user-chip__avatar">{user.fullName.charAt(0)}</span>
                  <span className="user-chip__text">
                    {user.fullName.split(' ')[0]}
                    <small>{isAdmin ? 'Administratorius' : 'Narys'}</small>
                  </span>
                </span>
                <button type="button" className="header-btn header-btn--outline" onClick={handleLogout}>
                  <Icon name="logout" size={18} />
                  Atsijungti
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header-btn header-btn--outline">
                  <Icon name="login" size={18} />
                  Prisijungti
                </Link>
                <Link to="/register" className="header-btn header-btn--solid">
                  <Icon name="userPlus" size={18} />
                  Registruotis
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
