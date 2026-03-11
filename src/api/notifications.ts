import { getStoredAccessToken } from "../lib/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  product_id?: string;
  product_code?: string;
  product_hash_id?: string;
  product_name?: string;
  store?: string;
  price_status?: string;
  is_read: boolean;
  created_at?: string;
  archived_at?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsListResponse {
  notifications: NotificationItem[];
  pagination: {
    limit: number;
    skip: number;
    total: number;
  };
}

export async function listNotifications(payload?: {
  limit?: number;
  skip?: number;
  unread_only?: boolean;
}): Promise<NotificationsListResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/list`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      limit: payload?.limit ?? 20,
      skip: payload?.skip ?? 0,
      unread_only: payload?.unread_only ?? false,
    }),
  });

  return handleResponse<NotificationsListResponse>(response);
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ notification_id: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/read`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
    body: JSON.stringify({ notification_id: notificationId }),
  });

  return handleResponse<{ notification_id: string }>(response);
}

export async function getUnreadNotificationsCount(): Promise<{
  unread_count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
    method: "POST",
    headers: getHeaders(),
    cache: "no-store",
  });

  return handleResponse<{ unread_count: number }>(response);
}
