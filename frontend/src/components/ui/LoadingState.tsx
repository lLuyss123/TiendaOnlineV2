export const LoadingState = ({ label = "Cargando..." }: { label?: string }) => (
  <div className="surface flex min-h-[220px] items-center justify-center p-10 text-sm text-slate-500 dark:text-slate-300">
    {label}
  </div>
);
