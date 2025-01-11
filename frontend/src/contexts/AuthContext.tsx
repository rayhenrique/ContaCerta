import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  accessLevel: 'admin' | 'operator';
}

interface AuthError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = localStorage.getItem('@ContaCerta:token');
        const storedUser = localStorage.getItem('@ContaCerta:user');

        if (storedToken && storedUser) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        localStorage.removeItem('@ContaCerta:token');
        localStorage.removeItem('@ContaCerta:user');
      } finally {
        setLoading(false);
      }
    };

    loadStoredData();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('@ContaCerta:token', token);
      localStorage.setItem('@ContaCerta:user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      navigate('/');
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = authError.response?.data?.message || 'Erro ao fazer login. Verifique suas credenciais.';
      throw new Error(errorMessage);
    }
  };

  const signOut = () => {
    localStorage.removeItem('@ContaCerta:token');
    localStorage.removeItem('@ContaCerta:user');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
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

export type { User };
