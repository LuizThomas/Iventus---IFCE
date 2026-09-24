import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getStoredToken, setStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickSwitchUser: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserContext: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setStoredToken(null);
        setUser(null);
      }
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, senha });
      if (res.success && res.token) {
        setStoredToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      if (res.success && res.token) {
        setStoredToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const quickSwitchUser = async (role: UserRole) => {
    let email = 'participante@teste.com';
    let senha = 'participante123';

    if (role === 'PROFESSOR') {
      email = 'professor@teste.com';
      senha = 'professor123';
    } else if (role === 'ADMINISTRADOR') {
      email = 'admin@teste.com';
      senha = 'admin123';
    }

    await login(email, senha);
  };

  const updateUserContext = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickSwitchUser,
        refreshUser,
        updateUserContext
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
