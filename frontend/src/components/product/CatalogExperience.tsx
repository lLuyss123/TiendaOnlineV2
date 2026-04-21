import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grid2x2, Rows3, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { shopService } from "@/services/shop";

type CatalogExperienceProps = {
  title: string;
  description: string;
  preset?: Record<string, string>;
};

export const CatalogExperience = ({ title, description, preset = {} }: CatalogExperienceProps) => {
  const [params, setParams] = useSearchParams();
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const query = params.get("q") ?? preset.q ?? "";
  const deferredQuery = useDeferredValue(query);

  const searchParams = useMemo(() => {
    const next = new URLSearchParams(params);

    Object.entries(preset).forEach(([key, value]) => {
      if (!next.get(key)) {
        next.set(key, value);
      }
    });

    if (deferredQuery) {
      next.set("q", deferredQuery);
    }

    return next;
  }, [deferredQuery, params, preset]);

  const productsQuery = useQuery({
    queryKey: ["products", searchParams.toString()],
    queryFn: () => shopService.listProducts(searchParams)
  });

  return (
    <div className="page-shell space-y-8">
      <section className="surface overflow-hidden p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Catálogo</p>
            <h1 className="font-display text-6xl uppercase leading-none text-slate-950 dark:text-white">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Buscar"
              value={query}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                next.set("q", event.target.value);
                setParams(next);
              }}
              placeholder="Busca por nombre o descripción"
            />
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Ordenar</span>
              <select
                className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
                value={params.get("sort") ?? "latest"}
                onChange={(event) => {
                  const next = new URLSearchParams(params);
                  next.set("sort", event.target.value);
                  setParams(next);
                }}
              >
                <option value="latest">Más recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="discount">Mejor oferta</option>
                <option value="stock">Pocas unidades</option>
              </select>
            </label>
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="surface h-fit space-y-4 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-ember">Filtros</p>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Marca</span>
            <select
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
              value={params.get("marca") ?? preset.marca ?? ""}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set("marca", event.target.value);
                else next.delete("marca");
                setParams(next);
              }}
            >
              <option value="">Todas</option>
              <option value="ALO">ALO</option>
              <option value="ADIDAS">Adidas</option>
              <option value="NIKE">Nike</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Categoría</span>
            <select
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
              value={params.get("categoria") ?? preset.categoria ?? ""}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set("categoria", event.target.value);
                else next.delete("categoria");
                setParams(next);
              }}
            >
              <option value="">Todas</option>
              <option value="CALZADO">Calzado</option>
              <option value="ROPA">Ropa</option>
              <option value="ACCESORIOS">Accesorios</option>
              <option value="EQUIPAMIENTO">Equipamiento</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Etiqueta</span>
            <select
              className="rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/5"
              value={params.get("etiqueta") ?? preset.etiqueta ?? ""}
              onChange={(event) => {
                const next = new URLSearchParams(params);
                if (event.target.value) next.set("etiqueta", event.target.value);
                else next.delete("etiqueta");
                setParams(next);
              }}
            >
              <option value="">Todas</option>
              <option value="NUEVO">Nuevo</option>
              <option value="OFERTA">Oferta</option>
              <option value="EXCLUSIVO">Exclusivo</option>
              <option value="TEMPORADA">Temporada</option>
              <option value="MAS_VENDIDO">Más vendido</option>
              <option value="AGOTADO">Agotado</option>
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setParams(new URLSearchParams(Object.entries(preset)));
            }}
            fullWidth
          >
            Limpiar filtros
          </Button>
        </aside>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
              <Search size={16} />
              {productsQuery.data?.pagination.total ?? 0} resultados
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                className={`rounded-full p-3 ${layout === "grid" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "surface"}`}
              >
                <Grid2x2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                className={`rounded-full p-3 ${layout === "list" ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "surface"}`}
              >
                <Rows3 size={16} />
              </button>
            </div>
          </div>
          {productsQuery.isLoading ? <LoadingState label="Cargando catálogo..." /> : null}
          {productsQuery.data && productsQuery.data.items.length === 0 ? (
            <EmptyState
              title="No encontramos productos"
              description="Prueba ajustar filtros o buscar otra combinación."
            />
          ) : null}
          {productsQuery.data?.items.length ? (
            <div className={layout === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-5"}>
              {productsQuery.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
};
