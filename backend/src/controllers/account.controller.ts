import { CouponType, OrderStatus, Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";

import { SHIPPING_FLAT_RATE } from "../config/constants";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { sendOrderConfirmationEmail } from "../services/email";
import { buildBoldCheckoutConfig } from "../utils/bold";
import { serializeCartItem, serializeOrder, serializeProduct, toNumber } from "../utils/serializers";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  cantidad: z.number().int().min(1).max(10).default(1),
  talla: z.string().optional(),
  color: z.string().optional()
});

const updateCartItemSchema = z.object({
  cantidad: z.number().int().min(1).max(10),
  talla: z.string().optional(),
  color: z.string().optional()
});

const wishlistSchema = z.object({
  productId: z.string().uuid()
});

const addressSchema = z.object({
  alias: z.string().min(2),
  destinatario: z.string().min(2),
  telefono: z.string().min(7),
  direccion1: z.string().min(5),
  direccion2: z.string().optional(),
  ciudad: z.string().min(2),
  region: z.string().min(2),
  codigoPostal: z.string().min(3),
  pais: z.string().default("CO"),
  esPrincipal: z.boolean().default(false)
});

const profileSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal(""))
});

const createOrderSchema = z.object({
  addressId: z.string().uuid().optional(),
  shippingAddress: addressSchema.optional(),
  couponCode: z.string().optional(),
  metodoPago: z.string().default("BOLD")
});

const orderStatusSchema = z.object({
  estado: z.nativeEnum(OrderStatus)
});

const getCartItems = (userId: string) =>
  prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: { orderBy: { orden: "asc" } },
          tags: { include: { tag: true } },
          reviews: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

const computeLinePrice = (product: { precio: Prisma.Decimal; precioOferta: Prisma.Decimal | null }) =>
  Number(product.precioOferta ?? product.precio);

const serializeAddress = (address: any) => ({
  id: address.id,
  alias: address.alias,
  destinatario: address.destinatario,
  telefono: address.telefono,
  direccion1: address.direccion1,
  direccion2: address.direccion2,
  ciudad: address.ciudad,
  region: address.region,
  codigoPostal: address.codigoPostal,
  pais: address.pais,
  esPrincipal: address.esPrincipal
});

const applyCoupon = async (couponCode: string | undefined, subtotal: number) => {
  if (!couponCode) {
    return { coupon: null, discount: 0 };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { codigo: couponCode.toUpperCase() }
  });

  if (!coupon || !coupon.activo) {
    throw new AppError("El cupón no es válido", 404);
  }

  if (coupon.vencimiento && coupon.vencimiento < new Date()) {
    throw new AppError("El cupón expiró", 400);
  }

  if (coupon.maxUsos && coupon.usosActuales >= coupon.maxUsos) {
    throw new AppError("El cupón ya alcanzó su máximo de usos", 400);
  }

  const discount =
    coupon.tipo === CouponType.PERCENTAGE
      ? Math.round((subtotal * toNumber(coupon.valor)!) / 100)
      : Math.round(toNumber(coupon.valor)!);

  return {
    coupon,
    discount: Math.min(subtotal, discount)
  };
};

export const getCart = async (request: Request, response: Response) => {
  const items = await getCartItems(request.authUser!.userId);

  response.json({
    items: items.map(serializeCartItem)
  });
};

export const addCartItem = async (request: Request, response: Response) => {
  const payload = cartItemSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const product = await prisma.product.findUnique({
    where: { id: payload.productId }
  });

  if (!product || !product.activo) {
    throw new AppError("Producto no disponible", 404);
  }

  if (product.stock === 0) {
    throw new AppError("El producto está agotado", 400);
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId: payload.productId,
      talla: payload.talla ?? null,
      color: payload.color ?? null
    }
  });

  const item = existingItem
    ? await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          cantidad: Math.min(existingItem.cantidad + payload.cantidad, 10)
        },
        include: {
          product: {
            include: {
              images: { orderBy: { orden: "asc" } },
              tags: { include: { tag: true } },
              reviews: true
            }
          }
        }
      })
    : await prisma.cartItem.create({
        data: {
          userId,
          productId: payload.productId,
          cantidad: payload.cantidad,
          talla: payload.talla,
          color: payload.color
        },
        include: {
          product: {
            include: {
              images: { orderBy: { orden: "asc" } },
              tags: { include: { tag: true } },
              reviews: true
            }
          }
        }
      });

  response.status(201).json({
    item: serializeCartItem(item)
  });
};

export const updateCartItem = async (request: Request, response: Response) => {
  const { itemId } = z.object({ itemId: z.string().uuid() }).parse(request.params);
  const payload = updateCartItemSchema.parse(request.body);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      userId: request.authUser!.userId
    },
    include: {
      product: {
        include: {
          images: { orderBy: { orden: "asc" } },
          tags: { include: { tag: true } },
          reviews: true
        }
      }
    }
  });

  if (!item) {
    throw new AppError("Item de carrito no encontrado", 404);
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: {
      cantidad: payload.cantidad,
      talla: payload.talla,
      color: payload.color
    },
    include: {
      product: {
        include: {
          images: { orderBy: { orden: "asc" } },
          tags: { include: { tag: true } },
          reviews: true
        }
      }
    }
  });

  response.json({
    item: serializeCartItem(updated)
  });
};

export const deleteCartItem = async (request: Request, response: Response) => {
  const { itemId } = z.object({ itemId: z.string().uuid() }).parse(request.params);

  await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      userId: request.authUser!.userId
    }
  });

  response.status(204).send();
};

export const clearCart = async (request: Request, response: Response) => {
  await prisma.cartItem.deleteMany({
    where: {
      userId: request.authUser!.userId
    }
  });

  response.status(204).send();
};

export const getWishlist = async (request: Request, response: Response) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: request.authUser!.userId },
    include: {
      product: {
        include: {
          images: { orderBy: { orden: "asc" } },
          tags: { include: { tag: true } },
          reviews: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: items.map((item) => ({
      id: item.id,
      product: serializeProduct(item.product)
    }))
  });
};

export const addWishlistItem = async (request: Request, response: Response) => {
  const { productId } = wishlistSchema.parse(request.body);

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: request.authUser!.userId,
        productId
      }
    },
    update: {},
    create: {
      userId: request.authUser!.userId,
      productId
    },
    include: {
      product: {
        include: {
          images: { orderBy: { orden: "asc" } },
          tags: { include: { tag: true } },
          reviews: true
        }
      }
    }
  });

  response.status(201).json({
    item: {
      id: item.id,
      product: serializeProduct(item.product)
    }
  });
};

export const deleteWishlistItem = async (request: Request, response: Response) => {
  const { productId } = z.object({ productId: z.string().uuid() }).parse(request.params);

  await prisma.wishlistItem.deleteMany({
    where: {
      userId: request.authUser!.userId,
      productId
    }
  });

  response.status(204).send();
};

export const createOrder = async (request: Request, response: Response) => {
  const payload = createOrderSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const [user, cartItems] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId }
    }),
    getCartItems(userId)
  ]);

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  if (cartItems.length === 0) {
    throw new AppError("Tu carrito está vacío", 400);
  }

  if (cartItems.some((item) => item.product.stock === 0)) {
    throw new AppError("Hay productos agotados en tu carrito", 400);
  }

  const subtotal = cartItems.reduce(
    (accumulator, item) => accumulator + computeLinePrice(item.product) * item.cantidad,
    0
  );
  const shipping = SHIPPING_FLAT_RATE;
  const { coupon, discount } = await applyCoupon(payload.couponCode, subtotal);
  const total = Math.max(subtotal + shipping - discount, 0);

  const address =
    payload.shippingAddress ??
    (payload.addressId
      ? await prisma.address.findFirst({
          where: {
            id: payload.addressId,
            userId
          }
        })
      : null);

  if (!address) {
    throw new AppError("Debes seleccionar una dirección de envío", 400);
  }

  const order = await prisma.$transaction(async (transaction) => {
    const created = await transaction.order.create({
      data: {
        reference: `ORD-${nanoid(10).toUpperCase()}`,
        userId,
        subtotal,
        descuento: discount,
        envio: shipping,
        total,
        metodoPago: payload.metodoPago,
        estado: OrderStatus.PENDING_PAYMENT,
        paymentReference: `REF-${nanoid(12).toUpperCase()}`,
        direccionEnvio: address,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            cantidad: item.cantidad,
            talla: item.talla,
            color: item.color,
            precio: computeLinePrice(item.product)
          }))
        }
      },
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

    if (coupon) {
      await transaction.coupon.update({
        where: { id: coupon.id },
        data: {
          usosActuales: {
            increment: 1
          }
        }
      });
    }

    return created;
  });

  const checkout = buildBoldCheckoutConfig({
    order,
    customer: user
  });

  response.status(201).json({
    item: serializeOrder(order),
    payment: {
      provider: "BOLD",
      checkout
    }
  });
};

export const listMyOrders = async (request: Request, response: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: request.authUser!.userId },
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
    orderBy: { createdAt: "desc" }
  });

  response.json({
    items: orders.map(serializeOrder)
  });
};

export const getOrder = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);

  const order = await prisma.order.findFirst({
    where: {
      id,
      ...(request.authUser!.role === "CLIENTE" ? { userId: request.authUser!.userId } : {})
    },
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

  if (!order) {
    throw new AppError("Pedido no encontrado", 404);
  }

  response.json({
    item: serializeOrder(order)
  });
};

export const getProfile = async (request: Request, response: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.authUser!.userId }
  });

  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }

  response.json({
    item: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      avatar: user.avatar
    }
  });
};

export const updateProfile = async (request: Request, response: Response) => {
  const payload = profileSchema.parse(request.body);

  const user = await prisma.user.update({
    where: { id: request.authUser!.userId },
    data: {
      nombre: payload.nombre,
      email: payload.email.toLowerCase(),
      telefono: payload.telefono,
      avatar: payload.avatar || null
    }
  });

  response.json({
    item: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      avatar: user.avatar
    }
  });
};

export const listAddresses = async (request: Request, response: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: request.authUser!.userId },
    orderBy: [{ esPrincipal: "desc" }, { createdAt: "desc" }]
  });

  response.json({
    items: addresses.map(serializeAddress)
  });
};

export const createAddress = async (request: Request, response: Response) => {
  const payload = addressSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const address = await prisma.$transaction(async (transaction) => {
    if (payload.esPrincipal) {
      await transaction.address.updateMany({
        where: { userId },
        data: { esPrincipal: false }
      });
    }

    return transaction.address.create({
      data: {
        userId,
        ...payload
      }
    });
  });

  response.status(201).json({
    item: serializeAddress(address)
  });
};

export const updateAddress = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = addressSchema.parse(request.body);
  const userId = request.authUser!.userId;

  const address = await prisma.address.findFirst({
    where: { id, userId }
  });

  if (!address) {
    throw new AppError("Dirección no encontrada", 404);
  }

  const updated = await prisma.$transaction(async (transaction) => {
    if (payload.esPrincipal) {
      await transaction.address.updateMany({
        where: { userId },
        data: { esPrincipal: false }
      });
    }

    return transaction.address.update({
      where: { id },
      data: payload
    });
  });

  response.json({
    item: serializeAddress(updated)
  });
};

export const deleteAddress = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  await prisma.address.deleteMany({
    where: {
      id,
      userId: request.authUser!.userId
    }
  });

  response.status(204).send();
};

export const confirmOrderEmailManually = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true
    }
  });

  if (!order) return;

  await sendOrderConfirmationEmail({
    email: order.user.email,
    nombre: order.user.nombre,
    orderReference: order.reference,
    total: toNumber(order.total) ?? 0
  });
};

export const updateOrderStatusForAdmin = async (request: Request, response: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const payload = orderStatusSchema.parse(request.body);

  const order = await prisma.order.update({
    where: { id },
    data: {
      estado: payload.estado
    },
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

  response.json({
    item: serializeOrder(order)
  });
};
