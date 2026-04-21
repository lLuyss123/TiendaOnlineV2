import {
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusNotice } from "@/components/ui/StatusNotice";
import { getPrimaryProductImage } from "@/lib/utils";
import { adminService } from "@/services/admin";
import { shopService } from "@/services/shop";
import type { Product, ProductImage } from "@/types/api";

type DraftSpec = {
  id: string;
  key: string;
  value: string;
};

type QueuedImage = {
  id: string;
  url: string;
  alt: string;
};

type MessageTone = "info" | "success" | "error";

type ProductFormState = {
  nombre: string;
  descripcion: string;
  precio: string;
  precioOferta: string;
  stock: string;
  marca: Product["marca"];
  categoria: Product["categoria"];
  tallas: string[];
  colores: string[];
  especificaciones: DraftSpec[];
  activo: boolean;
  tagIds: string[];
};

const createItemId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyForm: ProductFormState = {
  nombre: "",
  descripcion: "",
  precio: "0",
  precioOferta: "",
  stock: "0",
  marca: "ALO",
  categoria: "ROPA",
  tallas: [],
  colores: [],
  especificaciones: [],
  activo: true,
  tagIds: []
};

const specsToArray = (value: Record<string, string>) =>
  Object.entries(value).map(([key, itemValue]) => ({
    id: createItemId(),
    key,
    value: itemValue
  }));

const specsToObject = (value: DraftSpec[]) =>
  value.reduce<Record<string, string>>((accumulator, item) => {
    const normalizedKey = item.key.trim();
    const normalizedValue = item.value.trim();

    if (normalizedKey && normalizedValue) {
      accumulator[normalizedKey] = normalizedValue;
    }

    return accumulator;
  }, {});

const addUniqueValue = (current: string[], rawValue: string) => {
  const normalized = rawValue.trim();

  if (!normalized) {
    return current;
  }

  const exists = current.some((item) => item.toLowerCase() === normalized.toLowerCase());
  return exists ? current : [...current, normalized];
};

const pillClassName =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200";

const reorderImagePreview = (images: ProductImage[]) => {
  const cover = images.find((image) => image.esPortada);
  return cover ? [cover, ...images.filter((image) => image.id !== cover.id)] : images;
};

export const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("success");
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [specDraft, setSpecDraft] = useState({ key: "", value: "" });
  const [imageDraft, setImageDraft] = useState({ url: "", alt: "" });
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [coverLoadingId, setCoverLoadingId] = useState<string | null>(null);
  const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [isReorderingImages, setIsReorderingImages] = useState(false);

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
    if (!productQuery.data?.item) {
      return;
    }

    const product = productQuery.data.item;
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: String(product.precio),
      precioOferta: product.precioOferta ? String(product.precioOferta) : "",
      stock: String(product.stock),
      marca: product.marca,
      categoria: product.categoria,
      tallas: product.tallas,
      colores: product.colores,
      especificaciones: specsToArray(product.especificaciones),
      activo: product.activo,
      tagIds: product.tags.filter((tag) => tag.id).map((tag) => tag.id!) as string[]
    });
  }, [productQuery.data?.item]);

  const orderedImages = useMemo(
    () => reorderImagePreview(productQuery.data?.item.images ?? []),
    [productQuery.data?.item.images]
  );

  const setFeedback = (nextMessage: string, tone: MessageTone = "success") => {
    setMessage(nextMessage);
    setMessageTone(tone);
  };

  const handleAddSize = () => {
    setForm((current) => ({
      ...current,
      tallas: addUniqueValue(current.tallas, sizeDraft)
    }));
    setSizeDraft("");
  };

  const handleAddColor = () => {
    setForm((current) => ({
      ...current,
      colores: addUniqueValue(current.colores, colorDraft)
    }));
    setColorDraft("");
  };

  const handleAddSpec = () => {
    const normalizedKey = specDraft.key.trim();
    const normalizedValue = specDraft.value.trim();

    if (!normalizedKey || !normalizedValue) {
      return;
    }

    setForm((current) => {
      const nextSpecs = current.especificaciones.filter(
        (item) => item.key.toLowerCase() !== normalizedKey.toLowerCase()
      );

      return {
        ...current,
        especificaciones: [
          ...nextSpecs,
          {
            id: createItemId(),
            key: normalizedKey,
            value: normalizedValue
          }
        ]
      };
    });
    setSpecDraft({ key: "", value: "" });
  };

  const handleFieldEnter = (event: KeyboardEvent<HTMLInputElement>, callback: () => void) => {
    if (event.key === "Enter") {
      event.preventDefault();
      callback();
    }
  };

  const resetImageDraft = () => {
    setImageDraft({ url: "", alt: "" });
  };

  const handleAddImageByUrl = async () => {
    const normalizedUrl = imageDraft.url.trim();

    if (!normalizedUrl) {
      return;
    }

    const altText = imageDraft.alt.trim() || `${form.nombre || "Producto"} imagen`;
    setMessage("");
    setMessageTone("success");

    if (isEditing && id) {
      setIsAddingImage(true);
      setFeedback("Agregando imagen a la biblioteca...", "info");

      try {
        await adminService.addProductImageByUrl(id, {
          url: normalizedUrl,
          alt: altText
        });
        await productQuery.refetch();
        setFeedback("La imagen se agrego directamente a la biblioteca del producto.");
      } catch {
        setFeedback("No pudimos agregar la imagen en este momento.", "error");
      } finally {
        setIsAddingImage(false);
        resetImageDraft();
      }

      return;
    }

    setQueuedImages((current) => [
      ...current,
      {
        id: createItemId(),
        url: normalizedUrl,
        alt: altText
      }
    ]);
    setFeedback("La imagen quedo lista para subirse cuando guardes el producto.");
    resetImageDraft();
  };

  const removeQueuedImage = (imageId: string) => {
    setQueuedImages((current) => current.filter((item) => item.id !== imageId));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback(isEditing ? "Actualizando producto..." : "Creando producto...", "info");

    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: Number(form.precio),
        precioOferta: form.precioOferta ? Number(form.precioOferta) : null,
        stock: Number(form.stock),
        marca: form.marca,
        categoria: form.categoria,
        tallas: form.tallas,
        colores: form.colores,
        especificaciones: specsToObject(form.especificaciones),
        activo: form.activo,
        tagIds: form.tagIds,
        images: queuedImages.map((image, index) => ({
          url: image.url,
          alt: image.alt,
          esPortada: index === 0
        }))
      };

      const response = isEditing
        ? await adminService.updateProduct(id!, payload)
        : await adminService.createProduct(payload);

      setFeedback(`Producto ${response.item.nombre} guardado correctamente.`);
      navigate(`/admin/productos/editar/${response.item.id}`);
    } catch {
      setFeedback("No pudimos guardar el producto. Intentalo de nuevo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const onDropImage = async (event: DragEvent<HTMLDivElement>, targetId: string) => {
    event.preventDefault();

    if (!draggingId || !productQuery.data?.item || isReorderingImages) {
      return;
    }

    const next = [...productQuery.data.item.images];
    const from = next.findIndex((image) => image.id === draggingId);
    const to = next.findIndex((image) => image.id === targetId);

    if (from < 0 || to < 0) {
      return;
    }

    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setIsReorderingImages(true);
    setFeedback("Reordenando biblioteca de imagenes...", "info");

    try {
      await adminService.reorderProductImages(
        productQuery.data.item.id,
        next.map((image) => image.id)
      );
      await productQuery.refetch();
      setFeedback("El orden de la biblioteca se actualizo.");
    } catch {
      setFeedback("No pudimos reordenar las imagenes.", "error");
    } finally {
      setIsReorderingImages(false);
      setDraggingId(null);
    }
  };

  const handleSetProductCover = async (imageId: string) => {
    if (
      !productQuery.data?.item ||
      coverLoadingId ||
      visibilityLoadingId ||
      deleteLoadingId ||
      isReorderingImages
    ) {
      return;
    }

    setCoverLoadingId(imageId);
    setFeedback("Guardando portada...", "info");

    try {
      await adminService.setProductCover(productQuery.data.item.id, imageId);
      await productQuery.refetch();
      setFeedback("La portada del producto se actualizo.");
    } catch {
      setFeedback("No pudimos actualizar la portada.", "error");
    } finally {
      setCoverLoadingId(null);
    }
  };

  const handleToggleImageVisibility = async (image: ProductImage) => {
    if (
      !productQuery.data?.item ||
      coverLoadingId ||
      visibilityLoadingId ||
      deleteLoadingId ||
      isReorderingImages
    ) {
      return;
    }

    const nextVisible = !image.visible;
    setVisibilityLoadingId(image.id);
    setFeedback(nextVisible ? "Mostrando imagen..." : "Ocultando imagen...", "info");

    try {
      await adminService.updateProductImageVisibility(productQuery.data.item.id, image.id, nextVisible);
      await productQuery.refetch();
      setFeedback(nextVisible ? "La imagen ya vuelve a estar visible." : "La imagen se oculto correctamente.");
    } catch {
      setFeedback("No pudimos actualizar la visibilidad de la imagen.", "error");
    } finally {
      setVisibilityLoadingId(null);
    }
  };

  const handleDeleteImage = async (image: ProductImage) => {
    if (
      !productQuery.data?.item ||
      coverLoadingId ||
      visibilityLoadingId ||
      deleteLoadingId ||
      isReorderingImages
    ) {
      return;
    }

    setDeleteLoadingId(image.id);
    setFeedback("Eliminando imagen...", "info");

    try {
      await adminService.deleteProductImage(productQuery.data.item.id, image.id);
      await productQuery.refetch();
      setFeedback("La imagen se elimino de la biblioteca.");
    } catch {
      setFeedback("No pudimos eliminar la imagen.", "error");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const renderImageCard = (image: ProductImage) => {
    const isUpdatingCover = coverLoadingId === image.id;
    const isUpdatingVisibility = visibilityLoadingId === image.id;
    const isDeleting = deleteLoadingId === image.id;
    const isAnyImageActionRunning = Boolean(
      coverLoadingId || visibilityLoadingId || deleteLoadingId || isReorderingImages
    );
    const imageStatus =
      isUpdatingCover
        ? "Guardando portada..."
        : isUpdatingVisibility
          ? image.visible
            ? "Ocultando imagen..."
            : "Mostrando imagen..."
          : isDeleting
            ? "Eliminando imagen..."
            : null;

    return (
      <div
        key={image.id}
        draggable={!isAnyImageActionRunning}
        onDragStart={() => setDraggingId(image.id)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => void onDropImage(event, image.id)}
        className="min-w-0 space-y-4 rounded-[1.75rem] border border-slate-200 p-4 transition hover:border-ember dark:border-white/10"
      >
        <div className="relative overflow-hidden rounded-[1.35rem]">
          <img
            src={image.url}
            alt={image.alt ?? ""}
            className={`aspect-[5/4] w-full object-cover ${image.visible ? "" : "grayscale opacity-70"}`}
          />
          {imageStatus ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 p-4 text-center text-sm font-semibold text-white backdrop-blur-[2px]">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2">
                <Loader2 size={16} className="animate-spin" />
                {imageStatus}
              </span>
            </div>
          ) : null}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {image.esPortada ? (
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                Portada
              </span>
            ) : null}
            {!image.visible ? (
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">Oculta</span>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {image.alt || "Imagen del producto"}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-300">{image.url}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {image.esPortada ? (
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">
              <Star size={16} className="fill-current text-amber-500 dark:text-amber-300" />
              Portada actual
            </span>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={isAnyImageActionRunning}
              className={
                isUpdatingCover
                  ? "border-amber-300 bg-amber-50 text-amber-700 hover:translate-y-0 hover:bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  : undefined
              }
              onClick={() => void handleSetProductCover(image.id)}
            >
              {isUpdatingCover ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Star size={16} />
              )}
              {isUpdatingCover ? "Guardando portada..." : "Fijar como portada"}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={isAnyImageActionRunning}
            onClick={() => void handleToggleImageVisibility(image)}
          >
            {isUpdatingVisibility ? (
              <Loader2 size={16} className="animate-spin" />
            ) : image.visible ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
            {isUpdatingVisibility
              ? image.visible
                ? "Ocultando..."
                : "Mostrando..."
              : image.visible
                ? "Ocultar"
                : "Mostrar"}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isAnyImageActionRunning}
            onClick={() => void handleDeleteImage(image)}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </div>
    );
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

      <form
        onSubmit={onSubmit}
        className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]"
      >
        <section className="min-w-0 space-y-6">
          <div className="surface space-y-4 p-8">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Base del producto</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Define la informacion esencial del SKU antes de pasar a variantes e imagenes.
              </p>
            </div>

            <Input
              label="Nombre"
              value={form.nombre}
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            />
            <Input
              label="Descripcion"
              textarea
              value={form.descripcion}
              onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Precio"
                type="number"
                min="0"
                value={form.precio}
                onChange={(event) => setForm((current) => ({ ...current, precio: event.target.value }))}
              />
              <Input
                label="Precio oferta"
                type="number"
                min="0"
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
                min="0"
                value={form.stock}
                onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              />
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Marca</span>
                <select
                  className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  value={form.marca}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, marca: event.target.value as Product["marca"] }))
                  }
                >
                  <option value="ALO">ALO</option>
                  <option value="ADIDAS">ADIDAS</option>
                  <option value="NIKE">NIKE</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <span>Categoria</span>
                <select
                  className="w-full rounded-full border border-slate-200 bg-white/90 px-4 py-3 dark:border-white/10 dark:bg-white/5"
                  value={form.categoria}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categoria: event.target.value as Product["categoria"]
                    }))
                  }
                >
                  <option value="CALZADO">CALZADO</option>
                  <option value="ROPA">ROPA</option>
                  <option value="ACCESORIOS">ACCESORIOS</option>
                  <option value="EQUIPAMIENTO">EQUIPAMIENTO</option>
                </select>
              </label>
            </div>
          </div>

          <div className="surface space-y-5 p-8">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Agregar imagen por link</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Pega una URL, agrégala y se unirá a la biblioteca del producto. En productos nuevos quedará en cola hasta guardar.
              </p>
            </div>

            <Input
              label="URL de la imagen"
              type="url"
              placeholder="https://..."
              value={imageDraft.url}
              onChange={(event) =>
                setImageDraft((current) => ({
                  ...current,
                  url: event.target.value
                }))
              }
              onKeyDown={(event) => handleFieldEnter(event, () => void handleAddImageByUrl())}
            />
            <Input
              label="Texto alternativo"
              placeholder="Ej: Vista lateral del producto"
              value={imageDraft.alt}
              onChange={(event) =>
                setImageDraft((current) => ({
                  ...current,
                  alt: event.target.value
                }))
              }
              onKeyDown={(event) => handleFieldEnter(event, () => void handleAddImageByUrl())}
            />

            <Button
              type="button"
              variant="secondary"
              disabled={!imageDraft.url.trim() || isAddingImage}
              onClick={() => void handleAddImageByUrl()}
            >
              <Plus size={16} />
              {isAddingImage ? "Agregando..." : isEditing ? "Agregar a la biblioteca" : "Agregar a la cola"}
            </Button>

            {!isEditing && queuedImages.length > 0 ? (
              <div className="space-y-3 rounded-[1.75rem] border border-slate-200 p-5 dark:border-white/10">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">Imagenes listas para el alta</p>
                <div className="grid gap-4">
                  {queuedImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 p-4 dark:border-white/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {index === 0 ? "Portada inicial" : "Imagen en cola"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-300">{image.url}</p>
                      </div>
                      <Button type="button" variant="danger" onClick={() => removeQueuedImage(image.id)}>
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="surface space-y-6 p-8">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Variantes y datos</p>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Ya no necesitas escribir listas con comas. Agrega cada valor de forma separada y quedará visible.
              </p>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-slate-200 p-5 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Tallas</p>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  label="Nueva talla"
                  placeholder="Ej: S, M, 42"
                  value={sizeDraft}
                  onChange={(event) => setSizeDraft(event.target.value)}
                  onKeyDown={(event) => handleFieldEnter(event, handleAddSize)}
                  className="md:flex-1"
                />
                <Button type="button" variant="secondary" className="self-end" onClick={handleAddSize}>
                  <Plus size={16} />
                  Agregar talla
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tallas.length > 0 ? (
                  form.tallas.map((item) => (
                    <span key={item} className={pillClassName}>
                      {item}
                      <button
                        type="button"
                        className="text-slate-400 transition hover:text-red-500"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            tallas: current.tallas.filter((value) => value !== item)
                          }))
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">Aun no has agregado tallas.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-slate-200 p-5 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Colores</p>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  label="Nuevo color"
                  placeholder="Ej: Negro, Blanco, Coral"
                  value={colorDraft}
                  onChange={(event) => setColorDraft(event.target.value)}
                  onKeyDown={(event) => handleFieldEnter(event, handleAddColor)}
                  className="md:flex-1"
                />
                <Button type="button" variant="secondary" className="self-end" onClick={handleAddColor}>
                  <Plus size={16} />
                  Agregar color
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colores.length > 0 ? (
                  form.colores.map((item) => (
                    <span key={item} className={pillClassName}>
                      {item}
                      <button
                        type="button"
                        className="text-slate-400 transition hover:text-red-500"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            colores: current.colores.filter((value) => value !== item)
                          }))
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">Aun no has agregado colores.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-slate-200 p-5 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Especificaciones</p>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  label="Clave"
                  placeholder="Ej: Material"
                  value={specDraft.key}
                  onChange={(event) =>
                    setSpecDraft((current) => ({
                      ...current,
                      key: event.target.value
                    }))
                  }
                  onKeyDown={(event) => handleFieldEnter(event, handleAddSpec)}
                />
                <Input
                  label="Valor"
                  placeholder="Ej: Mesh tecnico"
                  value={specDraft.value}
                  onChange={(event) =>
                    setSpecDraft((current) => ({
                      ...current,
                      value: event.target.value
                    }))
                  }
                  onKeyDown={(event) => handleFieldEnter(event, handleAddSpec)}
                />
                <Button type="button" variant="secondary" className="self-end" onClick={handleAddSpec}>
                  <Plus size={16} />
                  Agregar
                </Button>
              </div>
              <div className="grid gap-3">
                {form.especificaciones.length > 0 ? (
                  form.especificaciones.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 p-4 dark:border-white/10"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.key}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-300">{item.value}</p>
                      </div>
                      <button
                        type="button"
                        className="text-slate-400 transition hover:text-red-500"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            especificaciones: current.especificaciones.filter((spec) => spec.id !== item.id)
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    Aun no has agregado especificaciones.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Etiquetas</p>
              {tagsQuery.isLoading ? (
                <StatusNotice tone="info" loading>
                  Cargando etiquetas disponibles...
                </StatusNotice>
              ) : tagsQuery.isError ? (
                <StatusNotice tone="error">No pudimos cargar las etiquetas en este momento.</StatusNotice>
              ) : tagsQuery.data?.items.length ? (
                <div className="space-y-3">
                  {tagsQuery.isRefetching ? (
                    <StatusNotice tone="info" loading>
                      Actualizando etiquetas...
                    </StatusNotice>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    {tagsQuery.data.items.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm transition hover:border-ember dark:border-white/10"
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
              ) : (
                <StatusNotice tone="info">Todavia no hay etiquetas creadas para seleccionar.</StatusNotice>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))}
              />
              Producto activo
            </label>

            {message ? <StatusNotice tone={messageTone}>{message}</StatusNotice> : null}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Actualizar producto" : "Crear producto"}
            </Button>
          </div>
        </section>

        <section className="surface min-w-0 max-w-full space-y-5 overflow-hidden p-8 xl:sticky xl:top-24 xl:w-full xl:max-w-[34rem] xl:justify-self-end xl:self-start">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-ember">Biblioteca de imagenes</p>
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Aquí ves las imágenes del producto, puedes ocultarlas, eliminarlas o fijar una como portada. La portada siempre será única y se moverá a la primera posición.
            </p>
          </div>

          {isReorderingImages ? (
            <StatusNotice tone="info" loading>
              Reordenando biblioteca de imagenes...
            </StatusNotice>
          ) : null}

          {isEditing ? (
            orderedImages.length > 0 ? (
              <div className="grid gap-4">
                {orderedImages.map((image) => renderImageCard(image))}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                Este producto todavía no tiene imágenes en su biblioteca.
              </div>
            )
          ) : queuedImages.length > 0 ? (
            <div className="grid gap-4">
              {queuedImages.map((image, index) => (
                <div
                  key={image.id}
                  className="min-w-0 space-y-4 rounded-[1.75rem] border border-slate-200 p-4 dark:border-white/10"
                >
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="aspect-[5/4] w-full rounded-[1.35rem] object-cover"
                    />
                  ) : null}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {index === 0 ? "Portada inicial" : image.alt || "Imagen en cola"}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-300">{image.url}</p>
                  </div>
                  <Button type="button" variant="danger" onClick={() => removeQueuedImage(image.id)}>
                    <Trash2 size={16} />
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
              Agrega imágenes por URL y aquí se irán viendo antes de guardar el producto.
            </div>
          )}

          {isEditing && productQuery.data?.item ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                Vista rápida
              </p>
              {getPrimaryProductImage(productQuery.data.item.images, { includeHiddenFallback: true }) ? (
                <img
                  src={getPrimaryProductImage(productQuery.data.item.images, { includeHiddenFallback: true })!.url}
                  alt={productQuery.data.item.nombre}
                  className="mt-3 h-56 w-full rounded-[1.35rem] object-cover"
                />
              ) : null}
            </div>
          ) : null}
        </section>
      </form>
    </div>
  );
};
