import { clearStoredAuthSession } from "./authStorage";

const SESSION_EXPIRED_FLAG_KEY = "descuentame_session_expired";

function isClient() {
  return typeof window !== "undefined";
}

export function handleUnauthorizedResponse(response: Response): void {
  if (response.status !== 401 || !isClient()) return;

  clearStoredAuthSession();
  window.sessionStorage.setItem(SESSION_EXPIRED_FLAG_KEY, "1");

  const currentPath = window.location.pathname;
  if (currentPath.startsWith("/signin")) return;

  const nextUrl = `/signin?reason=session-expired&from=${encodeURIComponent(
    window.location.pathname + window.location.search,
  )}`;
  window.location.assign(nextUrl);
}

export function consumeSessionExpiredFlag(): boolean {
  if (!isClient()) return false;
  const hasFlag = window.sessionStorage.getItem(SESSION_EXPIRED_FLAG_KEY) === "1";
  if (hasFlag) {
    window.sessionStorage.removeItem(SESSION_EXPIRED_FLAG_KEY);
  }
  return hasFlag;
}

