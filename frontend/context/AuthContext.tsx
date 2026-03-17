'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthUser { token: string; role: string; email: string; }
interface AuthCtx { user: AuthUser | null; ready: boolean; login: (u: AuthUser) => void; logout: () => void; }

const Ctx = createContext<AuthCtx>({ user: null, ready: false, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    if (token && role && email) setUser({ token, role, email });
    setReady(true);
  }, []);

  const login = (u: AuthUser) => {
    localStorage.setItem('token', u.token);
    localStorage.setItem('role', u.role);
    localStorage.setItem('email', u.email);
    setUser(u);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
