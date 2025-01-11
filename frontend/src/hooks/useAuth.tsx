import React, { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';
import { User } from '../types/user';

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredData() {
      const storedToken = localStorage.getItem('@ContaCerta:token');
      const storedUser = localStorage.getItem('@ContaCerta:user');

      if (storedToken && storedUser) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }

      setLoading(false);
    }

    loadStoredData();
  }, []);

  const signIn = async ({ email, password }: SignInCredentials) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem('@ContaCerta:token', token);
      localStorage.setItem('@ContaCerta:user', JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error) {
      throw new Error('Falha na autenticação');
    }
  };

  const signOut = () => {
    localStorage.removeItem('@ContaCerta:token');
    localStorage.removeItem('@ContaCerta:user');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
