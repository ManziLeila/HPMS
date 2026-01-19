import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hpms_admin_token';

export const AuthProvider = ({ children }) => {
  const initialToken = window.localStorage.getItem(STORAGE_KEY);
  const [token, setToken] = useState(() => initialToken);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(() => Boolean(initialToken));

  useEffect(() => {
    let isActive = true;

    if (!token) {
      return () => {
        isActive = false;
      };
    }

    apiClient
      .get('/auth/me', { token })
      .then((profile) => {
        if (isActive) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (isActive) {
          setToken(null);
          window.localStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => {
        if (isActive) {
          setInitializing(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const finalizeLogin = useCallback(
    async (authToken) => {
      setToken(authToken);
      window.localStorage.setItem(STORAGE_KEY, authToken);
      const profile = await apiClient.get('/auth/me', { token: authToken });
      setUser(profile);
      setInitializing(false);
    },
    [setToken, setUser, setInitializing],
  );

  const login = useCallback(
    async ({ email, password, mfaCode }) => {
      const sanitizedEmail = String(email || '').trim();
      const sanitizedPassword = String(password || '');
      const sanitizedMfaCode = String(mfaCode || '').trim();

      const loginResponse = await apiClient.post('/auth/login', {
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      if (loginResponse.token && loginResponse.requiresMfa === false) {
        await finalizeLogin(loginResponse.token);
        return;
      }

      if (!loginResponse.preToken) {
        throw new Error('MFA token missing from server response');
      }

      if (!sanitizedMfaCode) {
        throw new Error('MFA code is required');
      }

      const verification = await apiClient.post('/auth/mfa', {
        token: String(loginResponse.preToken),
        code: sanitizedMfaCode,
      });

      await finalizeLogin(verification.token);
    },
    [finalizeLogin],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiClient.post('/auth/logout', null, { token });
      } catch (error) {
        console.warn('Failed to notify backend about logout', error);
      }
    }
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
    setInitializing(false);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      login,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, user, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };