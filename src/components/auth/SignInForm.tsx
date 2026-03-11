import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import { signInWithGoogleCredential } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleButtonConfig = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_black" | "filled_blue";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  size?: "large" | "medium" | "small";
  width?: number | string;
  logo_alignment?: "left" | "center";
};

type GoogleIdClient = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleIdClient;
      };
    };
  }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SCRIPT_SRC}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar Google Identity Services")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar Google Identity Services"));
    document.head.appendChild(script);
  });
}

export default function SignInForm() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Google no devolvió un token válido.");
        return;
      }

      setLoadingGoogle(true);
      setError(null);
      try {
        const authData = await signInWithGoogleCredential(response.credential);
        login(authData);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo iniciar sesión con Google.",
        );
      } finally {
        setLoadingGoogle(false);
      }
    },
    [login, navigate],
  );

  useEffect(() => {
    if (!googleClientId) {
      setError("Falta VITE_GOOGLE_CLIENT_ID en tu .env del frontend.");
      return;
    }

    let isMounted = true;

    const setupGoogle = async () => {
      try {
        await loadGoogleScript();
        if (!isMounted || !window.google?.accounts?.id || !googleButtonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          use_fedcm_for_prompt: true,
        });

        const renderResponsiveGoogleButton = () => {
          if (!googleButtonRef.current || !window.google?.accounts?.id) return;
          const parentWidth =
            googleButtonRef.current.parentElement?.clientWidth ?? 320;
          const safeWidth = Math.max(180, Math.min(360, Math.floor(parentWidth - 8)));
          googleButtonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "outline",
            text: "signin_with",
            shape: "pill",
            size: "large",
            width: safeWidth,
            logo_alignment: "left",
          });
        };

        renderResponsiveGoogleButton();
        window.addEventListener("resize", renderResponsiveGoogleButton);
        return () => {
          window.removeEventListener("resize", renderResponsiveGoogleButton);
        };
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo inicializar login con Google.",
          );
        }
      }
    };

    let cleanup: (() => void) | undefined;
    void setupGoogle().then((fn) => {
      cleanup = fn;
    });

    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <div className="flex h-full w-full flex-1 flex-col px-4 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-8">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al Home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-3 sm:py-5">
        <div className="mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Iniciar sesión
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accede con tu cuenta Google para administrar productos y contenido.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-white/[0.02]">
          <div className="flex justify-center">
            <div ref={googleButtonRef} className="w-full max-w-[360px]" />
          </div>

          {loadingGoogle && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Validando cuenta...
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
