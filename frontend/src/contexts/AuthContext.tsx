import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  accessLevel: 'admin' | 'operator';
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
      const storedToken = localStorage.getItem('@ContaCerta:token');
      const storedUser = localStorage.getItem('@ContaCerta:user');

      if (storedToken && storedUser) {
        console.log('Token encontrado:', storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      } else {
        console.log('Nenhum token encontrado');
      }

      setLoading(false);
    };

    loadStoredData();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Iniciando login...');
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('AuthContext: Resposta do servidor:', response.data);
      const { token, user: userData } = response.data;

      localStorage.setItem('@ContaCerta:token', token);
      localStorage.setItem('@ContaCerta:user', JSON.stringify(userData));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      console.log('AuthContext: Login concluído com sucesso');
      navigate('/');
    } catch (error) {
      console.error('AuthContext: Erro no login:', error);
      throw error;
    }
  };

  const signOut = () => {
    console.log('AuthContext: Fazendo logout...');
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
