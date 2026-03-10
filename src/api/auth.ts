import type { GoogleAuthResponse } from "../types/auth";
import { getStoredAccessToken } from "../lib/authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, max-age=0",
  Pragma: "no-cache",
};

function getHeaders(withAuth = false) {
  if (!withAuth) return headers;
  const token = getStoredAccessToken();
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: response.statusText }));
    throw new Error(
      error.detail || `Error ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data: T }).data;
  }

  return data as T;
}

export async function signInWithGoogleCredential(
  credential: string,
): Promise<GoogleAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ credential }),
  });

  return handleResponse<GoogleAuthResponse>(response);
}

export interface UserProfilePayload {
  sub: string;
  email: string;
  name: string;
  picture?: string | null;
  role: "admin" | "editor";
  profile?: {
    phone?: string;
    bio?: string;
    country?: string;
    city_state?: string;
    postal_code?: string;
    tax_id?: string;
    instagram_url?: string;
    facebook_url?: string;
    linkedin_url?: string;
    x_url?: string;
  };
  created_at?: string;
  last_login_at?: string;
}

export interface UserProfileUpdatePayload {
  name?: string;
  phone?: string;
  bio?: string;
  country?: string;
  city_state?: string;
  postal_code?: string;
  tax_id?: string;
  instagram_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  x_url?: string;
}

export async function getMyProfile(): Promise<UserProfilePayload> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "POST",
    headers: getHeaders(true),
    cache: "no-store",
  });
  return handleResponse<UserProfilePayload>(response);
}

export async function updateMyProfile(
  payload: UserProfileUpdatePayload,
): Promise<UserProfilePayload> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/profile/update`, {
    method: "POST",
    headers: getHeaders(true),
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  return handleResponse<UserProfilePayload>(response);
}
