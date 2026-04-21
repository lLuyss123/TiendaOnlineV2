import { createHash, createHmac, timingSafeEqual } from "crypto";

import type { Order, User } from "@prisma/client";

import { AppError } from "../lib/errors";
import { env } from "../config/env";
import { toNumber } from "./serializers";

type BoldCheckoutInput = {
  order: Order;
  customer: Pick<User, "email" | "nombre" | "telefono">;
};

export const createBoldIntegritySignature = (params: {
  orderId: string;
  amount: number;
  currency: string;
  secretKey?: string;
}) => {
  const secretKey = params.secretKey ?? env.BOLD_SECRET_KEY;

  if (!secretKey) {
    throw new AppError("Falta configurar BOLD_SECRET_KEY", 503);
  }

  const payload = `${params.orderId}${Math.round(params.amount)}${params.currency}${secretKey}`;
  return createHash("sha256").update(payload).digest("hex");
};

export const buildBoldCheckoutConfig = ({ order, customer }: BoldCheckoutInput) => {
  if (!env.BOLD_IDENTITY_KEY || !env.BOLD_SECRET_KEY) {
    throw new AppError("Faltan las credenciales de Bold Checkout", 503);
  }

  const amount = Math.round(toNumber(order.total) ?? 0);

  return {
    apiKey: env.BOLD_IDENTITY_KEY,
    amount,
    currency: "COP",
    orderId: order.reference,
    description: `Pedido SportStore ${order.reference}`,
    redirectionUrl: `${env.FRONTEND_URL}/pedido-confirmado/${order.id}`,
    renderMode: "embedded",
    integritySignature: createBoldIntegritySignature({
      orderId: order.reference,
      amount,
      currency: "COP",
      secretKey: env.BOLD_SECRET_KEY
    }),
    customerData: {
      email: customer.email,
      fullName: customer.nombre,
      phone: customer.telefono ?? ""
    }
  };
};

export const verifyBoldWebhookSignature = (rawBody: Buffer, signatureHeader?: string | string[]) => {
  const receivedSignature =
    typeof signatureHeader === "string" ? signatureHeader : signatureHeader?.[0];

  if (!receivedSignature) {
    return false;
  }

  const encoded = rawBody.toString("utf-8");
  const message = Buffer.from(encoded, "utf-8").toString("base64");
  const secretKey = env.BOLD_SECRET_KEY ?? "";
  const computedSignature = createHmac("sha256", secretKey).update(message).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(computedSignature), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
};

export const mapBoldEventToOrderStatus = (status: string) => {
  const normalized = status.toUpperCase();

  if (normalized.includes("APPROVED")) return "PAID";
  if (normalized.includes("REJECTED")) return "REJECTED";
  if (normalized.includes("FAILED")) return "FAILED";
  if (normalized.includes("PENDING") || normalized.includes("PROCESSING")) return "PROCESSING";

  return "PENDING_PAYMENT";
};
