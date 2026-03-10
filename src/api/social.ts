import { getStoredAccessToken } from "../lib/authStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const baseHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-cache, no-store, max-age=0",
  Pragma: "no-cache",
};

function getHeaders() {
  const token = getStoredAccessToken();
  return {
    ...baseHeaders,
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

export interface InstagramStatsResponse {
  username: string;
  followers_count: number;
  profile_picture_url?: string | null;
  source?: string;
  updated_at?: number;
}

export async function getInstagramStats(): Promise<InstagramStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/social/instagram/stats`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
  });

  return handleResponse<InstagramStatsResponse>(response);
}
