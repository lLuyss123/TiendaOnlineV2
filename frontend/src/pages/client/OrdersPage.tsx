import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { currency, dateTime } from "@/lib/utils";
import { accountService } from "@/services/account";

export const OrdersPage = () => {
  const ordersQuery = useQuery({
    queryKey: ["orders-page"],
    queryFn: () => accountService.getMyOrders()
  });

  if (ordersQuery.isLoading) {
    return <LoadingState label="Cargando pedidos..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Mis pedidos</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Historial
        </h1>
      </section>
      {ordersQuery.data?.items.length ? (
        <div className="space-y-4">
          {ordersQuery.data.items.map((order) => (
            <div key={order.id} className="surface space-y-4 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{order.reference}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    {dateTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
                    {order.estado}
                  </p>
                  <p className="text-sm text-slate-950 dark:text-white">{currency(order.total)}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200 p-4 text-sm dark:border-white/10"
                  >
                    <p className="font-semibold text-slate-950 dark:text-white">
                      {item.product?.nombre ?? "Producto"}
                    </p>
                    <p className="text-slate-500 dark:text-slate-300">
                      {item.cantidad} x {currency(item.precio)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aún no tienes pedidos"
          description="Cuando completes tu primera compra, aparecerá aquí."
        />
      )}
    </div>
  );
};
