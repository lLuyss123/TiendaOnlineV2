export const BotonCargarMas = ({
  hasMore,
  isLoading,
  onClick
}: {
  hasMore: boolean;
  isLoading?: boolean;
  onClick: () => void;
}) =>
  hasMore ? (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-ember hover:text-ember disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:text-slate-200"
    >
      {isLoading ? "Cargando..." : "Cargar mas resenas"}
    </button>
  ) : (
    <p className="text-sm text-slate-500 dark:text-slate-300">
      Has visto todas las resenas de este producto.
    </p>
  );
