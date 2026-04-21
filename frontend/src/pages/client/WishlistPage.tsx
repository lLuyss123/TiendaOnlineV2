import { useMutation } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { getPrimaryProductImage } from "@/lib/utils";
import { accountService } from "@/services/account";

export const WishlistPage = () => {
  const { refreshCart } = useCart();
  const wishlistQuery = useWishlist();

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await accountService.addToCart({ productId, cantidad: 1 });
      await refreshCart();
    }
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistQuery.removeFromWishlist(productId)
  });

  if (wishlistQuery.isLoading) {
    return <LoadingState label="Cargando wishlist..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface space-y-3 p-8">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Wishlist</p>
        <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
          Guardados
        </h1>
      </section>
      {wishlistQuery.data?.items.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {wishlistQuery.data.items.map(({ product }) => (
            <div key={product.id} className="surface flex gap-4 p-4">
              {getPrimaryProductImage(product.images) ? (
                <img
                  src={getPrimaryProductImage(product.images)!.url}
                  alt={product.nombre}
                  className="h-32 w-28 rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="flex h-32 w-28 items-center justify-center rounded-[1.5rem] bg-slate-100 text-xs font-semibold text-slate-400 dark:bg-white/5 dark:text-slate-500">
                  Sin imagen
                </div>
              )}
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-white">{product.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{product.marca}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                    onClick={() => addToCartMutation.mutate(product.id)}
                  >
                    Mover al carrito
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-white/10"
                    onClick={() => removeMutation.mutate(product.id)}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin productos guardados"
          description="Guarda productos desde el catálogo y aparecerán aquí."
        />
      )}
    </div>
  );
};
