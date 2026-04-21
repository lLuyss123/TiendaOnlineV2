import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import slugify from "slugify";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { getPagination } from "../utils/pagination";
import { serializeBlogPost, serializeCoupon, serializeProduct } from "../utils/serializers";

const productQuerySchema = z.object({
  q: z.string().optional(),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  talla: z.string().optional(),
  color: z.string().optional(),
  etiqueta: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.enum(["latest", "price-asc", "price-desc", "discount", "stock"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const productIdSchema = z.object({
  id: z.string().min(1)
});

const stockAlertSchema = z.object({
  productId: z.string().min(1)
});

const couponValidationSchema = z.object({
  codigo: z.string().min(3),
  subtotal: z.number().nonnegative()
});

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const buildProductWhere = (query: z.infer<typeof productQuerySchema>): Prisma.ProductWhereInput => {
  const where: Prisma.ProductWhereInput = {
    activo: true
  };

  if (query.q) {
    where.OR = [
      { nombre: { contains: query.q, mode: "insensitive" } },
      { descripcion: { contains: query.q, mode: "insensitive" } }
    ];
  }

  if (query.marca) {
    where.marca = query.marca.toUpperCase() as Prisma.ProductWhereInput["marca"];
  }

  if (query.categoria) {
    where.categoria = query.categoria.toUpperCase() as Prisma.ProductWhereInput["categoria"];
  }

  if (query.talla) {
    where.tallas = {
      has: query.talla
    };
  }

  if (query.color) {
    where.colores = {
      has: query.color
    };
  }

  if (query.minPrice || query.maxPrice) {
    where.precio = {
      gte: query.minPrice ? Number(query.minPrice) : undefined,
      lte: query.maxPrice ? Number(query.maxPrice) : undefined
    };
  }

  if (query.etiqueta) {
    const normalizedTag = slugify(query.etiqueta, { lower: false, strict: true }).replaceAll("-", "_");

    if (normalizedTag === "AGOTADO") {
      where.stock = 0;
    } else if (normalizedTag === "POCAS_UNIDADES") {
      where.stock = { lte: 5, gt: 0 };
    } else if (normalizedTag === "OFERTA") {
      where.precioOferta = { not: null };
    } else {
      where.tags = {
        some: {
          tag: {
            nombre: query.etiqueta.toUpperCase()
          }
        }
      };
    }
  }

  return where;
};

const getProductOrderBy = (
  sort?: string
): Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case "price-asc":
      return { precio: "asc" };
    case "price-desc":
      return { precio: "desc" };
    case "stock":
      return { stock: "asc" };
    case "discount":
      return [{ precioOferta: "desc" }, { precio: "desc" }];
    default:
      return { createdAt: "desc" };
  }
};

const findProductByParam = async (identifier: string) =>
  prisma.product.findFirst({
    where: isUuid(identifier)
      ? {
          OR: [{ id: identifier }, { slug: identifier }],
          activo: true
        }
      : {
          slug: identifier,
          activo: true
        },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } }
    }
  });

export const listProducts = async (request: Request, response: Response) => {
  const query = productQuerySchema.parse(request.query);
  const { page, pageSize, skip, take } = getPagination(query);
  const where = buildProductWhere(query);

  const [items, total, tags] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { orden: "asc" } },
        tags: { include: { tag: true } }
      },
      orderBy: getProductOrderBy(query.sort),
      skip,
      take
    }),
    prisma.product.count({ where }),
    prisma.tag.findMany({ orderBy: { nombre: "asc" } })
  ]);

  response.json({
    items: items.map(serializeProduct),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    },
    filters: {
      tags,
      marcas: ["ALO", "ADIDAS", "NIKE"],
      categorias: ["CALZADO", "ROPA", "ACCESORIOS", "EQUIPAMIENTO"]
    }
  });
};

export const getProduct = async (request: Request, response: Response) => {
  const { id } = productIdSchema.parse(request.params);
  const product = await findProductByParam(id);

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  response.json({
    item: serializeProduct(product)
  });
};

export const getRelatedProducts = async (request: Request, response: Response) => {
  const { id } = productIdSchema.parse(request.params);
  const product = await prisma.product.findFirst({
    where: isUuid(id) ? { OR: [{ id }, { slug: id }] } : { slug: id }
  });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const related = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      activo: true,
      OR: [{ categoria: product.categoria }, { marca: product.marca }]
    },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } }
    },
    take: 4
  });

  response.json({
    items: related.map(serializeProduct)
  });
};

export const createStockAlert = async (request: Request, response: Response) => {
  const { productId } = stockAlertSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const alert = await prisma.stockAlert.upsert({
    where: {
      userId_productId: {
        userId,
        productId
      }
    },
    update: {
      notified: false,
      notifiedAt: null
    },
    create: {
      userId,
      productId
    }
  });

  response.status(201).json({
    message: "Te avisaremos cuando el producto vuelva a estar disponible",
    item: alert
  });
};

export const validateCoupon = async (request: Request, response: Response) => {
  const { codigo, subtotal } = couponValidationSchema.parse(request.body);

  const coupon = await prisma.coupon.findUnique({
    where: { codigo: codigo.toUpperCase() }
  });

  if (!coupon || !coupon.activo) {
    throw new AppError("Cupon no valido", 404);
  }

  if (coupon.vencimiento && coupon.vencimiento < new Date()) {
    throw new AppError("Cupon expirado", 400);
  }

  if (coupon.maxUsos && coupon.usosActuales >= coupon.maxUsos) {
    throw new AppError("Cupon sin usos disponibles", 400);
  }

  const discount =
    coupon.tipo === "PERCENTAGE"
      ? Math.round((subtotal * Number(coupon.valor)) / 100)
      : Math.round(Number(coupon.valor));

  response.json({
    item: serializeCoupon(coupon),
    discount
  });
};

export const listBlogPosts = async (_request: Request, response: Response) => {
  const posts = await prisma.blogPost.findMany({
    where: { publicado: true },
    include: {
      author: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    }
  });

  response.json({
    items: posts.map(serializeBlogPost)
  });
};

export const getBlogPost = async (request: Request, response: Response) => {
  const { id } = productIdSchema.parse(request.params);
  const post = await prisma.blogPost.findFirst({
    where: isUuid(id) ? { OR: [{ id }, { slug: id }], publicado: true } : { slug: id, publicado: true },
    include: {
      author: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    }
  });

  if (!post) {
    throw new AppError("Articulo no encontrado", 404);
  }

  response.json({
    item: serializeBlogPost(post)
  });
};
