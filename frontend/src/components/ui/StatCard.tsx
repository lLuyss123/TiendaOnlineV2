export const StatCard = ({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="surface space-y-2 p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="font-display text-4xl uppercase text-slate-950 dark:text-white">{value}</p>
    {hint ? <p className="text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
  </div>
);
