import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { adminService } from "@/services/admin";
import { shopService } from "@/services/shop";

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "0",
  precioOferta: "",
  stock: "0",
  marca: "ALO",
  categoria: "ROPA",
  tallas: "",
  colores: "",
  especificaciones: "",
  activo: true,
  tagIds: [] as string[],
  images: ""
};

const specsToObject = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, line) => {
      const [key, ...rest] = line.split(":");
      if (key) {
        accumulator[key.trim()] = rest.join(":").trim();
      }
      return accumulator;
    }, {});

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const tagsQuery = useQuery({
    queryKey: ["admin-tags-form"],
    queryFn: () => adminService.listTags()
  });
  const productQuery = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => shopService.getProduct(id!),
    enabled: isEditing
  });

  useEffect(() => {
    if (productQuery.data?.item) {
      const product = productQuery.data.item;
      setForm({
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: String(product.precio),
        precioOferta: product.precioOferta ? String(product.precioOferta) : "",
        stock: String(product.stock),
        marca: product.marca,
        categoria: product.categoria,
        tallas: product.tallas.join(", "),
        colores: product.colores.join(", "),
        especificaciones: Object.entries(product.especificaciones)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n"),
        activo: product.activo,
        tagIds: product.tags.filter((tag) => tag.id).map((tag) => tag.id!) as string[],
        images: product.images.map((image) => image.url).join("\n")
      });
    }
  }, [productQuery.data]);

  const orderedImages = useMemo(() => productQuery.data?.item.images ?? [], [productQuery.data?.item.images]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      precioOferta: form.precioOferta ? Number(form.precioOferta) : null,
      stock: Number(form.stock),
      marca: form.marca,
      categoria: form.categoria,
      tallas: form.tallas.split(",").map((item) => item.trim()).filter(Boolean),
      colores: form.colores.split(",").map((item) => item.trim()).filter(Boolean),
      especificaciones: specsToObject(form.especificaciones),
      activo: form.activo,
      tagIds: form.tagIds,
      images: form.images
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((url, index) => ({
          url,
          alt: `${form.nombre} ${index + 1}`,
          esPortada: index === 0
        }))
    };

    const response = isEditing
      ? await adminService.updateProduct(id!, payload)
      : await adminService.createProduct(payload);

    const productId = response.item.id;

    if (files.length > 0) {
      await adminService.uploadProductImages(productId, files);
    }

    setMessage(`Producto ${response.item.nombre} guardado correctamente.`);
    navigate(`/admin/productos/editar/${productId}`);
  };

  const onDropImage = async (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();

    if (!draggingId || !productQuery.data?.item) {
      return;
    }

    const next = [...productQuery.data.item.images];
    const from = next.findIndex((image) => image.id === draggingId);
    const to = next.findIndex((image) => image.id === targetId);

    if (from < 0 || to < 0) return;

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    await adminService.reorderProductImages(
      productQuery.data.item.id,
      next.map((image) => image.id)
    );
    await productQuery.refetch();
  };

  if (isEditing && productQuery.isLoading) {
    return <LoadingState label="Cargando producto..." />;
  }

  return (
    <div className="space-y-6">
      <section className="surface flex flex-wrap items-center justify-between gap-4 p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </p>
          <h1 className="font-display text-6xl uppercase text-slate-950 dark:text-white">
            {isEditing ? "Actualizar SKU" : "Crear SKU"}
          </h1>
        </div>
        <Link to="/admin/productos">
          <Button variant="secondary">Volver</Button>
        </Link>
      </section>
      <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="surface space-y-4 p-8">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
          />
          <Input
            label="Descripción"
            textarea
            value={form.descripcion}
            onChange={(event) =>
              setForm((current) => ({ ...current, descripcion: event.target.value }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Precio"
              type="number"
              value={form.precio}
              onChange={(event) => setForm((current) => ({ ...current, precio: event.target.value }))}
            />
            <Input
              label="Precio oferta"
              type="number"
              value={form.precioOferta}
              onChange={(event) =>
                setForm((current) => ({ ...current, precioOferta: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Stock"
              type="number"
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
            />
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Marca</span>
              <select
                className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                value={form.marca}
                onChange={(event) => setForm((current) => ({ ...current, marca: event.target.value }))}
              >
                <option value="ALO">ALO</option>
                <option value="ADIDAS">ADIDAS</option>
                <option value="NIKE">NIKE</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Categoría</span>
              <select
                className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                value={form.categoria}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoria: event.target.value }))
                }
              >
                <option value="CALZADO">CALZADO</option>
                <option value="ROPA">ROPA</option>
                <option value="ACCESORIOS">ACCESORIOS</option>
                <option value="EQUIPAMIENTO">EQUIPAMIENTO</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Tallas (coma separada)"
              value={form.tallas}
              onChange={(event) => setForm((current) => ({ ...current, tallas: event.target.value }))}
            />
            <Input
              label="Colores (coma separada)"
              value={form.colores}
              onChange={(event) => setForm((current) => ({ ...current, colores: event.target.value }))}
            />
          </div>
          <Input
            label="Especificaciones (una por línea, formato clave: valor)"
            textarea
            value={form.especificaciones}
            onChange={(event) =>
              setForm((current) => ({ ...current, especificaciones: event.target.value }))
            }
          />
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Etiquetas</p>
            <div className="grid gap-3 md:grid-cols-2">
              {tagsQuery.data?.items.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-white/10"
                >
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id!)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tagIds: event.target.checked
                          ? [...current.tagIds, tag.id!]
                          : current.tagIds.filter((item) => item !== tag.id)
                      }))
                    }
                  />
                  {tag.nombre}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface space-y-4 p-8">
            <Input
              label="URLs de imágenes (una por línea)"
              textarea
              value={form.images}
              onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))}
            />
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>Subir imágenes a Cloudinary</span>
              <input
                type="file"
                multiple
                className="w-full rounded-3xl border border-dashed border-slate-200 p-5 dark:border-white/10"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))}
              />
              Producto activo
            </label>
            {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
            <Button type="submit">{isEditing ? "Actualizar producto" : "Crear producto"}</Button>
          </div>

          {productQuery.data?.item ? (
            <div className="surface space-y-4 p-8">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">
                Galería actual
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {orderedImages.map((image) => (
                  <div
                    key={image.id}
                    draggable
                    onDragStart={() => setDraggingId(image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => void onDropImage(event, image.id)}
                    className="space-y-3 rounded-[1.5rem] border border-slate-200 p-4 dark:border-white/10"
                  >
                    <img src={image.url} alt={image.alt ?? ""} className="aspect-[4/3] w-full rounded-[1rem] object-cover" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          void adminService
                            .setProductCover(productQuery.data!.item.id, image.id)
                            .then(() => productQuery.refetch())
                        }
                      >
                        {image.esPortada ? "Portada" : "Marcar portada"}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() =>
                          void adminService
                            .deleteProductImage(productQuery.data!.item.id, image.id)
                            .then(() => productQuery.refetch())
                        }
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </form>
    </div>
  );
};
