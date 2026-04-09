import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  name?: string;
  entityId?: string;
  active?: boolean;
  createdAt?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_URL = 'http://localhost:4000/api/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ehr_user');
    const token = localStorage.getItem('ehr_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await axios.post(`${AUTH_URL}/login`, { email, password });
      const { user, token } = response.data;
      
      localStorage.setItem('ehr_token', token);
      localStorage.setItem('ehr_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const register = async (payload: any): Promise<any> => {
    try {
      const response = await axios.post(`${AUTH_URL}/register`, payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem('ehr_token');
    localStorage.removeItem('ehr_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
