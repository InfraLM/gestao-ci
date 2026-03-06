import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

export interface Usuario {
  id: string;
  nome: string;
  login: string;
  cargo: string;
}

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ci_token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('ci_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        logout();
      }
    }
  }, []);

  const login = async (loginVal: string, senha: string) => {
    const response = await authAPI.login(loginVal, senha);
    setToken(response.token);
    setUser(response.usuario);
    localStorage.setItem('ci_token', response.token);
    localStorage.setItem('ci_user', JSON.stringify(response.usuario));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ci_token');
    localStorage.removeItem('ci_user');
  };

  const isVendedor = user?.cargo?.toLowerCase() === 'vendedor';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isVendedor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
