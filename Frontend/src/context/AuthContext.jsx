import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../utils/api';
import { disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const publicRoutes = ["/login", "/register"];

    if (publicRoutes.includes(window.location.pathname)) {
      setLoading(false);
      return;
    }

    getMe()
      .then(res => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await apiLogin(credentials);
    const userData = res.data.data;
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (credentials) => {
    await apiRegister(credentials);
    return login(credentials);
  }, [login]);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
