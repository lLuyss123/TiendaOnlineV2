import { useQuery } from "@tanstack/react-query";

import { LoadingState } from "@/components/ui/LoadingState";
import { StatCard } from "@/components/ui/StatCard";
import { currency, dateTime } from "@/lib/utils";
import { adminService } from "@/services/admin";

export const AdminDashboardPage = () => {
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminService.getStats()
  });

  if (statsQuery.isLoading) {
    return <LoadingState label="Cargando panel..." />;
  }

  const stats = statsQuery.data;

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Admin</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          KPIs en vivo
        </h1>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos" value={String(stats.kpis.products)} />
        <StatCard label="Usuarios" value={String(stats.kpis.users)} />
        <StatCard label="Órdenes" value={String(stats.kpis.orders)} />
        <StatCard label="Revenue" value={currency(stats.kpis.revenue)} />
      </section>
      <section className="surface space-y-4 p-8">
        <h2 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
          Últimas órdenes
        </h2>
        {stats.latestOrders.map((order) => (
          <div
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 p-4 dark:border-white/10"
          >
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{order.reference}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{dateTime(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">{order.estado}</p>
              <p className="text-sm text-slate-950 dark:text-white">{currency(order.total)}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
