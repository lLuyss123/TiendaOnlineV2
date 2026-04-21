import { useQuery } from "@tanstack/react-query";

import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCart } from "@/hooks/useCart";
import { currency } from "@/lib/utils";
import { accountService } from "@/services/account";

export const CartPage = () => {
  const { refreshCart } = useCart();
  const cartQuery = useQuery({
    queryKey: ["cart-page"],
    queryFn: () => accountService.getCart()
  });

  if (cartQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Cargando carrito..." />
      </div>
    );
  }

  const items = cartQuery.data?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.precioOferta ?? item.product.precio) * item.cantidad,
    0
  );

  return (
    <div className="page-shell grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="surface space-y-3 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Carrito</p>
          <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
            Tu selección
          </h1>
        </div>
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="surface flex gap-4 p-4">
              <img
                src={item.product.images[0]?.url}
                alt={item.product.nombre}
                className="h-36 w-28 rounded-[1.5rem] object-cover"
              />
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{item.product.nombre}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">
                      {item.talla ?? "Sin talla"} · {item.color ?? "Sin color"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-500"
                    onClick={() =>
                      void accountService.deleteCartItem(item.id).then(async () => {
                        await cartQuery.refetch();
                        await refreshCart();
                      })
                    }
                  >
                    Quitar
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="text-sm text-slate-600 dark:text-slate-300">
                    Cantidad
                    <select
                      className="ml-3 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                      value={item.cantidad}
                      onChange={(event) =>
                        void accountService
                          .updateCartItem(item.id, {
                            cantidad: Number(event.target.value),
                            talla: item.talla ?? undefined,
                            color: item.color ?? undefined
                          })
                          .then(async () => {
                            await cartQuery.refetch();
                            await refreshCart();
                          })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {currency((item.product.precioOferta ?? item.product.precio) * item.cantidad)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="Tu carrito está vacío"
            description="Agrega productos desde el catálogo para empezar tu compra."
          />
        )}
      </section>

      <CartSummary subtotal={subtotal} shipping={18000} />
    </div>
  );
};
