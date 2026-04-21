import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { currency, getPrimaryProductImage } from "@/lib/utils";
import { adminService } from "@/services/admin";
import { shopService } from "@/services/shop";

type ProductFiltersState = {
  q: string;
  marca: string;
  categoria: string;
  etiqueta: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const emptyFilters: ProductFiltersState = {
  q: "",
  marca: "",
  categoria: "",
  etiqueta: "",
  minPrice: "",
  maxPrice: "",
  sort: "latest"
};

export const AdminProductsPage = () => {
  const [filters, setFilters] = useState<ProductFiltersState>(emptyFilters);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("success");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(filters.q);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({ pageSize: "100" });

    if (deferredSearch.trim()) {
      params.set("q", deferredSearch.trim());
    }

    if (filters.marca) {
      params.set("marca", filters.marca);
    }

    if (filters.categoria) {
      params.set("categoria", filters.categoria);
    }

    if (filters.etiqueta) {
      params.set("etiqueta", filters.etiqueta);
    }

    if (filters.minPrice) {
      params.set("minPrice", filters.minPrice);
    }

    if (filters.maxPrice) {
      params.set("maxPrice", filters.maxPrice);
    }

    if (filters.sort) {
      params.set("sort", filters.sort);
    }

    return params;
  }, [
    deferredSearch,
    filters.categoria,
    filters.etiqueta,
    filters.marca,
    filters.maxPrice,
    filters.minPrice,
    filters.sort
  ]);

  const productsQuery = useQuery({
    queryKey: ["admin-products", searchParams.toString()],
    queryFn: () => shopService.listProducts(searchParams)
  });

  const activeFilterCount = [
    filters.q.trim(),
    filters.marca,
    filters.categoria,
    filters.etiqueta,
    filters.minPrice,
    filters.maxPrice,
    filters.sort !== "latest" ? filters.sort : ""
  ].filter(Boolean).length;

  const handleDeleteProduct = async (productId: string, productName: string) => {
    setDeletingId(productId);
    setMessage(`Desactivando ${productName}...`);
    setMessageTone("info");

    try {
      await adminService.deleteProduct(productId);
      await productsQuery.refetch();
      setMessage(`${productName} se desactivo correctamente.`);
      setMessageTone("success");
    } catch {
      setMessage(`No pudimos desactivar ${productName}.`);
      setMessageTone("error");
    } finally {
      setDeletingId(null);
    }
  };

  if (productsQuery.isLoading) {
    return <LoadingState label="Cargando productos..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-8">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Productos</p>
          <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
            Catalogo admin
          </h1>
        </div>
        <Link to="/admin/productos/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </section>

      <section className="surface space-y-5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Filtrar productos</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Busca por nombre y acota por marca, categoria, etiqueta o rango de precio.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setFilters(emptyFilters);
              setMessage("Filtros reiniciados.");
              setMessageTone("info");
            }}
          >
            Limpiar filtros
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Buscar producto"
            placeholder="Nombre o descripcion"
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
          />
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Marca</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              value={filters.marca}
              onChange={(event) => setFilters((current) => ({ ...current, marca: event.target.value }))}
            >
              <option value="">Todas</option>
              {productsQuery.data?.filters?.marcas.map((marca) => (
                <option key={marca} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Categoria</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              value={filters.categoria}
              onChange={(event) => setFilters((current) => ({ ...current, categoria: event.target.value }))}
            >
              <option value="">Todas</option>
              {productsQuery.data?.filters?.categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Etiqueta</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              value={filters.etiqueta}
              onChange={(event) => setFilters((current) => ({ ...current, etiqueta: event.target.value }))}
            >
              <option value="">Todas</option>
              <option value="OFERTA">OFERTA</option>
              <option value="POCAS_UNIDADES">POCAS_UNIDADES</option>
              <option value="AGOTADO">AGOTADO</option>
              {productsQuery.data?.filters?.tags.map((tag) => (
                <option key={tag.id ?? tag.nombre} value={tag.nombre}>
                  {tag.nombre}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Precio minimo"
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
          />
          <Input
            label="Precio maximo"
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
          />
          <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <span>Ordenar por</span>
            <select
              className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
            >
              <option value="latest">Mas recientes</option>
              <option value="price-asc">Precio menor a mayor</option>
              <option value="price-desc">Precio mayor a menor</option>
              <option value="discount">Mayor descuento</option>
              <option value="stock">Mayor stock</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-300">
          <p>
            {productsQuery.data?.pagination.total ?? 0} productos encontrados
            {activeFilterCount ? ` con ${activeFilterCount} filtro(s) aplicado(s)` : ""}
          </p>
          {deferredSearch !== filters.q ? <p>Preparando busqueda...</p> : null}
        </div>

        {productsQuery.isRefetching ? (
          <StatusNotice tone="info" loading>
            Cargando productos filtrados...
          </StatusNotice>
        ) : null}

        {message ? <StatusNotice tone={messageTone}>{message}</StatusNotice> : null}
      </section>

      <div className="space-y-4">
        {productsQuery.isError ? (
          <StatusNotice tone="error">No pudimos cargar los productos del catalogo.</StatusNotice>
        ) : productsQuery.data?.items.length ? (
          productsQuery.data.items.map((product) => (
            <div key={product.id} className="surface flex flex-wrap items-center gap-4 p-4">
              {getPrimaryProductImage(product.images, { includeHiddenFallback: true }) ? (
                <img
                  src={getPrimaryProductImage(product.images, { includeHiddenFallback: true })!.url}
                  alt={product.nombre}
                  className="h-28 w-24 rounded-[1.5rem] object-cover"
                />
              ) : (
                <div className="flex h-28 w-24 items-center justify-center rounded-[1.5rem] bg-slate-100 text-xs font-semibold text-slate-400 dark:bg-white/5 dark:text-slate-500">
                  Sin imagen
                </div>
              )}

              <div className="min-w-[220px] flex-1 space-y-1">
                <p className="font-semibold text-slate-950 dark:text-white">{product.nombre}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  {product.marca} · {product.categoria}
                </p>
                {product.tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag.id ?? tag.nombre}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
                      >
                        {tag.nombre}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-300">
                <p>{currency(product.precioOferta ?? product.precio)}</p>
                <p>Stock: {product.stock}</p>
              </div>

              <div className="flex gap-2">
                <Link to={`/admin/productos/editar/${product.id}`}>
                  <Button variant="secondary" disabled={Boolean(deletingId)}>
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  disabled={Boolean(deletingId)}
                  onClick={() => void handleDeleteProduct(product.id, product.nombre)}
                >
                  {deletingId === product.id ? "Desactivando..." : "Desactivar"}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <StatusNotice tone="info">
            No encontramos productos con esos filtros. Ajusta la busqueda para encontrar el producto que quieres editar.
          </StatusNotice>
        )}
      </div>
    </div>
  );
};
