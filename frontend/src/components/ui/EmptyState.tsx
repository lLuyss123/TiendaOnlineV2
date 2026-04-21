export const EmptyState = ({
  title,
  description
}: {
  title: string;
  description: string;
}) => (
  <div className="surface space-y-3 p-8 text-center">
    <h3 className="font-display text-3xl uppercase text-slate-900 dark:text-white">{title}</h3>
    <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
  </div>
);
