import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { currency } from "@/lib/utils";
import { adminService } from "@/services/admin";
import { shopService } from "@/services/shop";

export const AdminProductsPage = () => {
  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => shopService.listProducts(new URLSearchParams({ pageSize: "50" }))
  });

  if (productsQuery.isLoading) {
    return <LoadingState label="Cargando productos..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Productos</p>
          <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
            Catálogo admin
          </h1>
        </div>
        <Link to="/admin/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </section>
      <div className="space-y-4">
        {productsQuery.data?.items.map((product) => (
          <div key={product.id} className="surface flex flex-wrap items-center gap-4 p-4">
            <img
              src={product.images[0]?.url}
              alt={product.nombre}
              className="h-28 w-24 rounded-[1.5rem] object-cover"
            />
            <div className="min-w-[220px] flex-1">
              <p className="font-semibold text-slate-950 dark:text-white">{product.nombre}</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                {product.marca} · {product.categoria}
              </p>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <p>{currency(product.precioOferta ?? product.precio)}</p>
              <p>Stock: {product.stock}</p>
            </div>
            <div className="flex gap-2">
              <Link to={`/admin/productos/editar/${product.id}`}>
                <Button variant="secondary">Editar</Button>
              </Link>
              <Button
                variant="danger"
                onClick={() =>
                  void adminService.deleteProduct(product.id).then(() => productsQuery.refetch())
                }
              >
                Desactivar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
