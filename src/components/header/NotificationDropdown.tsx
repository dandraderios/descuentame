import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "../../context/AuthContext";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../../api/notifications";

const POLL_VISIBLE_MS = 15000;
const POLL_HIDDEN_MS = 90000;

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

export default function NotificationDropdown() {
  const { session } = useAuth();
  const role = session?.user?.role || "editor";
  const isAdmin = role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string>("");

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items],
  );

  async function loadNotifications() {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const response = await listNotifications({ limit: 10, unread_only: false });
      setItems(response.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;

    let intervalId: number | undefined;

    const schedulePolling = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      const delay =
        document.visibilityState === "visible" ? POLL_VISIBLE_MS : POLL_HIDDEN_MS;
      intervalId = window.setInterval(() => {
        if (!isOpen) {
          void loadNotifications();
        }
      }, delay);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isOpen) {
        void loadNotifications();
      }
      schedulePolling();
    };

    const onWindowFocus = () => {
      if (!isOpen) {
        void loadNotifications();
      }
    };

    if (!isOpen) {
      void loadNotifications();
    }
    schedulePolling();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [isAdmin, isOpen]);

  if (!isAdmin) {
    return null;
  }

  const toggleDropdown = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      await loadNotifications();
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

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
      // Mantener UI estable si falla mark-as-read.
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead(true);
      setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch {
      // Mantener UI estable si falla mark-all-as-read.
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount > 0 ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificaciones
          </h5>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {unreadCount} sin leer
            </span>
            <button
              onClick={closeDropdown}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
              aria-label="Cerrar notificaciones"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-end">
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll || unreadCount === 0}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            {markingAll ? "Marcando..." : "Marcar todas como leídas"}
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="px-4 py-3 text-sm text-gray-500">Cargando...</li>
          ) : null}

          {!loading && error ? (
            <li className="px-4 py-3 text-sm text-red-500">{error}</li>
          ) : null}

          {!loading && !error && items.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">Sin notificaciones</li>
          ) : null}

          {!loading && !error
            ? items.map((notification) => (
                <li key={notification.id}>
                  <DropdownItem
                    onItemClick={closeDropdown}
                    onClick={() => handleMarkAsRead(notification)}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      notification.is_read ? "opacity-70" : ""
                    }`}
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
                      <span className="mb-1 block text-theme-sm text-gray-800 dark:text-white/90">
                        {notification.title || "Notificación"}
                      </span>
                      <span className="mb-1 block text-theme-xs text-gray-600 dark:text-gray-300">
                        {notification.message}
                      </span>
                      <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
                        {notification.product_name ||
                          notification.product_code ||
                          notification.product_id}
                      </span>
                      <span className="mt-1 block text-theme-xs text-gray-400 dark:text-gray-500">
                        {formatRelativeDate(notification.created_at)}
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              ))
            : null}
        </ul>

        <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
          <Link
            to="/notifications"
            onClick={closeDropdown}
            className="block rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
