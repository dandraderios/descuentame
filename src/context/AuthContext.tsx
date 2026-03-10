import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, GoogleAuthResponse } from "../types/auth";
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from "../lib/authStorage";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  login: (data: GoogleAuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );

  const login = useCallback((data: GoogleAuthResponse) => {
    const nextSession: AuthSession = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      user: data.user,
    };

    setSession(nextSession);
    setStoredAuthSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    clearStoredAuthSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session?.accessToken,
      login,
      logout,
    }),
    [login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
