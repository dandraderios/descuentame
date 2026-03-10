import { useCallback, useEffect, useMemo, useState } from "react";
import { getInstagramStats } from "../api/social";

export default function SidebarWidget() {
  const fallbackUsername =
    import.meta.env.VITE_INSTAGRAM_USERNAME || "descuentame";
  const followersRaw = Number(import.meta.env.VITE_INSTAGRAM_FOLLOWERS || 0);
  const fallbackFollowers = Number.isFinite(followersRaw)
    ? Math.max(0, followersRaw)
    : 0;

  const [instagramUsername, setInstagramUsername] = useState(fallbackUsername);
  const [followers, setFollowers] = useState(fallbackFollowers);
  const [animatedFollowers, setAnimatedFollowers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);
  const rawIntervalMs = Number(
    import.meta.env.VITE_FOLLOWERS_ANIMATION_INTERVAL_MS || 10000,
  );
  const rawDurationMs = Number(
    import.meta.env.VITE_FOLLOWERS_ANIMATION_DURATION_MS || 1200,
  );
  const animationIntervalMs =
    Number.isFinite(rawIntervalMs) && rawIntervalMs > 0 ? rawIntervalMs : 10000;
  const animationDurationMs =
    Number.isFinite(rawDurationMs) && rawDurationMs > 0 ? rawDurationMs : 1200;

  const loadInstagramStats = useCallback(
    async (isInitialLoad = false) => {
      try {
        const data = await getInstagramStats();
        if (data.username) setInstagramUsername(data.username);
        if (typeof data.followers_count === "number") {
          setFollowers(Math.max(0, data.followers_count));
        }
      } catch {
        // fallback to env values
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadInstagramStats(true);
  }, [loadInstagramStats]);

  useEffect(() => {
    if (followers <= 0) {
      setAnimatedFollowers(0);
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / animationDurationMs, 1);
      setAnimatedFollowers(Math.round(followers * progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [followers, animationCycle, animationDurationMs]);

  useEffect(() => {
    if (animationIntervalMs <= 0) return;
    const intervalId = window.setInterval(() => {
      void loadInstagramStats();
      setAnimationCycle((prev) => prev + 1);
    }, animationIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [animationIntervalMs, loadInstagramStats]);

  const followersLabel = new Intl.NumberFormat("es-CL").format(
    animatedFollowers,
  );
  const instagramUrl = `https://instagram.com/${instagramUsername}`;
  const subtitle = useMemo(() => {
    if (followers > 0) return `${followersLabel} seguidores`;
    if (loading) return "Cargando seguidores...";
    return "No se pudo obtener seguidores en tiempo real.";
  }, [followers, followersLabel, loading]);

  return (
    <div className="mx-auto mb-10 w-full max-w-60 rounded-2xl border border-gray-200 bg-white px-4 py-5 text-center shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className="mb-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-white shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #833ab4 0%, #fd1d1d 55%, #fcb045 100%)",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37a4 4 0 1 1-4.63-4.63 4 4 0 0 1 4.63 4.63z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
        Instagram
      </div>
      <h3 className="mb-2 text-lg font-normal text-gray-900 dark:text-white">
        @{instagramUsername || "descuentame"}
      </h3>
      <p className="mb-4 text-theme-sm text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
      <a
        href={instagramUrl}
        target="_blank"
        rel="nofollow"
        className="flex items-center justify-center rounded-lg bg-brand-500 p-3 text-theme-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
      >
        Ver Instagram
      </a>
    </div>
  );
}
