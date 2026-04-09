import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import authService, { type RegisterPayload } from '../services/authService';
import { clearStoredAuth, getStoredToken, getStoredUser, storeAuth } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch {
      // Ignore logout transport errors and still clear client state.
    } finally {
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      storeAuth(response.token, response.user);
      setUser(response.user);
      setToken(response.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        await authService.register(payload);
        const response = await authService.login({
          email: payload.email,
          password: payload.password,
        });

        storeAuth(response.token, response.user);
        setUser(response.user);
        setToken(response.token);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (!getStoredToken()) {
      return;
    }

    setIsLoading(true);
    try {
      const profile = await authService.getProfile();
      const currentToken = getStoredToken();
      if (currentToken) {
        storeAuth(currentToken, profile);
      }
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const listener = () => {
      void handleLogout();
    };

    window.addEventListener('auth:expired', listener);
    return () => {
      window.removeEventListener('auth:expired', listener);
    };
  }, [handleLogout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout: handleLogout,
      refreshProfile,
    }),
    [user, token, isLoading, login, register, handleLogout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
