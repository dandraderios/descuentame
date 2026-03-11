import { useEffect, useMemo, useState } from "react";
import {
  listNotifications,
  markNotificationAsRead,
  type NotificationItem,
} from "../api/notifications";

const PAGE_SIZE = 20;

function formatRelativeDate(value?: string): string {
  if (!value) return "";

  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items],
  );

  const hasMore = skip + items.length < total;

  async function loadPage(nextSkip: number, append = false) {
    setLoading(true);
    setError("");
    try {
      const response = await listNotifications({
        limit: PAGE_SIZE,
        skip: nextSkip,
        unread_only: false,
      });
      setTotal(response.pagination.total || 0);
      setSkip(nextSkip);
      if (append) {
        setItems((prev) => [...prev, ...(response.notifications || [])]);
      } else {
        setItems(response.notifications || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage(0, false);
  }, []);

  const handleMarkAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;
    try {
      await markNotificationAsRead(notification.id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch {
      // no-op
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {unreadCount} sin leer en esta página
          </p>
        </div>
        <button
          onClick={() => void loadPage(0, false)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
        >
          Actualizar
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {loading && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Cargando...</div>
        ) : null}

        {!loading && error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">Sin notificaciones</div>
        ) : null}

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((notification) => (
            <li
              key={notification.id}
              className={`p-4 ${notification.is_read ? "opacity-70" : ""}`}
            >
              <button
                onClick={() => void handleMarkAsRead(notification)}
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {notification.is_read ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      className="text-emerald-500"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.33337 8.33333L6.33337 11.3333L12.6667 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="relative flex h-3 w-3 rounded-full bg-orange-500">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75 animate-ping"></span>
                    </span>
                  )}
                </span>

                <span className="block min-w-0">
                  <span className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">
                    {notification.title || "Notificación"}
                  </span>
                  <span className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {notification.product_name ||
                      notification.product_code ||
                      notification.product_id}
                  </span>
                  <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                    {formatRelativeDate(notification.created_at)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {hasMore ? (
          <div className="border-t border-gray-100 p-4 text-center dark:border-gray-800">
            <button
              onClick={() => void loadPage(skip + PAGE_SIZE, true)}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {loading ? "Cargando..." : "Ver más"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
