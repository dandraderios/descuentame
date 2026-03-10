import type { AuthSession } from "../types/auth";

const AUTH_STORAGE_KEY = "descuentame_auth_session";

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredAuthSession(): AuthSession | null {
  if (!isClient()) return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user || !parsed?.expiresAt) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    if (Date.now() >= parsed.expiresAt) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthSession(session: AuthSession): void {
  if (!isClient()) return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  if (!isClient()) return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredAccessToken(): string | null {
  return getStoredAuthSession()?.accessToken || null;
}
