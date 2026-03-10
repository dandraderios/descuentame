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

export interface InstagramPublishRequest {
  product_id: string;
  placement: "story" | "feed";
  image_text?: string;
  feed_caption_mode?: "manual" | "ai";
  feed_caption_text?: string;
}

export interface InstagramPublishResponse {
  placement: "story" | "feed";
  product_id: string;
  creation_id: string;
  post_id: string;
  media_url: string;
  caption?: string | null;
  used_ai?: boolean;
}

export interface InstagramCaptionPreviewResponse {
  placement: "story" | "feed";
  product_id: string;
  caption: string;
  used_ai: boolean;
  prompt?: string;
}

export async function getInstagramStats(): Promise<InstagramStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/social/instagram/stats`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
  });

  return handleResponse<InstagramStatsResponse>(response);
}

export async function publishInstagramPost(
  payload: InstagramPublishRequest,
): Promise<InstagramPublishResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/social/instagram/publish`,
    {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<InstagramPublishResponse>(response);
}

export async function previewInstagramCaption(
  payload: InstagramPublishRequest,
): Promise<InstagramCaptionPreviewResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/social/instagram/caption-preview`,
    {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<InstagramCaptionPreviewResponse>(response);
}
