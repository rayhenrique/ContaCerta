import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  accessLevel: 'admin' | 'operator';
}

interface AuthState {
  token: string;
  user: User;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User;
  loading: boolean;
  isAuthenticated: boolean;
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut(): void;
  updateUser(user: User): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AuthState>(() => {
    const token = localStorage.getItem('@ContaCerta:token');
    const user = localStorage.getItem('@ContaCerta:user');

    if (token && user) {
      api.defaults.headers.authorization = `Bearer ${token}`;
      return { token, user: JSON.parse(user) };
    }

    return {} as AuthState;
  });
  const [loading, setLoading] = useState(true);

  const signIn = useCallback(async ({ email, password }: SignInCredentials) => {
    const response = await api.post('auth/login', {
      email,
      password,
    });

    const { token, user } = response.data;

    localStorage.setItem('@ContaCerta:token', token);
    localStorage.setItem('@ContaCerta:user', JSON.stringify(user));

    api.defaults.headers.authorization = `Bearer ${token}`;

    setData({ token, user });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('@ContaCerta:token');
    localStorage.removeItem('@ContaCerta:user');

    setData({} as AuthState);
  }, []);

  const updateUser = useCallback(
    (user: User) => {
      localStorage.setItem('@ContaCerta:user', JSON.stringify(user));

      setData({
        token: data.token,
        user,
      });
    },
    [data.token],
  );

  return (
    <AuthContext.Provider
      value={{
        user: data.user,
        loading,
        isAuthenticated: !!data.token,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
