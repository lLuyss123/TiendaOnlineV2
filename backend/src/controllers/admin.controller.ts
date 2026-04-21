import { OrderStatus, Permission, Prisma, Role } from "@prisma/client";
import type { Request, Response } from "express";
import slugify from "slugify";
import { z } from "zod";

import { editablePermissions } from "../config/constants";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { deleteProductImage, uploadProductImage } from "../services/cloudinary";
import { sendStockAlertEmail } from "../services/email";
import { enqueueReviewReminderJobsForOrder } from "../services/reviews";
import { createShortId } from "../utils/id";
import { getPagination } from "../utils/pagination";
import { serializeBlogPost, serializeCoupon, serializeOrder, serializeProduct } from "../utils/serializers";

const tagSchema = z.object({
  nombre: z.string().min(2),
  color: z.string().min(4),
  icono: z.string().min(2)
});

const couponSchema = z.object({
  codigo: z.string().min(3),
  tipo: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  valor: z.number().positive(),
  maxUsos: z.number().int().positive().optional(),
  vencimiento: z.string().datetime().optional(),
  activo: z.boolean().default(true),
  descripcion: z.string().optional()
});

const blogSchema = z.object({
  titulo: z.string().min(3),
  excerpt: z.string().min(10),
  contenido: z.string().min(30),
  imagen: z.string().url(),
  relatedProductIds: z.array(z.string().uuid()).default([]),
  publicado: z.boolean().default(false)
});

const productSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(20),
  precio: z.number().positive(),
  precioOferta: z.number().positive().optional().nullable(),
  stock: z.number().int().nonnegative(),
  marca: z.enum(["ALO", "ADIDAS", "NIKE"]),
  categoria: z.enum(["CALZADO", "ROPA", "ACCESORIOS", "EQUIPAMIENTO"]),
  tallas: z.array(z.string()).default([]),
  colores: z.array(z.string()).default([]),
  especificaciones: z.record(z.string(), z.any()).default({}),
  activo: z.boolean().default(true),
  tagIds: z.array(z.string().uuid()).default([]),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        esPortada: z.boolean().default(false)
      })
    )
    .default([])
});

const adminProductQuerySchema = z.object({
  q: z.string().optional(),
  marca: z.string().optional(),
  categoria: z.string().optional(),
  talla: z.string().optional(),
  color: z.string().optional(),
  etiqueta: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sort: z.enum(["latest", "price-asc", "price-desc", "discount", "stock"]).optional(),
  estado: z.enum(["todos", "activos", "inactivos"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
});

const roleSchema = z.object({
  rol: z.nativeEnum(Role)
});

const permissionsSchema = z.object({
  permisos: z.array(z.nativeEnum(Permission))
});

const deactivationSchema = z.object({
  activo: z.boolean()
});

const statusSchema = z.object({
  estado: z.string().min(3)
});

const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1)
});

const productImageUrlSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().min(1).optional()
});

const imageVisibilitySchema = z.object({
  visible: z.boolean()
});

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const buildAdminProductWhere = (
  query: z.infer<typeof adminProductQuerySchema>
): Prisma.ProductWhereInput => {
  const where: Prisma.ProductWhereInput = {};

  if (query.estado === "activos") {
    where.activo = true;
  }

  if (query.estado === "inactivos") {
    where.activo = false;
  }

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

const getAdminProductOrderBy = (
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

type ProductImageState = {
  id: string;
  visible: boolean;
};

const buildProductImageState = (images: ProductImageState[], coverImageId: string | null) => {
  const coverImage = coverImageId ? images.find((image) => image.id === coverImageId) : null;
  const orderedImages = coverImage
    ? [coverImage, ...images.filter((image) => image.id !== coverImageId)]
    : [...images];

  return orderedImages.map((image, index) => ({
    id: image.id,
    visible: image.visible,
    esPortada: coverImageId ? image.id === coverImageId : false,
    orden: index
  }));
};

const persistProductImageState = async (
  transaction: Prisma.TransactionClient,
  images: ReturnType<typeof buildProductImageState>
) => {
  await Promise.all(
    images.map((image) =>
      transaction.productImage.update({
        where: { id: image.id },
        data: {
          visible: image.visible,
          esPortada: image.esPortada,
          orden: image.orden
        }
      })
    )
  );
};

const maybeNotifyRestock = async (productId: string, previousStock: number, newStock: number) => {
  if (previousStock > 0 || newStock <= 0) {
    return;
  }

  const [product, alerts] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId }
    }),
    prisma.stockAlert.findMany({
      where: {
        productId,
        notified: false
      },
      include: {
        user: true
      }
    })
  ]);

  if (!product) return;

  await Promise.all(
    alerts.map(async (alert) => {
      await sendStockAlertEmail({
        email: alert.user.email,
        nombre: alert.user.nombre,
        productName: product.nombre,
        productSlug: product.slug
      });
    })
  );

  await prisma.stockAlert.updateMany({
    where: {
      productId,
      notified: false
    },
    data: {
      notified: true,
      notifiedAt: new Date()
    }
  });
};

export const getAdminStats = async (_request: Request, response: Response) => {
  const [productCount, userCount, orderCount, recentOrders, paidOrders] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { orden: "asc" } },
                tags: { include: { tag: true } },
                reviews: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.order.findMany({
      where: {
        estado: {
          in: [OrderStatus.PAID, OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        }
      },
      select: { total: true }
    })
  ]);

  const revenue = paidOrders.reduce((accumulator, order) => accumulator + Number(order.total), 0);

  response.json({
    kpis: {
      products: productCount,
      users: userCount,
      orders: orderCount,
      revenue
    },
    latestOrders: recentOrders.map(serializeOrder)
  });
};

export const listAdminProducts = async (request: Request, response: Response) => {
  const query = adminProductQuerySchema.parse(request.query);
  const { page, pageSize, skip, take } = getPagination(query);
  const where = buildAdminProductWhere(query);

  const [items, total, tags] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { orden: "asc" } },
        tags: { include: { tag: true } },
        reviews: true
      },
      orderBy: getAdminProductOrderBy(query.sort),
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

export const getAdminProduct = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

  const product = await prisma.product.findFirst({
    where: isUuid(id) ? { OR: [{ id }, { slug: id }] } : { slug: id },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } },
      reviews: true
    }
  });

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  response.json({
    item: serializeProduct(product)
  });
};

export const createProduct = async (request: Request, response: Response) => {
  const payload = productSchema.parse(request.body);
  const slug = slugify(payload.nombre, { lower: true, strict: true });

  const product = await prisma.product.create({
    data: {
      slug: slug || `producto-${createShortId(6).toLowerCase()}`,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      precio: payload.precio,
      precioOferta: payload.precioOferta,
      stock: payload.stock,
      marca: payload.marca,
      categoria: payload.categoria,
      tallas: payload.tallas,
      colores: payload.colores,
      especificaciones: payload.especificaciones as Prisma.InputJsonValue,
      activo: payload.activo,
      tags: {
        create: payload.tagIds.map((tagId) => ({
          tagId
        }))
      },
      images: {
        create: payload.images.map((image, index) => ({
          url: image.url,
          alt: image.alt,
          visible: true,
          esPortada: image.esPortada || index === 0,
          orden: index
        }))
      }
    },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } },
      reviews: true
    }
  });

  response.status(201).json({
    item: serializeProduct(product)
  });
};

export const updateProduct = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = productSchema.parse(request.body);

  const existingProduct = await prisma.product.findUnique({
    where: { id }
  });

  if (!existingProduct) {
    throw new AppError("Producto no encontrado", 404);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    await transaction.productTag.deleteMany({ where: { productId: id } });

    return transaction.product.update({
      where: { id },
      data: {
        slug: slugify(payload.nombre, { lower: true, strict: true }) || existingProduct.slug,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        precio: payload.precio,
        precioOferta: payload.precioOferta,
        stock: payload.stock,
        marca: payload.marca,
        categoria: payload.categoria,
        tallas: payload.tallas,
        colores: payload.colores,
        especificaciones: payload.especificaciones as Prisma.InputJsonValue,
        activo: payload.activo,
        tags: {
          create: payload.tagIds.map((tagId) => ({ tagId }))
        }
      },
      include: {
        images: { orderBy: { orden: "asc" } },
        tags: { include: { tag: true } },
        reviews: true
      }
    });
  });

  await maybeNotifyRestock(id, existingProduct.stock, payload.stock);

  response.json({
    item: serializeProduct(updated)
  });
};

export const deleteProduct = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  const product = await prisma.product.update({
    where: { id },
    data: {
      activo: false
    },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } },
      reviews: true
    }
  });

  response.json({
    message: "Producto desactivado",
    item: serializeProduct(product)
  });
};

export const updateProductActive = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const { activo } = deactivationSchema.parse(request.body);

  const product = await prisma.product.update({
    where: { id },
    data: {
      activo
    },
    include: {
      images: { orderBy: { orden: "asc" } },
      tags: { include: { tag: true } },
      reviews: true
    }
  });

  response.json({
    message: activo ? "Producto activado" : "Producto desactivado",
    item: serializeProduct(product)
  });
};

export const uploadImagesForProduct = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const files = request.files as Express.Multer.File[] | undefined;

  if (!files?.length) {
    throw new AppError("Debes enviar al menos una imagen", 400);
  }

  const existingImages = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const result = await uploadProductImage(file.buffer, `${id}-${Date.now()}-${index}`);
      return prisma.productImage.create({
        data: {
          productId: id,
          url: result.url,
          publicId: result.publicId,
          alt: file.originalname,
          visible: true,
          esPortada: existingImages.length === 0 && index === 0,
          orden: existingImages.length + index
        }
      });
    })
  );

  response.status(201).json({
    items: uploaded
  });
};

export const deleteImageForProduct = async (request: Request, response: Response) => {
  const { imgId } = z.object({ imgId: z.string().uuid() }).parse(request.params);

  const image = await prisma.productImage.findUnique({
    where: { id: imgId }
  });

  if (!image) {
    throw new AppError("Imagen no encontrada", 404);
  }

  await deleteProductImage(image.publicId);
  await prisma.productImage.delete({
    where: { id: imgId }
  });

  const remaining = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: { orden: "asc" }
  });

  const currentVisibleCover = remaining.find((item) => item.esPortada && item.visible)?.id ?? null;
  const nextCoverImageId = currentVisibleCover ?? remaining.find((item) => item.visible)?.id ?? null;

  if (remaining.length > 0) {
    await prisma.$transaction(async (transaction) => {
      await persistProductImageState(
        transaction,
        buildProductImageState(
          remaining.map((item) => ({
            id: item.id,
            visible: item.visible
          })),
          nextCoverImageId
        )
      );
    });
  }

  response.status(204).send();
};

export const addImageUrlForProduct = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = productImageUrlSchema.parse(request.body);

  const existingImages = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  const created = await prisma.productImage.create({
    data: {
      productId: id,
      url: payload.url,
      alt: payload.alt,
      visible: true,
      esPortada: false,
      orden: existingImages.length
    }
  });

  const currentCoverId = existingImages.find((image) => image.esPortada && image.visible)?.id ?? created.id;
  const nextState = buildProductImageState(
    [
      ...existingImages.map((image) => ({
        id: image.id,
        visible: image.visible
      })),
      {
        id: created.id,
        visible: true
      }
    ],
    currentCoverId
  );

  await prisma.$transaction(async (transaction) => {
    await persistProductImageState(transaction, nextState);
  });

  const refreshed = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  response.status(201).json({
    items: refreshed
  });
};

export const setCoverImageForProduct = async (request: Request, response: Response) => {
  const { id, imgId } = z.object({ id: z.string().uuid(), imgId: z.string().uuid() }).parse(request.params);

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  if (!images.some((image) => image.id === imgId)) {
    throw new AppError("Imagen no encontrada", 404);
  }

  const nextState = buildProductImageState(
    images.map((image) => ({
      id: image.id,
      visible: image.id === imgId ? true : image.visible
    })),
    imgId
  );

  await prisma.$transaction(async (transaction) => {
    await persistProductImageState(transaction, nextState);
  });

  response.json({
    message: "Portada actualizada"
  });
};

export const updateImageVisibilityForProduct = async (request: Request, response: Response) => {
  const { id, imgId } = z.object({ id: z.string().uuid(), imgId: z.string().uuid() }).parse(request.params);
  const payload = imageVisibilitySchema.parse(request.body);

  const images = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  const targetImage = images.find((image) => image.id === imgId);

  if (!targetImage) {
    throw new AppError("Imagen no encontrada", 404);
  }

  const nextImages = images.map((image) => ({
    id: image.id,
    visible: image.id === imgId ? payload.visible : image.visible,
    esPortada: image.esPortada
  }));

  let nextCoverImageId = nextImages.find((image) => image.esPortada && image.visible)?.id ?? null;

  if (!payload.visible && targetImage.esPortada) {
    nextCoverImageId = nextImages.find((image) => image.id !== imgId && image.visible)?.id ?? null;
  }

  if (payload.visible && !nextCoverImageId) {
    nextCoverImageId = imgId;
  }

  const nextState = buildProductImageState(
    nextImages.map((image) => ({
      id: image.id,
      visible: image.visible
    })),
    nextCoverImageId
  );

  await prisma.$transaction(async (transaction) => {
    await persistProductImageState(transaction, nextState);
  });

  const refreshed = await prisma.productImage.findMany({
    where: { productId: id },
    orderBy: { orden: "asc" }
  });

  response.json({
    items: refreshed
  });
};

export const reorderProductImages = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = reorderImagesSchema.parse(request.body);

  await prisma.$transaction(
    payload.imageIds.map((imageId, index) =>
      prisma.productImage.updateMany({
        where: {
          id: imageId,
          productId: id
        },
        data: { orden: index }
      })
    )
  );

  response.json({
    message: "Imágenes reordenadas"
  });
};

export const listAdminOrders = async (_request: Request, response: Response) => {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { orden: "asc" } },
              tags: { include: { tag: true } },
              reviews: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: orders.map((order) => ({
      ...serializeOrder(order),
      user: order.user
    }))
  });
};

export const updateAdminOrderStatus = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = statusSchema.parse(request.body);
  const existingOrder = await prisma.order.findUnique({
    where: { id }
  });

  if (!existingOrder) {
    throw new AppError("Orden no encontrada", 404);
  }

  const order = await prisma.order.update({
    where: { id },
    data: { estado: payload.estado as any },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { orden: "asc" } },
              tags: { include: { tag: true } },
              reviews: true
            }
          }
        }
      }
    }
  });

  if (existingOrder.estado !== OrderStatus.DELIVERED && order.estado === OrderStatus.DELIVERED) {
    await enqueueReviewReminderJobsForOrder(order.id);
  }

  response.json({
    item: serializeOrder(order)
  });
};

export const listUsers = async (_request: Request, response: Response) => {
  const users = await prisma.user.findMany({
    include: {
      subAdminPermissions: true
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      permisos: user.subAdminPermissions.filter((item) => item.active).map((item) => item.permission),
      createdAt: user.createdAt
    }))
  });
};

export const updateUserRole = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = roleSchema.parse(request.body);

  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (payload.rol === Role.SUPER_ADMIN && existingUser.rol !== Role.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { rol: Role.SUPER_ADMIN }
    });

    if (superAdminCount >= 1) {
      throw new AppError("Solo puede existir un SUPER_ADMIN en el sistema", 400);
    }
  }

  if (existingUser.rol === Role.SUPER_ADMIN && payload.rol !== Role.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { rol: Role.SUPER_ADMIN }
    });

    if (superAdminCount <= 1) {
      throw new AppError("Debe existir al menos un SUPER_ADMIN en el sistema", 400);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      rol: payload.rol
    }
  });

  if (payload.rol !== Role.SUB_ADMIN) {
    await prisma.subAdminPermission.deleteMany({
      where: { userId: user.id }
    });
  }

  response.json({
    item: user
  });
};

export const updateUserPermissions = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = permissionsSchema.parse(request.body);
  const uniquePermissions = Array.from(new Set(payload.permisos)).filter((permission) =>
    editablePermissions.includes(permission)
  );

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user || user.rol !== Role.SUB_ADMIN) {
    throw new AppError("Solo usuarios SUB_ADMIN pueden recibir permisos granulares", 400);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.subAdminPermission.deleteMany({
      where: { userId: id }
    });

    if (uniquePermissions.length > 0) {
      await transaction.subAdminPermission.createMany({
        data: uniquePermissions.map((permission) => ({
          userId: id,
          permission,
          active: true
        }))
      });
    }
  });

  response.json({
    message: "Permisos actualizados"
  });
};

export const deactivateUser = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = deactivationSchema.parse(request.body);

  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (existingUser.rol === Role.SUPER_ADMIN && !payload.activo) {
    const activeSuperAdminCount = await prisma.user.count({
      where: {
        rol: Role.SUPER_ADMIN,
        activo: true
      }
    });

    if (activeSuperAdminCount <= 1) {
      throw new AppError("El SUPER_ADMIN principal no se puede desactivar", 400);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      activo: payload.activo
    }
  });

  response.json({
    item: user
  });
};

export const listSubAdmins = async (_request: Request, response: Response) => {
  const users = await prisma.user.findMany({
    where: {
      rol: Role.SUB_ADMIN,
      activo: true
    },
    include: {
      subAdminPermissions: true
    }
  });

  response.json({
    items: users.map((user) => ({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      permisos: user.subAdminPermissions.filter((item) => item.active).map((item) => item.permission)
    }))
  });
};

export const listTags = async (_request: Request, response: Response) => {
  const tags = await prisma.tag.findMany({
    orderBy: { nombre: "asc" }
  });

  response.json({
    items: tags
  });
};

export const createTag = async (request: Request, response: Response) => {
  const payload = tagSchema.parse(request.body);

  const tag = await prisma.tag.create({
    data: {
      nombre: payload.nombre.toUpperCase(),
      slug: slugify(payload.nombre, { lower: true, strict: true }),
      color: payload.color,
      icono: payload.icono
    }
  });

  response.status(201).json({
    item: tag
  });
};

export const updateTag = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = tagSchema.parse(request.body);

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      nombre: payload.nombre.toUpperCase(),
      slug: slugify(payload.nombre, { lower: true, strict: true }),
      color: payload.color,
      icono: payload.icono
    }
  });

  response.json({
    item: tag
  });
};

export const deleteTag = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  await prisma.tag.delete({
    where: { id }
  });

  response.status(204).send();
};

export const listCoupons = async (_request: Request, response: Response) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: coupons.map(serializeCoupon)
  });
};

export const createCoupon = async (request: Request, response: Response) => {
  const payload = couponSchema.parse(request.body);

  const coupon = await prisma.coupon.create({
    data: {
      codigo: payload.codigo.toUpperCase(),
      tipo: payload.tipo,
      valor: payload.valor,
      maxUsos: payload.maxUsos,
      vencimiento: payload.vencimiento ? new Date(payload.vencimiento) : null,
      activo: payload.activo,
      descripcion: payload.descripcion
    }
  });

  response.status(201).json({
    item: serializeCoupon(coupon)
  });
};

export const updateCoupon = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = couponSchema.parse(request.body);

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      codigo: payload.codigo.toUpperCase(),
      tipo: payload.tipo,
      valor: payload.valor,
      maxUsos: payload.maxUsos,
      vencimiento: payload.vencimiento ? new Date(payload.vencimiento) : null,
      activo: payload.activo,
      descripcion: payload.descripcion
    }
  });

  response.json({
    item: serializeCoupon(coupon)
  });
};

export const deleteCoupon = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  await prisma.coupon.delete({
    where: { id }
  });

  response.status(204).send();
};

export const listBlogPostsAdmin = async (_request: Request, response: Response) => {
  const posts = await prisma.blogPost.findMany({
    include: {
      author: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: posts.map(serializeBlogPost)
  });
};

export const createBlogPost = async (request: Request, response: Response) => {
  const payload = blogSchema.parse(request.body);

  const post = await prisma.blogPost.create({
    data: {
      slug: slugify(payload.titulo, { lower: true, strict: true }) || `blog-${createShortId(6)}`,
      titulo: payload.titulo,
      excerpt: payload.excerpt,
      contenido: payload.contenido,
      imagen: payload.imagen,
      relatedProductIds: payload.relatedProductIds,
      autorId: request.authUser!.userId,
      publicado: payload.publicado,
      publishedAt: payload.publicado ? new Date() : null
    },
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

  response.status(201).json({
    item: serializeBlogPost(post)
  });
};

export const updateBlogPost = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = blogSchema.parse(request.body);

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      slug: slugify(payload.titulo, { lower: true, strict: true }),
      titulo: payload.titulo,
      excerpt: payload.excerpt,
      contenido: payload.contenido,
      imagen: payload.imagen,
      relatedProductIds: payload.relatedProductIds,
      publicado: payload.publicado,
      publishedAt: payload.publicado ? new Date() : null
    },
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

  response.json({
    item: serializeBlogPost(post)
  });
};

export const deleteBlogPost = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  await prisma.blogPost.delete({
    where: { id }
  });

  response.status(204).send();
};
