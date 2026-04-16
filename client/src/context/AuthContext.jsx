import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('session');
    const savedUser = localStorage.getItem('user');
    if (session && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (silentFail = false) => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setUser(JSON.parse(localStorage.getItem('user')));
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (!silentFail) {
        // Only logout if this was a background session restore (not a fresh login/register)
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('session', JSON.stringify(data.session));
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setLoading(false);
    fetchProfile(true); // silentFail=true: don't logout if profile fetch fails
    return data;
  };

  const register = async (email, password, full_name) => {
    const { data } = await api.post('/auth/register', { email, password, full_name });
    localStorage.setItem('session', JSON.stringify(data.session));
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setLoading(false);
    fetchProfile(true); // silentFail=true: don't logout if profile fetch fails
    return data;
  };

  const logout = () => {
    localStorage.removeItem('session');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
