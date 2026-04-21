import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { useParams } from "react-router-dom";

import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { SeccionResenas } from "@/components/reviews/SeccionResenas";
import { EstrellasPuntuacion } from "@/components/reviews/EstrellasPuntuacion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { currency } from "@/lib/utils";
import { accountService } from "@/services/account";
import { shopService } from "@/services/shop";

export const ProductDetailsPage = () => {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [feedback, setFeedback] = useState("");

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => shopService.getProduct(id),
    enabled: Boolean(id)
  });

  const relatedQuery = useQuery({
    queryKey: ["related-products", id],
    queryFn: () => shopService.getRelatedProducts(id),
    enabled: Boolean(id)
  });

  const addToCartMutation = useMutation({
    mutationFn: () =>
      accountService.addToCart({
        productId: productQuery.data!.item.id,
        cantidad: 1,
        talla: selectedSize || undefined,
        color: selectedColor || undefined
      }),
    onSuccess: async () => {
      setFeedback("Producto agregado al carrito.");
      await refreshCart();
    }
  });

  const addToWishlistMutation = useMutation({
    mutationFn: () => accountService.addToWishlist(productQuery.data!.item.id),
    onSuccess: () => {
      setFeedback("Producto agregado a tu wishlist.");
    }
  });

  const stockAlertMutation = useMutation({
    mutationFn: () => shopService.createStockAlert(productQuery.data!.item.id),
    onSuccess: () => {
      setFeedback("Te avisaremos por correo cuando vuelva al stock.");
    }
  });

  if (productQuery.isLoading) {
    return (
      <div className="page-shell">
        <LoadingState label="Cargando detalle del producto..." />
      </div>
    );
  }

  const product = productQuery.data?.item;

  if (!product) {
    return (
      <div className="page-shell">
        <EmptyState title="Producto no encontrado" description="Prueba volver al catalogo." />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <ProductGallery images={product.images} />
        <div className="surface space-y-6 p-8">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">{product.marca}</p>
            <h1 className="font-display text-6xl uppercase leading-none text-slate-950 dark:text-white">
              {product.nombre}
            </h1>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{product.descripcion}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={`${product.id}-${tag.nombre}`} label={tag.nombre} color={tag.color} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-[1.5rem] border border-slate-200 p-4 dark:border-white/10">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                Confianza del cliente
              </p>
              <div className="flex items-center gap-3">
                <EstrellasPuntuacion value={product.promedioCalificacion || 0} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {product.promedioCalificacion.toFixed(1)} · {product.totalResenas} resenas
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-950 dark:text-white">
              {currency(product.precioOferta ?? product.precio)}
            </span>
            {product.precioOferta ? (
              <span className="text-lg text-slate-400 line-through">{currency(product.precio)}</span>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Talla</span>
              <select
                className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
                disabled={product.isSoldOut}
              >
                <option value="">Selecciona talla</option>
                {product.tallas.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Color</span>
              <select
                className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                disabled={product.isSoldOut}
              >
                <option value="">Selecciona color</option>
                {product.colores.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {product.isSoldOut ? (
              <Button fullWidth onClick={() => stockAlertMutation.mutate()} disabled={!user}>
                Avisarme cuando vuelva
              </Button>
            ) : (
              <Button fullWidth onClick={() => addToCartMutation.mutate()} disabled={!user}>
                <ShoppingBag size={16} />
                Agregar al carrito
              </Button>
            )}
            <Button
              fullWidth
              variant="secondary"
              onClick={() => addToWishlistMutation.mutate()}
              disabled={!user}
            >
              <Heart size={16} />
              Guardar en wishlist
            </Button>
          </div>

          {feedback ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{feedback}</p> : null}

          <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 p-5 dark:border-white/10">
            {Object.entries(product.especificaciones).map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-3 border-b border-slate-200 pb-3 last:border-none last:pb-0 dark:border-white/10"
              >
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{key}</span>
                <span className="text-sm text-slate-950 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeccionResenas productId={id} />

      {relatedQuery.data?.items.length ? (
        <section className="space-y-6">
          <h2 className="font-display text-5xl uppercase text-slate-950 dark:text-white">
            Tambien puede gustarte
          </h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {relatedQuery.data.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
