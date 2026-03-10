import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=Descuenta.me&background=0f172a&color=ffffff";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const user = session?.user;
  const displayName = user?.name || "Usuario";
  const email = user?.email || "";
  const picture = user?.picture || DEFAULT_AVATAR;

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    closeDropdown();
    logout();
    navigate("/signin", { replace: true });
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-gray-100 dark:bg-gray-800">
          <img
            src={picture}
            alt={displayName}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{displayName}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-3 py-2">
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-200">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
        </div>

        <div className="my-2 border-t border-gray-200 dark:border-gray-800" />

        <Link
          to="/profile"
          onClick={closeDropdown}
          className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg text-theme-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Perfil
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 px-3 py-2 text-left font-medium text-gray-700 rounded-lg text-theme-sm hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </Dropdown>
    </div>
  );
}
