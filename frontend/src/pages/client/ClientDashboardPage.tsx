import { useQuery } from "@tanstack/react-query";

import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { currency } from "@/lib/utils";
import { accountService } from "@/services/account";

export const ClientDashboardPage = () => {
  const { user } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => accountService.getMyOrders()
  });
  const wishlistQuery = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => accountService.getWishlist()
  });

  const totalSpent =
    ordersQuery.data?.items
      .filter((order) => ["PAID", "CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.estado))
      .reduce((sum, order) => sum + order.total, 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Dashboard</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Hola, {user?.nombre?.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Aquí ves tu actividad reciente, pedidos y acceso rápido a tus datos.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard
          label="Pedidos"
          value={String(ordersQuery.data?.items.length ?? 0)}
          hint="Historial total en tu cuenta."
        />
        <StatCard
          label="Wishlist"
          value={String(wishlistQuery.data?.items.length ?? 0)}
          hint="Productos guardados para más tarde."
        />
        <StatCard
          label="Total comprado"
          value={currency(totalSpent)}
          hint="Suma de pedidos pagados o despachados."
        />
      </section>

      <section className="surface space-y-5 p-8">
        <h2 className="font-display text-4xl uppercase text-slate-950 dark:text-white">
          Últimos pedidos
        </h2>
        <div className="space-y-3">
          {ordersQuery.data?.items.slice(0, 3).map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 p-4 dark:border-white/10"
            >
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">{order.reference}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">{order.estado}</p>
              </div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {currency(order.total)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
