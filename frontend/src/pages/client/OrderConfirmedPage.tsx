import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { currency, dateTime } from "@/lib/utils";
import { accountService } from "@/services/account";

export const OrderConfirmedPage = () => {
  const { id = "" } = useParams();
  const orderQuery = useQuery({
    queryKey: ["order-confirmed", id],
    queryFn: () => accountService.getOrder(id),
    enabled: Boolean(id)
  });

  if (orderQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Cargando estado del pedido..." />
      </div>
    );
  }

  const order = orderQuery.data?.item;

  if (!order) {
    return (
      <div className="page-shell">
        <EmptyState title="Pedido no encontrado" description="Verifica el enlace de confirmación." />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="surface space-y-4 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Pedido</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          {order.reference}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Estado actual: <strong>{order.estado}</strong> · creado el {dateTime(order.createdAt)}
        </p>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="surface space-y-4 p-8">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">
                  {item.product?.nombre ?? "Producto"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {item.cantidad} x {currency(item.precio)}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-950 dark:text-white">
                {currency(item.cantidad * item.precio)}
              </span>
            </div>
          ))}
        </div>
        <div className="surface space-y-3 p-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <strong>{currency(order.subtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Envío</span>
            <strong>{currency(order.envio)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Descuento</span>
            <strong>- {currency(order.descuento)}</strong>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-white/10">
            <span>Total</span>
            <strong>{currency(order.total)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
