import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SupportedCurrency } from '@finpilot/shared';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, currency: SupportedCurrency) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('finpilot_token', data.token);
    setUser(data.user);
  }

  async function register(email: string, password: string, fullName: string, currency: SupportedCurrency) {
    const data = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, currency }),
    });
    localStorage.setItem('finpilot_token', data.token);
    setUser(data.user);
  }

  async function demoLogin() {
    const data = await apiRequest<{ user: User; token: string }>('/auth/demo', {
      method: 'POST',
    });
    localStorage.setItem('finpilot_token', data.token);
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('finpilot_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
