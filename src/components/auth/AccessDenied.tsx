export default function AccessDenied() {
  return (
    <div className="rounded-2xl border border-error-200 bg-error-50 p-6 dark:border-error-500/30 dark:bg-error-500/10">
      <h3 className="text-lg font-semibold text-error-700 dark:text-error-400">
        Acceso restringido
      </h3>
      <p className="mt-2 text-sm text-error-700/90 dark:text-error-300">
        Ud no está permitido a ver esta sección.
      </p>
    </div>
  );
}
