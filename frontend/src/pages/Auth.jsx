import { useState } from 'react';
import { useAuth } from '../auth';
import { useToast } from '../toast';
import { Link, useRouter } from '../router';
import Icon from '../components/Icon';
import { Field, FormError } from '../components/Common';

function AuthLayout({ title, text, children }) {
  return (
    <div className="container page auth">
      <div className="auth__card">
        <div className="auth__side">
          <img src="/images/hero.svg" alt="" />
          <p>Pastatai, butai ir rezervacijos – vienoje vietoje.</p>
        </div>
        <div className="auth__form">
          <h1>{title}</h1>
          <p className="muted">{text}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(form.email.trim(), form.password);
      toast.success('Sveiki sugrįžę!', data.user.fullName);
      navigate(data.user.role === 'Admin' ? '/reservations' : '/apartments');
    } catch (err) {
      setError(err.status === 403 ? 'Paskyra dar nepatvirtinta. Palaukite administratoriaus patvirtinimo.' : err.status === 401 ? 'Neteisingas el. paštas arba slaptažodis.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Prisijungimas" text="Prisijunkite, kad galėtumėte rezervuoti butus.">
      <form className="form-grid" onSubmit={submit}>
        <FormError message={error} />
        <Field label="El. paštas">
          <input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vardas@pastas.lt" />
        </Field>
        <Field label="Slaptažodis">
          <input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? <span className="spinner" /> : <Icon name="login" size={18} />} Prisijungti
        </button>
        <p className="auth__switch">
          Neturite paskyros? <Link to="/register" className="text-link">Registruokitės</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function Register() {
  const { register } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '', terms: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(form.password)).length);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Slaptažodis turi būti bent 8 simbolių.');
    if (form.password !== form.confirm) return setError('Slaptažodžiai nesutampa.');
    if (!form.terms) return setError('Sutikite su naudojimosi taisyklėmis.');
    setBusy(true);
    setError('');
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
      toast.success('Paskyra sukurta', 'Administratorius turi ją patvirtinti, tada galėsite prisijungti.');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <AuthLayout title="Registracija" text="Sukurkite nario paskyrą. Ją patvirtins administratorius.">
      <form className="form-grid" onSubmit={submit}>
        <FormError message={error} />
        <Field label="Vardas ir pavardė">
          <input type="text" autoComplete="name" required maxLength={120} value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="El. paštas">
          <input type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="vardas@pastas.lt" />
        </Field>
        <Field label="Slaptažodis" hint="Bent 8 simboliai">
          <input type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} />
        </Field>
        <div className={`strength strength--${strength}`} aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <Field label="Pakartokite slaptažodį">
          <input type="password" autoComplete="new-password" required value={form.confirm} onChange={set('confirm')} />
        </Field>
        <label className="check">
          <input type="checkbox" checked={form.terms} onChange={set('terms')} />
          <span>Sutinku su naudojimosi taisyklėmis</span>
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? <span className="spinner" /> : <Icon name="userPlus" size={18} />} Registruotis
        </button>
        <p className="auth__switch">
          Jau turite paskyrą? <Link to="/login" className="text-link">Prisijunkite</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
