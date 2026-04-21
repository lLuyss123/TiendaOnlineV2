import { useQuery } from "@tanstack/react-query";

import { LoadingState } from "@/components/ui/LoadingState";
import { currency, dateTime } from "@/lib/utils";
import { adminService } from "@/services/admin";

const orderStates = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "PAID",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
  "FAILED"
];

export const AdminOrdersPage = () => {
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => adminService.listOrders()
  });

  if (ordersQuery.isLoading) {
    return <LoadingState label="Cargando órdenes..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Órdenes</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Gestión de estados
        </h1>
      </section>
      <div className="space-y-4">
        {ordersQuery.data?.items.map((order) => (
          <div key={order.id} className="surface grid gap-4 p-6 lg:grid-cols-[1fr_auto_auto]">
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">{order.reference}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {order.user?.nombre} · {order.user?.email}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-300">{dateTime(order.createdAt)}</p>
            </div>
            <div className="text-sm font-semibold text-slate-950 dark:text-white">
              {currency(order.total)}
            </div>
            <select
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
              value={order.estado}
              onChange={(event) =>
                void adminService
                  .updateOrderStatus(order.id, event.target.value)
                  .then(() => ordersQuery.refetch())
              }
            >
              {orderStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
