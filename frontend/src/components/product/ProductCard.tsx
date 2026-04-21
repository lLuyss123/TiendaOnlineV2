import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { currency } from "@/lib/utils";
import { accountService } from "@/services/account";
import type { Product } from "@/types/api";

export const ProductCard = ({
  product,
  onWishlistAdded
}: {
  product: Product;
  onWishlistAdded?: () => void;
}) => {
  const { isAuthenticated } = useAuth();
  const cover = product.images.find((image) => image.esPortada) ?? product.images[0];

  return (
    <article className="group surface overflow-hidden">
      <Link to={`/productos/${product.slug}`} className="block">
        <div className="relative">
          <img
            src={cover?.url}
            alt={cover?.alt ?? product.nombre}
            className={`aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
              product.isSoldOut ? "grayscale" : ""
            }`}
          />
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
              className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:border-ember hover:text-ember dark:border-white/10 dark:text-slate-300"
              onClick={() =>
                void accountService.addToWishlist(product.id).then(() => {
                  onWishlistAdded?.();
                })
              }
            >
              <Heart size={16} />
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
