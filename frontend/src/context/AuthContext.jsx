import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing session on startup
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Connection failed. Database might be booting...');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Sync currentTheme when user logs in/out or settings change
  useEffect(() => {
    if (user?.settings?.appearance?.theme) {
      setCurrentTheme(user.settings.appearance.theme);
      localStorage.setItem('theme', user.settings.appearance.theme);
    }
  }, [user?.settings?.appearance?.theme]);

  // Handle theme application
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t) => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else if (t === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(currentTheme);

    if (currentTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [currentTheme]);

  async function toggleTheme() {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);

    if (user) {
      try {
        const token = localStorage.getItem('token');
        const appearance = {
          theme: nextTheme,
          accent: user.settings?.appearance?.accent || 'indigo',
          fontSize: user.settings?.appearance?.fontSize || 'medium'
        };
        const res = await fetch(`${BACKEND_URL}/api/users/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            notifications: user.settings?.notifications || {},
            appearance
          })
        });
        if (res.ok) {
          const data = await res.json();
          setUser(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              appearance: data.settings.appearance
            }
          }));
        }
      } catch (err) {
        console.error('Failed to sync toggled theme with backend:', err);
      }
    }
  }

  /**
   * Log in as a simulated Google account with custom role details
   */
  async function loginAsDemoRole(payload, isRegister = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, isRegister }) // Payload: email, name, role, department, faculty, graduationYear, isRegister
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Google OAuth login handler (accepts OAuth credentials from Google GSI library)
   */
  async function loginWithGoogleOAuth(credential, isRegister = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, isRegister })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'OAuth authentication failed');
      }

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Log out session
   */
  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = {
    user,
    loading,
    error,
    loginAsDemoRole,
    loginWithGoogleOAuth,
    logout,
    setUser,
    isAuthenticated: !!user,
    currentTheme,
    toggleTheme
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
