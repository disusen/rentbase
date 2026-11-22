// HTTP client for the RentBase API.
//
// Access token: kept only in memory (this module), never in localStorage, so an XSS bug
// cannot read it from storage. Refresh token: HttpOnly cookie set by the API; JavaScript
// never sees it, the browser sends it to /api/auth/* by itself (credentials: 'include').
//
// When a call gets 401 because the access token expired, the client calls
// POST /api/auth/refresh once and repeats the original request.

const BASE = import.meta.env.VITE_API_URL ?? '';

let session = null; // { accessToken, accessTokenExpiresAt, user }
let refreshPromise = null;
const listeners = new Set();

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getSession() {
  return session;
}

export function onSessionChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSession(next) {
  session = next;
  listeners.forEach((l) => l(session));
}

// The API answers in English; the most common rule messages are shown in Lithuanian.
const MESSAGES_LT = [
  [/apartments before deleting the building/i, 'Pastato su butais ištrinti negalima – pirmiau pašalinkite jo butus.'],
  [/reservations before deleting it/i, 'Buto su rezervacijomis ištrinti negalima – pirmiau atšaukite rezervacijas.'],
  [/End date must be later/i, 'Pabaigos data turi būti vėlesnė už pradžios datą.'],
  [/already reserved/i, 'Butas šiomis datomis jau rezervuotas. Pasirinkite kitas datas.'],
  [/is not available for reservation/i, 'Šis butas šiuo metu nerezervuojamas.'],
  [/already (registered|exists|in use)/i, 'Toks el. paštas jau užregistruotas.'],
  [/role is not allowed/i, 'Jūsų rolė neleidžia atlikti šio veiksmo.'],
  [/only your own/i, 'Galite tvarkyti tik savo rezervacijas.'],
  [/has not been approved/i, 'Paskyra dar nepatvirtinta. Palaukite administratoriaus patvirtinimo.'],
  [/was not found/i, 'Įrašas nerastas (galbūt jau ištrintas).'],
];

const translate = (message) => MESSAGES_LT.find(([re]) => re.test(message))?.[1] ?? message;

async function parseError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    /* empty body */
  }
  let message = body?.detail || body?.title || `Klaida (${response.status})`;
  // ASP.NET validation errors: { title, errors: { Field: ["message"] } }
  if (body?.errors && typeof body.errors === 'object') {
    const first = Object.values(body.errors).flat()[0];
    if (first) message = first;
  }
  return new ApiError(response.status, translate(message), body);
}

// Only one refresh request at a time. The API rotates refresh tokens and treats a reused
// token as stolen, so two parallel refreshes would log the user out.
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          setSession(null);
          return null;
        }
        const data = await r.json();
        setSession(data);
        return data;
      })
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(path, { method = 'GET', body, retry = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && retry && session && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) return api(path, { method, body, retry: false });
  }

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return null;
  return response.json();
}

export async function login(email, password) {
  const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  setSession(data);
  return data;
}

export async function logout() {
  try {
    await api('/api/auth/logout', { method: 'POST', retry: false });
  } finally {
    setSession(null);
  }
}

export function qs(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : '';
}
