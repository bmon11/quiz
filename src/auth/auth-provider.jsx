'use client';

import { mutate } from 'swr';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import axios, { TOKEN_KEY, readToken, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------
// Signed-in player: email + password or Google. The token lives in
// localStorage and axios sends it on every call, so a finished quiz is saved
// to the player's progress without the quiz screens knowing about accounts.

const AuthContext = createContext(null);

/** Lowest to highest — same ladder as the API. */
export const ROLES = ['user', 'contributor', 'editor', 'admin'];

/** True when `user` has at least role `min`. */
export const hasRole = (user, min) => !!user && ROLES.indexOf(user.role) >= ROLES.indexOf(min);

const storeToken = (token) => {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private mode — the session lasts until the tab closes
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!readToken()) {
      setChecking(false);
      return;
    }
    axios
      .get(endpoints.auth.me)
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        // Only a rejected token signs out; a network blip keeps it for next time.
        if (err?.message === 'Please sign in') storeToken(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const accept = useCallback((data) => {
    storeToken(data.token);
    setUser(data.user);
    // Topic stats etc. stay; anything personal is refetched.
    mutate(endpoints.analysis);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) =>
      accept((await axios.post(endpoints.auth.login, { email, password })).data),
    [accept]
  );
  const register = useCallback(
    async (name, email, password) =>
      accept((await axios.post(endpoints.auth.register, { name, email, password })).data),
    [accept]
  );
  const loginWithGoogle = useCallback(
    async (credential) => accept((await axios.post(endpoints.auth.google, { credential })).data),
    [accept]
  );
  const logout = useCallback(() => {
    storeToken(null);
    setUser(null);
    mutate(endpoints.analysis, null, { revalidate: false });
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {
      // Google script not loaded — nothing to reset
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      checking,
      isAdmin: hasRole(user, 'admin'),
      isEditor: hasRole(user, 'editor'),
      // Contributors and up open the admin page.
      canContribute: hasRole(user, 'contributor'),
      /** Editors change anything; contributors what they added. */
      mayEdit: (item) =>
        hasRole(user, 'editor') || (!!item?.createdBy && item.createdBy === user?.id),
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, checking, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
