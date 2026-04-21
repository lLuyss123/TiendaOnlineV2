import { LOW_STOCK_THRESHOLD, tagPalette } from "../config/constants";
import { serializeReview } from "../services/reviews";

export const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && "toNumber" in (value as Record<string, unknown>)) {
    return Number((value as { toNumber: () => number }).toNumber());
  }
  return Number(value);
};

export const deriveComputedTags = (product: {
  stock: number;
  precioOferta?: unknown;
}) => {
  const computed: Array<{ nombre: string; color: string; icono: string; computed: true }> = [];

  if (product.stock === 0) {
    computed.push({ nombre: "AGOTADO", computed: true, ...tagPalette.AGOTADO });
  } else if (product.stock <= LOW_STOCK_THRESHOLD) {
    computed.push({ nombre: "POCAS_UNIDADES", computed: true, ...tagPalette.POCAS_UNIDADES });
  }

  if (product.precioOferta && toNumber(product.precioOferta)! > 0) {
    computed.push({ nombre: "OFERTA", computed: true, ...tagPalette.OFERTA });
  }

  return computed;
};

const mergeUniqueTags = (tags: Array<{ nombre: string }>) => {
  const seen = new Set<string>();

  return tags.filter((tag) => {
    const normalizedName = tag.nombre.trim().toUpperCase();

    if (seen.has(normalizedName)) {
      return false;
    }

    seen.add(normalizedName);
    return true;
  });
};

export const serializeProduct = (product: any) => {
  const precio = toNumber(product.precio);
  const precioOferta = toNumber(product.precioOferta);
  const discount =
    precio && precioOferta && precioOferta < precio
      ? Math.round(((precio - precioOferta) / precio) * 100)
      : null;

  const persistedTags =
    product.tags?.map((item: any) =>
      item.tag
        ? {
            id: item.tag.id,
            nombre: item.tag.nombre,
            slug: item.tag.slug,
            color: item.tag.color,
            icono: item.tag.icono,
            computed: false
          }
        : item
    ) ?? [];

  return {
    id: product.id,
    slug: product.slug,
    nombre: product.nombre,
    descripcion: product.descripcion,
    precio,
    precioOferta,
    discount,
    stock: product.stock,
    marca: product.marca,
    categoria: product.categoria,
    tallas: product.tallas ?? [],
    colores: product.colores ?? [],
    especificaciones: product.especificaciones ?? {},
    activo: product.activo,
    promedioCalificacion: product.promedioCalificacion ?? 0,
    totalResenas: product.totalResenas ?? 0,
    distribucion1: product.distribucion1 ?? 0,
    distribucion2: product.distribucion2 ?? 0,
    distribucion3: product.distribucion3 ?? 0,
    distribucion4: product.distribucion4 ?? 0,
    distribucion5: product.distribucion5 ?? 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    isSoldOut: product.stock === 0,
    images:
      product.images?.map((image: any) => ({
        id: image.id,
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        esPortada: image.esPortada,
        orden: image.orden
      })) ?? [],
    tags: mergeUniqueTags([...persistedTags, ...deriveComputedTags(product)]),
    reviews:
      product.reviews?.map((review: any) => serializeReview(review)) ?? []
  };
};

export const serializeCoupon = (coupon: any) => ({
  ...coupon,
  valor: toNumber(coupon.valor)
});

export const serializeCartItem = (item: any) => ({
  id: item.id,
  cantidad: item.cantidad,
  talla: item.talla,
  color: item.color,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  product: item.product ? serializeProduct(item.product) : undefined
});

export const serializeOrder = (order: any) => ({
  id: order.id,
  reference: order.reference,
  total: toNumber(order.total),
  subtotal: toNumber(order.subtotal),
  descuento: toNumber(order.descuento),
  envio: toNumber(order.envio),
  estado: order.estado,
  metodoPago: order.metodoPago,
  boldTransactionId: order.boldTransactionId,
  boldStatus: order.boldStatus,
  paymentReference: order.paymentReference,
  direccionEnvio: order.direccionEnvio,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items:
    order.items?.map((item: any) => ({
      id: item.id,
      cantidad: item.cantidad,
      talla: item.talla,
      color: item.color,
      precio: toNumber(item.precio),
      product: item.product ? serializeProduct(item.product) : undefined
    })) ?? []
});

export const serializeBlogPost = (post: any) => ({
  id: post.id,
  slug: post.slug,
  titulo: post.titulo,
  excerpt: post.excerpt,
  contenido: post.contenido,
  imagen: post.imagen,
  relatedProductIds: post.relatedProductIds,
  publicado: post.publicado,
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: post.author
    ? {
        id: post.author.id,
        nombre: post.author.nombre,
        avatar: post.author.avatar
      }
    : undefined
});
