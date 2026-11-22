// Authentication state shared through React Context.
// On start the app calls /api/auth/refresh: if the HttpOnly cookie is still valid the user
// stays logged in after a page reload. A timer refreshes the access token one minute
// before it expires, so the user never has to log in again while the session lives.
import { createContext, useContext, useEffect, useState } from 'react';
import * as client from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(client.getSession());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const off = client.onSessionChange(setSession);
    client.refreshSession().finally(() => setReady(true));
    return off;
  }, []);

  useEffect(() => {
    if (!session?.accessTokenExpiresAt) return undefined;
    const msLeft = new Date(session.accessTokenExpiresAt).getTime() - Date.now() - 60_000;
    const timer = setTimeout(() => client.refreshSession(), Math.max(msLeft, 5_000));
    return () => clearTimeout(timer);
  }, [session]);

  const user = session?.user ?? null;
  const value = {
    user,
    ready,
    isAdmin: user?.role === 'Admin',
    isMember: Boolean(user),
    login: client.login,
    logout: client.logout,
    register: (body) => client.api('/api/auth/register', { method: 'POST', body }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
