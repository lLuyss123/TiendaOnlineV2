import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { deleteReviewImage, uploadReviewImage } from "../services/cloudinary";
import {
  buildReviewOrderBy,
  buildReviewWhere,
  getDeliveredPurchaseForReview,
  getReviewSummaryForProduct,
  maybeAutoHideReportedReview,
  recalculateProductReviewStats,
  recalculateReviewUtility,
  reviewInclude,
  serializeReview
} from "../services/reviews";

const productIdentifierSchema = z.object({
  id: z.string().min(1)
});

const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10).default(10),
  estrellas: z.coerce.number().int().min(1).max(5).optional(),
  tipo: z.enum(["fotos", "verificadas"]).optional(),
  ajuste: z.string().optional(),
  orden: z.enum(["recientes", "utiles", "alta", "baja"]).default("recientes"),
  busqueda: z.string().trim().optional()
});

const voteSchema = z.object({
  util: z.boolean()
});

const reportSchema = z.object({
  motivo: z.enum(["Spam", "Contenido inapropiado", "Resena falsa", "Otro"])
});

const replySchema = z.object({
  contenido: z.string().min(10).max(1000)
});

const adminReviewQuerySchema = z.object({
  producto: z.string().optional(),
  calificacion: z.coerce.number().int().min(1).max(5).optional(),
  verificado: z.enum(["true", "false"]).optional(),
  reportadas: z.enum(["true", "false"]).optional(),
  respuesta: z.enum(["true", "false"]).optional()
});

const reviewBodySchema = z.object({
  calificacion: z.coerce.number().int().min(1).max(5),
  titulo: z.string().min(3).max(100),
  comentario: z.string().min(20).max(1000),
  ajuste: z.string().optional().transform((value) => value?.trim() || undefined),
  comodidad: z
    .union([z.coerce.number().int().min(1).max(5), z.literal(""), z.undefined()])
    .transform((value) => (value === "" || value === undefined ? undefined : value))
});

const updateReviewBodySchema = reviewBodySchema.extend({
  existingPhotoIds: z.array(z.string()).optional().default([])
});

const reviewIdSchema = z.object({
  reviewId: z.string().min(1)
});

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const parseExistingPhotoIds = (rawValue: unknown) => {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map(String);
  }

  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return rawValue.length > 0 ? [rawValue] : [];
    }
  }

  return [];
};

function parseReviewPayload(
  body: Record<string, unknown>,
  mode: "create"
): z.infer<typeof reviewBodySchema>;
function parseReviewPayload(
  body: Record<string, unknown>,
  mode: "update"
): z.infer<typeof updateReviewBodySchema>;
function parseReviewPayload(body: Record<string, unknown>, mode: "create" | "update") {
  const payload = {
    ...body,
    existingPhotoIds: mode === "update" ? parseExistingPhotoIds(body.existingPhotoIds) : undefined
  };

  return mode === "update"
    ? updateReviewBodySchema.parse(payload)
    : reviewBodySchema.parse(payload);
};

const findProductByIdentifier = async (identifier: string) =>
  prisma.product.findFirst({
    where: isUuid(identifier)
      ? {
          OR: [{ id: identifier }, { slug: identifier }],
          activo: true
        }
      : {
          slug: identifier,
          activo: true
        }
  });

const uploadReviewFiles = async (files: Express.Multer.File[] | undefined, reviewId: string) => {
  if (!files?.length) {
    return [];
  }

  return Promise.all(
    files.map(async (file, index) => {
      const result = await uploadReviewImage(file.buffer, `${reviewId}-${Date.now()}-${index}`);
      return {
        url: result.url,
        publicId: result.publicId,
        orden: index
      };
    })
  );
};

const buildReviewListResponse = async (
  productId: string,
  reviews: Array<Parameters<typeof serializeReview>[0]>,
  currentUserId?: string
) => {
  const summary = await getReviewSummaryForProduct(productId);

  return {
    resumen: summary,
    items: reviews.map((review) => serializeReview(review, currentUserId))
  };
};

export const listProductReviews = async (request: Request, response: Response) => {
  const { id } = productIdentifierSchema.parse(request.params);
  const query = reviewListQuerySchema.parse(request.query);
  const product = await findProductByIdentifier(id);

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const where = buildReviewWhere(product.id, query);
  const skip = (query.page - 1) * query.limit;

  const [reviews, total, positive, critical] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: buildReviewOrderBy(query.orden),
      skip,
      take: query.limit
    }),
    prisma.review.count({ where }),
    prisma.review.findFirst({
      where: {
        productId: product.id,
        visible: true,
        calificacion: {
          gte: 4
        }
      },
      include: reviewInclude,
      orderBy: buildReviewOrderBy("utiles")
    }),
    prisma.review.findFirst({
      where: {
        productId: product.id,
        visible: true,
        calificacion: {
          lte: 2
        }
      },
      include: reviewInclude,
      orderBy: buildReviewOrderBy("utiles")
    })
  ]);
  const payload = await buildReviewListResponse(product.id, reviews, request.authUser?.userId);

  response.json({
    resenas: payload.items,
    total,
    pagina: query.page,
    hayMas: skip + reviews.length < total,
    resenaPositivaDestacada: positive ? serializeReview(positive, request.authUser?.userId) : null,
    resenaCriticaDestacada: critical ? serializeReview(critical, request.authUser?.userId) : null,
    resumen: payload.resumen,
    filtrosAplicados: {
      estrellas: query.estrellas ?? null,
      tipo: query.tipo ?? null,
      ajuste: query.ajuste ?? null,
      orden: query.orden,
      busqueda: query.busqueda ?? ""
    }
  });
};

export const getMyReview = async (request: Request, response: Response) => {
  const { id } = productIdentifierSchema.parse(request.params);
  const product = await findProductByIdentifier(id);

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const userId = request.authUser!.userId;
  const [review, purchase] = await Promise.all([
    prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId
        }
      },
      include: reviewInclude
    }),
    getDeliveredPurchaseForReview(userId, product.id)
  ]);

  response.json({
    item: review ? serializeReview(review, userId) : null,
    elegibilidad: {
      puedeResenar:
        request.authUser!.active &&
        request.authUser!.role === "CLIENTE" &&
        Boolean(purchase) &&
        !review,
      yaEscribio: Boolean(review),
      haComprado: Boolean(purchase),
      emailVerificado: request.authUser!.active,
      tallaComprada: purchase?.talla ?? null,
      ordenId: purchase?.orderId ?? null,
      razon: review
        ? "Ya escribiste una resena para este producto."
        : !request.authUser!.active
          ? "Confirma tu correo para poder resenar."
          : !purchase
            ? "Solo clientes con una orden entregada pueden resenar este producto."
            : null
    }
  });
};

export const createProductReview = async (request: Request, response: Response) => {
  const { id } = productIdentifierSchema.parse(request.params);
  const product = await findProductByIdentifier(id);

  if (!product) {
    throw new AppError("Producto no encontrado", 404);
  }

  const payload = parseReviewPayload(request.body as Record<string, unknown>, "create");
  const userId = request.authUser!.userId;
  const existingReview = await prisma.review.findUnique({
    where: {
      productId_userId: {
        productId: product.id,
        userId
      }
    }
  });

  if (existingReview) {
    throw new AppError("Ya existe una resena para este producto", 409);
  }

  const deliveredPurchase = await getDeliveredPurchaseForReview(userId, product.id);

  if (!deliveredPurchase) {
    throw new AppError("Solo clientes con una orden entregada pueden resenar", 403);
  }

  const review = await prisma.$transaction(async (transaction) => {
    const created = await transaction.review.create({
      data: {
        productId: product.id,
        userId,
        calificacion: payload.calificacion,
        titulo: payload.titulo,
        comentario: payload.comentario,
        ajuste: payload.ajuste || null,
        comodidad: payload.comodidad ?? null,
        talla: deliveredPurchase.talla || null,
        verificado: true
      }
    });

    const uploadedPhotos = await uploadReviewFiles(request.files as Express.Multer.File[] | undefined, created.id);

    if (uploadedPhotos.length > 0) {
      await transaction.reviewPhoto.createMany({
        data: uploadedPhotos.map((photo) => ({
          reviewId: created.id,
          url: photo.url,
          publicId: photo.publicId,
          orden: photo.orden
        }))
      });
    }

    await recalculateProductReviewStats(product.id, transaction);
    await transaction.reviewReminderJob.updateMany({
      where: {
        userId,
        productId: product.id,
        sentAt: null
      },
      data: {
        sentAt: new Date()
      }
    });

    return transaction.review.findUniqueOrThrow({
      where: { id: created.id },
      include: reviewInclude
    });
  });

  response.status(201).json({
    item: serializeReview(review, userId),
    message: "Gracias por tu resena. Ya esta visible en el producto."
  });
};

export const updateReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const payload = parseReviewPayload(request.body as Record<string, unknown>, "update");
  const userId = request.authUser!.userId;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      fotos: true
    }
  });

  if (!review || review.userId !== userId) {
    throw new AppError("No puedes editar esta resena", 403);
  }

  const photosToKeep = new Set(payload.existingPhotoIds);
  const photosToDelete = review.fotos.filter((photo) => !photosToKeep.has(photo.id));

  const updatedReview = await prisma.$transaction(async (transaction) => {
    await transaction.review.update({
      where: { id: reviewId },
      data: {
        calificacion: payload.calificacion,
        titulo: payload.titulo,
        comentario: payload.comentario,
        ajuste: payload.ajuste || null,
        comodidad: payload.comodidad ?? null
      }
    });

    if (photosToDelete.length > 0) {
      await transaction.reviewPhoto.deleteMany({
        where: {
          id: {
            in: photosToDelete.map((photo) => photo.id)
          }
        }
      });
    }

    const newFiles = request.files as Express.Multer.File[] | undefined;
    const uploadedPhotos = await uploadReviewFiles(newFiles, reviewId);

    if (uploadedPhotos.length > 0) {
      const maxOrder =
        review.fotos
          .filter((photo) => photosToKeep.has(photo.id))
          .reduce((accumulator, photo) => Math.max(accumulator, photo.orden), -1) + 1;

      await transaction.reviewPhoto.createMany({
        data: uploadedPhotos.map((photo, index) => ({
          reviewId,
          url: photo.url,
          publicId: photo.publicId,
          orden: maxOrder + index
        }))
      });
    }

    await recalculateProductReviewStats(review.productId, transaction);

    return transaction.review.findUniqueOrThrow({
      where: { id: reviewId },
      include: reviewInclude
    });
  });

  await Promise.all(photosToDelete.map((photo) => deleteReviewImage(photo.publicId)));

  response.json({
    item: serializeReview(updatedReview, userId),
    message: "Tu resena fue actualizada."
  });
};

export const deleteReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const userId = request.authUser!.userId;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      fotos: true
    }
  });

  if (!review || review.userId !== userId) {
    throw new AppError("No puedes eliminar esta resena", 403);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.review.delete({
      where: { id: reviewId }
    });

    await recalculateProductReviewStats(review.productId, transaction);
  });

  await Promise.all(review.fotos.map((photo) => deleteReviewImage(photo.publicId)));

  response.status(204).send();
};

export const voteReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const payload = voteSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review || !review.visible) {
    throw new AppError("Resena no encontrada", 404);
  }

  await prisma.reviewVote.upsert({
    where: {
      reviewId_userId: {
        reviewId,
        userId
      }
    },
    update: {
      util: payload.util
    },
    create: {
      reviewId,
      userId,
      util: payload.util
    }
  });

  const summary = await recalculateReviewUtility(reviewId);

  response.json({
    message: "Tu voto fue registrado.",
    item: summary
  });
};

export const deleteReviewVote = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const userId = request.authUser!.userId;

  await prisma.reviewVote.deleteMany({
    where: {
      reviewId,
      userId
    }
  });

  const summary = await recalculateReviewUtility(reviewId);

  response.json({
    message: "Tu voto fue removido.",
    item: summary
  });
};

export const reportReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const payload = reportSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new AppError("Resena no encontrada", 404);
  }

  await prisma.reviewReport.create({
    data: {
      reviewId,
      userId,
      motivo: payload.motivo
    }
  });

  const moderation = await maybeAutoHideReportedReview(reviewId);

  response.status(201).json({
    message: moderation.hidden
      ? "La resena fue ocultada temporalmente mientras el equipo la revisa."
      : "Gracias por reportar esta resena.",
    item: moderation
  });
};

export const listAdminReviews = async (request: Request, response: Response) => {
  const query = adminReviewQuerySchema.parse(request.query);

  const reviews = await prisma.review.findMany({
    where: {
      ...(query.calificacion ? { calificacion: query.calificacion } : {}),
      ...(query.verificado ? { verificado: query.verificado === "true" } : {}),
      ...(query.reportadas === "true" ? { reportes: { some: {} } } : {}),
      ...(query.reportadas === "false" ? { reportes: { none: {} } } : {}),
      ...(query.respuesta === "true" ? { respuesta: { isNot: null } } : {}),
      ...(query.respuesta === "false" ? { respuesta: null } : {}),
      ...(query.producto
        ? {
            product: {
              OR: [
                { nombre: { contains: query.producto, mode: "insensitive" } },
                { slug: { contains: query.producto, mode: "insensitive" } }
              ]
            }
          }
        : {})
    },
    include: {
      ...reviewInclude,
      product: {
        select: {
          id: true,
          nombre: true,
          slug: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  response.json({
    items: reviews.map((review) => ({
      ...serializeReview(review),
      product: review.product
    }))
  });
};

export const listReportedAdminReviews = async (_request: Request, response: Response) => {
  const reviews = await prisma.review.findMany({
    where: {
      reportes: {
        some: {}
      }
    },
    include: {
      ...reviewInclude,
      product: {
        select: {
          id: true,
          nombre: true,
          slug: true
        }
      }
    }
  });

  const sorted = reviews
    .map((review) => ({
      ...serializeReview(review),
      product: review.product,
      reportes: review.reportes
    }))
    .sort((left, right) => right.reportes.length - left.reportes.length);

  response.json({
    items: sorted
  });
};

export const createAdminReply = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const payload = replySchema.parse(request.body);

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new AppError("Resena no encontrada", 404);
  }

  const reply = await prisma.reviewReply.create({
    data: {
      reviewId,
      adminId: request.authUser!.userId,
      contenido: payload.contenido
    },
    include: {
      admin: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    }
  });

  response.status(201).json({
    item: {
      id: reply.id,
      contenido: reply.contenido,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      admin: reply.admin
    }
  });
};

export const updateAdminReply = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);
  const payload = replySchema.parse(request.body);

  const reply = await prisma.reviewReply.update({
    where: { reviewId },
    data: {
      contenido: payload.contenido
    },
    include: {
      admin: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    }
  });

  response.json({
    item: {
      id: reply.id,
      contenido: reply.contenido,
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
      admin: reply.admin
    }
  });
};

export const deleteAdminReply = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);

  await prisma.reviewReply.delete({
    where: { reviewId }
  });

  response.status(204).send();
};

export const deleteAdminReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      fotos: true
    }
  });

  if (!review) {
    throw new AppError("Resena no encontrada", 404);
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.review.delete({
      where: { id: reviewId }
    });
    await recalculateProductReviewStats(review.productId, transaction);
  });

  await Promise.all(review.fotos.map((photo) => deleteReviewImage(photo.publicId)));

  response.status(204).send();
};

export const verifyAdminReview = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: {
      verificado: true
    },
    include: reviewInclude
  });

  response.json({
    item: serializeReview(review)
  });
};

export const dismissAdminReports = async (request: Request, response: Response) => {
  const { reviewId } = reviewIdSchema.parse(request.params);

  await prisma.$transaction([
    prisma.reviewReport.deleteMany({
      where: { reviewId }
    }),
    prisma.review.update({
      where: { id: reviewId },
      data: {
        visible: true
      }
    })
  ]);

  response.json({
    message: "Los reportes fueron desestimados."
  });
};
