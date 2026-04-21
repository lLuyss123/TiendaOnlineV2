import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { currency, getPrimaryProductImage } from "@/lib/utils";
import type { Product } from "@/types/api";

export const ProductCard = ({
  product,
  onWishlistAdded
}: {
  product: Product;
  onWishlistAdded?: () => void;
}) => {
  const { isAuthenticated } = useAuth();
  const { isWishlisted, isUpdating, toggleWishlist } = useWishlist();
  const cover = getPrimaryProductImage(product.images);
  const favorite = isWishlisted(product.id);

  return (
    <article className="group surface overflow-hidden">
      <Link to={`/productos/${product.slug}`} className="block">
        <div className="relative">
          {cover ? (
            <img
              src={cover.url}
              alt={cover.alt ?? product.nombre}
              className={`aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
                product.isSoldOut ? "grayscale" : ""
              }`}
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-400 dark:bg-white/5 dark:text-slate-500">
              Sin imagen visible
            </div>
          )}
          {product.isSoldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-950">
                Agotado
              </span>
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-4 p-5">
        {product.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={`${product.id}-${tag.nombre}`} label={tag.nombre} color={tag.color} />
            ))}
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
              {product.marca}
            </p>
            <Link
              to={`/productos/${product.slug}`}
              className="mt-1 block text-lg font-semibold text-slate-950 dark:text-white"
            >
              {product.nombre}
            </Link>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              className={`rounded-full border p-3 transition ${
                favorite
                  ? "border-ember bg-ember/10 text-ember"
                  : "border-slate-200 text-slate-500 hover:border-ember hover:text-ember dark:border-white/10 dark:text-slate-300"
              }`}
              aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-pressed={favorite}
              disabled={isUpdating}
              onClick={() =>
                void toggleWishlist(product).then((added) => {
                  if (added) {
                    onWishlistAdded?.();
                  }
                })
              }
            >
              <Heart size={16} className={favorite ? "fill-current" : ""} />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-slate-950 dark:text-white">
            {currency(product.precioOferta ?? product.precio)}
          </span>
          {product.precioOferta ? (
            <span className="text-sm text-slate-400 line-through">{currency(product.precio)}</span>
          ) : null}
        </div>
        <Link to={`/productos/${product.slug}`}>
          <Button fullWidth variant={product.isSoldOut ? "secondary" : "primary"}>
            {product.isSoldOut ? "Ver detalles" : "Explorar producto"}
          </Button>
        </Link>
      </div>
    </article>
  );
};
