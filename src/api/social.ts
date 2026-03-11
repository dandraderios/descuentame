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

export interface InstagramCarouselRequest {
  product_ids: string[];
  image_text?: string;
  caption_mode?: "manual" | "ai";
  caption_text?: string;
  extra_instruction?: string;
  seconds_per_image?: number;
  fps?: number;
  width?: number;
  height?: number;
  music_url?: string;
  music_volume?: number;
}

export interface InstagramCarouselPreviewResponse {
  caption: string;
  used_ai: boolean;
  prompt?: string;
  valid_products: Array<{
    product_id: string;
    product_name: string;
    media_url: string;
  }>;
  missing_products: string[];
  products_without_media: string[];
}

export interface InstagramCarouselPublishResponse {
  post_id: string;
  creation_id: string;
  caption: string;
  used_ai: boolean;
  prompt?: string;
  items_count: number;
  product_ids: string[];
  media_urls: string[];
  missing_products: string[];
  products_without_media: string[];
}

export interface InstagramVideoPublishResponse extends InstagramCarouselPublishResponse {
  video: {
    video_url: string;
    creation_id: string;
    post_id: string;
  };
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

export async function previewInstagramCarouselCaption(
  payload: InstagramCarouselRequest,
): Promise<InstagramCarouselPreviewResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/social/instagram/carousel/caption-preview`,
    {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<InstagramCarouselPreviewResponse>(response);
}

export async function publishInstagramCarousel(
  payload: InstagramCarouselRequest,
): Promise<InstagramCarouselPublishResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/social/instagram/carousel/publish`,
    {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<InstagramCarouselPublishResponse>(response);
}

export async function publishInstagramVideo(
  payload: InstagramCarouselRequest,
): Promise<InstagramVideoPublishResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/social/instagram/carousel/publish-video`,
    {
      method: "POST",
      headers: getHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    },
  );

  return handleResponse<InstagramVideoPublishResponse>(response);
}
