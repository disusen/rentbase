import { useEffect } from 'react';
import { matchPath, useRouter, Link } from './router';
import { useAuth } from './auth';
import Header from './components/Header';
import Footer from './components/Footer';
import { EmptyState } from './components/Common';
import Home from './pages/Home';
import Buildings from './pages/Buildings';
import BuildingDetail from './pages/BuildingDetail';
import Apartments from './pages/Apartments';
import Reservations from './pages/Reservations';
import Users from './pages/Users';
import { Login, Register } from './pages/Auth';

function Redirect({ to }) {
  const { navigate } = useRouter();
  useEffect(() => navigate(to), [navigate, to]);
  return null;
}

function Page() {
  const { path } = useRouter();
  const { user, isAdmin, ready } = useAuth();

  if (!ready) {
    return (
      <div className="container page page--center">
        <span className="spinner spinner--lg" />
      </div>
    );
  }

  if (path === '/') return <Home />;
  if (path === '/buildings') return <Buildings />;
  const building = matchPath('/buildings/:id', path);
  if (building) return <BuildingDetail id={building.id} />;
  if (path === '/apartments') return <Apartments />;
  if (path === '/reservations') return user ? <Reservations /> : <Redirect to="/login" />;
  if (path === '/admin/users') return isAdmin ? <Users /> : <Redirect to={user ? '/' : '/login'} />;
  if (path === '/login') return user ? <Redirect to="/" /> : <Login />;
  if (path === '/register') return user ? <Redirect to="/" /> : <Register />;

  return (
    <div className="container page">
      <EmptyState icon="alert" title="Puslapis nerastas" text="Tokio adreso nėra." action={<Link to="/" className="btn btn--primary">Į pradžią</Link>} />
    </div>
  );
}

export default function App() {
  const { path } = useRouter();
  return (
    <div className="app">
      <Header />
      <main className="site-main" key={path}>
        <Page />
      </main>
      <Footer />
    </div>
  );
}
