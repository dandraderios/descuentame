import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white z-1 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col lg:flex-row dark:bg-gray-900 sm:p-0">
        <div className="flex h-full w-full flex-col lg:w-1/2">
          <div className="flex items-center justify-center bg-black px-6 py-8 lg:hidden">
            <div className="flex flex-col items-center">
              <Link to="/" className="mb-2 block">
                <img
                  src="/images/logo/descuentame-logo-dark.svg"
                  alt="Descuenta.me"
                  className="h-9 w-auto max-w-[80vw]"
                />
              </Link>
              <p className="text-center text-xs text-gray-400">
                Descuentos y ofertas Chile
              </p>
            </div>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-black dark:bg-black lg:grid">
          <div className="relative flex items-center justify-center z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={300}
                  height={48}
                  src="/images/logo/descuentame-logo-dark.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                Descuentos y ofertas Chile
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
