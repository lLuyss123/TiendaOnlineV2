import { OrderStatus, Permission, Prisma, Role } from "@prisma/client";

import { prisma } from "../lib/prisma";
import {
  sendReviewModerationAlertEmail,
  sendReviewRequestEmail
} from "./email";

const REVIEW_REMINDER_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

const fitScoreMap = {
  pequeno: 0,
  exacto: 50,
  grande: 100
} as const;

const normalizeFit = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (normalized.startsWith("peq")) {
    return "Pequeno";
  }

  if (normalized.startsWith("gra")) {
    return "Grande";
  }

  if (normalized.startsWith("exa")) {
    return "Exacto";
  }

  return null;
};

const toDisplayFit = (value?: string | null) => {
  const normalized = normalizeFit(value);

  if (normalized === "Pequeno") {
    return "Pequeno";
  }

  if (normalized === "Grande") {
    return "Grande";
  }

  if (normalized === "Exacto") {
    return "Exacto";
  }

  return null;
};

const scoreToFitLabel = (score: number | null) => {
  if (score === null) {
    return null;
  }

  if (score <= 33) {
    return "Pequeno";
  }

  if (score >= 67) {
    return "Grande";
  }

  return "Exacto";
};

const avatarPalette = [
  { background: "#ffe4d6", foreground: "#c2410c" },
  { background: "#dcfce7", foreground: "#047857" },
  { background: "#dbeafe", foreground: "#1d4ed8" },
  { background: "#fce7f3", foreground: "#be185d" },
  { background: "#ede9fe", foreground: "#6d28d9" },
  { background: "#fef3c7", foreground: "#b45309" }
];

const hashString = (value: string) =>
  value.split("").reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);

export const getAvatarColors = (seed: string) => avatarPalette[hashString(seed) % avatarPalette.length];

export const getMaskedName = (fullName: string) => {
  const [firstName = "Cliente", ...rest] = fullName.trim().split(/\s+/);
  const surnameInitial = rest[0]?.charAt(0).toUpperCase();

  return surnameInitial ? `${firstName} ${surnameInitial}.` : firstName;
};

export const getInitials = (fullName: string) => {
  const [firstName = "C", secondName = ""] = fullName.trim().split(/\s+/);
  return `${firstName.charAt(0)}${secondName.charAt(0)}`.toUpperCase();
};

type ReviewFilters = {
  estrellas?: number;
  tipo?: "fotos" | "verificadas";
  ajuste?: string;
  busqueda?: string;
};

export const buildReviewWhere = (
  productId: string,
  filters: ReviewFilters
): Prisma.ReviewWhereInput => {
  const where: Prisma.ReviewWhereInput = {
    productId,
    visible: true
  };

  if (filters.estrellas) {
    where.calificacion = filters.estrellas;
  }

  if (filters.tipo === "fotos") {
    where.fotos = {
      some: {}
    };
  }

  if (filters.tipo === "verificadas") {
    where.verificado = true;
  }

  if (filters.ajuste) {
    where.ajuste = toDisplayFit(filters.ajuste);
  }

  if (filters.busqueda) {
    where.OR = [
      { titulo: { contains: filters.busqueda, mode: "insensitive" } },
      { comentario: { contains: filters.busqueda, mode: "insensitive" } }
    ];
  }

  return where;
};

export const buildReviewOrderBy = (orden?: string): Prisma.ReviewOrderByWithRelationInput[] => {
  switch (orden) {
    case "utiles":
      return [{ utilidad: "desc" }, { createdAt: "desc" }];
    case "alta":
      return [{ calificacion: "desc" }, { createdAt: "desc" }];
    case "baja":
      return [{ calificacion: "asc" }, { createdAt: "desc" }];
    case "recientes":
    default:
      return [{ createdAt: "desc" }];
  }
};

export const reviewInclude = {
  fotos: {
    orderBy: {
      orden: "asc" as const
    }
  },
  votos: true,
  respuesta: {
    include: {
      admin: {
        select: {
          id: true,
          nombre: true,
          avatar: true
        }
      }
    }
  },
  reportes: true,
  user: {
    select: {
      id: true,
      nombre: true
    }
  }
};

export const serializeReview = (
  review: {
    id: string;
    productId: string;
    userId: string;
    calificacion: number;
    titulo: string;
    comentario: string;
    verificado: boolean;
    talla: string | null;
    ajuste: string | null;
    comodidad: number | null;
    utilidad: number;
    visible: boolean;
    createdAt: Date;
    updatedAt: Date;
    fotos?: Array<{ id: string; url: string; orden: number }>;
    votos?: Array<{ userId: string; util: boolean }>;
    reportes?: Array<{ id: string }>;
    respuesta?: {
      id: string;
      contenido: string;
      createdAt: Date;
      updatedAt?: Date;
      admin?: {
        id: string;
        nombre: string;
        avatar: string | null;
      } | null;
    } | null;
    user?: {
      id: string;
      nombre: string;
    } | null;
  },
  currentUserId?: string
) => {
  const utiles = review.votos?.filter((vote) => vote.util).length ?? 0;
  const noUtiles = review.votos?.filter((vote) => !vote.util).length ?? 0;
  const userVote = review.votos?.find((vote) => vote.userId === currentUserId)?.util ?? null;
  const displayName = review.user ? getMaskedName(review.user.nombre) : "Cliente";
  const avatarSeed = review.user?.id ?? review.id;
  const avatarColors = getAvatarColors(avatarSeed);

  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    calificacion: review.calificacion,
    titulo: review.titulo,
    comentario: review.comentario,
    verificado: review.verificado,
    talla: review.talla,
    ajuste: toDisplayFit(review.ajuste),
    comodidad: review.comodidad,
    utilidad: review.utilidad,
    visible: review.visible,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    usuario: review.user
      ? {
          id: review.user.id,
          nombre: displayName,
          nombreCompleto: review.user.nombre,
          iniciales: getInitials(review.user.nombre),
          avatarColor: avatarColors
        }
      : null,
    fotos:
      review.fotos?.map((photo) => ({
        id: photo.id,
        url: photo.url,
        orden: photo.orden
      })) ?? [],
    votos: {
      utiles,
      noUtiles,
      userVote
    },
    reportCount: review.reportes?.length ?? 0,
    respuesta: review.respuesta
      ? {
          id: review.respuesta.id,
          contenido: review.respuesta.contenido,
          createdAt: review.respuesta.createdAt,
          updatedAt: review.respuesta.updatedAt ?? review.respuesta.createdAt,
          admin: review.respuesta.admin
            ? {
                id: review.respuesta.admin.id,
                nombre: review.respuesta.admin.nombre,
                avatar: review.respuesta.admin.avatar
              }
            : null
        }
      : null
  };
};

export const recalculateReviewUtility = async (
  reviewId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) => {
  const votes = await client.reviewVote.findMany({
    where: { reviewId },
    select: { util: true }
  });

  const utiles = votes.filter((vote) => vote.util).length;
  const noUtiles = votes.filter((vote) => !vote.util).length;
  const utilidad = utiles - noUtiles;

  await client.review.update({
    where: { id: reviewId },
    data: { utilidad }
  });

  return {
    utiles,
    noUtiles,
    utilidad
  };
};

// Guardar el promedio y la distribución en Product evita recalcular AVG/COUNT en cada carga
// del catálogo y del detalle. La lectura ocurre muchas más veces que la escritura.
export const recalculateProductReviewStats = async (
  productId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma
) => {
  const reviews = await client.review.findMany({
    where: {
      productId,
      visible: true
    },
    select: {
      calificacion: true
    }
  });

  const totalResenas = reviews.length;
  const sum = reviews.reduce((accumulator, review) => accumulator + review.calificacion, 0);
  const promedioCalificacion =
    totalResenas > 0 ? Math.round((sum / totalResenas) * 10) / 10 : 0;

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  };

  for (const review of reviews) {
    distribution[review.calificacion as 1 | 2 | 3 | 4 | 5] += 1;
  }

  await client.product.update({
    where: { id: productId },
    data: {
      promedioCalificacion,
      totalResenas,
      distribucion1: distribution[1],
      distribucion2: distribution[2],
      distribucion3: distribution[3],
      distribucion4: distribution[4],
      distribucion5: distribution[5]
    }
  });

  return {
    promedioCalificacion,
    totalResenas,
    distribution
  };
};

export const getReviewSummaryForProduct = async (productId: string) => {
  const [product, reviewMeta] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        promedioCalificacion: true,
        totalResenas: true,
        distribucion1: true,
        distribucion2: true,
        distribucion3: true,
        distribucion4: true,
        distribucion5: true
      }
    }),
    prisma.review.findMany({
      where: {
        productId,
        visible: true
      },
      select: {
        verificado: true,
        ajuste: true,
        comodidad: true
      }
    })
  ]);

  if (!product) {
    return null;
  }

  const fitScores = reviewMeta.reduce<number[]>((accumulator, review) => {
      const fit = normalizeFit(review.ajuste);
      if (fit) {
        accumulator.push(fitScoreMap[fit.toLowerCase() as keyof typeof fitScoreMap]);
      }
      return accumulator;
    }, []);

  const comfortScores = reviewMeta.reduce<number[]>((accumulator, review) => {
    if (review.comodidad !== null) {
      accumulator.push(review.comodidad);
    }
    return accumulator;
  }, []);

  const ajustePromedio =
    fitScores.length > 0
      ? Math.round((fitScores.reduce((accumulator, value) => accumulator + value, 0) / fitScores.length) * 10) /
        10
      : null;

  const comodidadPromedio =
    comfortScores.length > 0
      ? Math.round(
          (comfortScores.reduce((accumulator, value) => accumulator + value, 0) / comfortScores.length) * 10
        ) / 10
      : null;

  const verifiedCount = reviewMeta.filter((review) => review.verificado).length;

  return {
    promedioCalificacion: product.promedioCalificacion,
    totalResenas: product.totalResenas,
    distribucion: {
      1: product.distribucion1,
      2: product.distribucion2,
      3: product.distribucion3,
      4: product.distribucion4,
      5: product.distribucion5
    },
    majorityVerified:
      product.totalResenas > 0 ? verifiedCount > product.totalResenas / 2 : false,
    verifiedCount,
    ajustePromedio,
    ajusteEtiqueta: scoreToFitLabel(ajustePromedio),
    comodidadPromedio
  };
};

// La verificación automática confirma que la reseña viene de una compra entregada
// y no de una opinión anónima sin fricción. Eso aumenta la confianza del comprador.
export const getDeliveredPurchaseForReview = async (userId: string, productId: string) =>
  prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        estado: OrderStatus.DELIVERED
      }
    },
    include: {
      order: true
    },
    orderBy: {
      order: {
        createdAt: "desc"
      }
    }
  });

export const enqueueReviewReminderJobsForOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                orderBy: {
                  orden: "asc"
                }
              }
            }
          }
        }
      }
    }
  });

  if (!order || order.estado !== OrderStatus.DELIVERED) {
    return;
  }

  for (const item of order.items) {
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: item.productId,
          userId: order.userId
        }
      }
    });

    if (existingReview) {
      continue;
    }

    await prisma.reviewReminderJob.upsert({
      where: {
        orderId_userId_productId: {
          orderId: order.id,
          userId: order.userId,
          productId: item.productId
        }
      },
      update: {
        sendAfter: new Date(Date.now() + REVIEW_REMINDER_DELAY_MS)
      },
      create: {
        orderId: order.id,
        userId: order.userId,
        productId: item.productId,
        sendAfter: new Date(Date.now() + REVIEW_REMINDER_DELAY_MS)
      }
    });
  }
};

export const dispatchDueReviewReminderJobsForUser = async (userId: string) => {
  const jobs = await prisma.reviewReminderJob.findMany({
    where: {
      userId,
      sentAt: null,
      sendAfter: {
        lte: new Date()
      }
    },
    include: {
      user: true,
      product: {
        include: {
          images: {
            orderBy: {
              orden: "asc"
            }
          }
        }
      }
    }
  });

  for (const job of jobs) {
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: job.productId,
          userId: job.userId
        }
      }
    });

    if (existingReview) {
      await prisma.reviewReminderJob.update({
        where: { id: job.id },
        data: {
          sentAt: new Date()
        }
      });
      continue;
    }

    await sendReviewRequestEmail({
      email: job.user.email,
      nombre: job.user.nombre,
      productName: job.product.nombre,
      productImage: job.product.images[0]?.url ?? "",
      productSlug: job.product.slug
    });

    await prisma.reviewReminderJob.update({
      where: { id: job.id },
      data: {
        sentAt: new Date()
      }
    });
  }
};

const getModerationRecipients = async () => {
  const admins = await prisma.user.findMany({
    where: {
      activo: true,
      OR: [
        { rol: Role.SUPER_ADMIN },
        {
          rol: Role.SUB_ADMIN,
          subAdminPermissions: {
            some: {
              permission: Permission.GESTIONAR_RESENAS,
              active: true
            }
          }
        }
      ]
    }
  });

  return admins;
};

export const maybeAutoHideReportedReview = async (reviewId: string) => {
  const [reportCount, review] = await Promise.all([
    prisma.reviewReport.count({
      where: { reviewId }
    }),
    prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: true,
        user: true
      }
    })
  ]);

  if (!review || reportCount < 5) {
    return {
      hidden: false,
      reportCount
    };
  }

  if (review.visible) {
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        visible: false
      }
    });

    await recalculateProductReviewStats(review.productId);

    const admins = await getModerationRecipients();

    await Promise.all(
      admins.map((admin) =>
        sendReviewModerationAlertEmail({
          email: admin.email,
          nombre: admin.nombre,
          productName: review.product.nombre,
          reportCount
        })
      )
    );
  }

  return {
    hidden: true,
    reportCount
  };
};
