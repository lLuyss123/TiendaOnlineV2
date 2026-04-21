import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import { sendOrderConfirmationEmail } from "../services/email";
import { mapBoldEventToOrderStatus, verifyBoldWebhookSignature } from "../utils/bold";
import { toNumber } from "../utils/serializers";

export const handleBoldWebhook = async (request: Request, response: Response) => {
  const rawBody = request.body as Buffer;

  if (!Buffer.isBuffer(rawBody)) {
    throw new AppError("Webhook inválido", 400);
  }

  if (!verifyBoldWebhookSignature(rawBody, request.headers["x-bold-signature"])) {
    throw new AppError("Firma de webhook inválida", 400);
  }

  const payload = JSON.parse(rawBody.toString("utf-8")) as {
    id?: string;
    type?: string;
    subject?: string;
    data?: {
      payment_id?: string;
      payer_email?: string;
      metadata?: {
        reference?: string;
      };
    };
  };

  const reference = payload.data?.metadata?.reference ?? payload.subject;

  if (!reference) {
    response.status(200).json({ received: true, ignored: true });
    return;
  }

  const order = await prisma.order.findFirst({
    where: {
      reference
    },
    include: {
      user: true,
      items: true
    }
  });

  if (!order) {
    response.status(200).json({ received: true, ignored: true });
    return;
  }

  const nextStatus = mapBoldEventToOrderStatus(payload.type ?? "PENDING");
  const alreadyProcessed =
    order.boldTransactionId === payload.data?.payment_id && order.boldStatus === payload.type;

  if (!alreadyProcessed) {
    await prisma.$transaction(async (transaction) => {
      await transaction.order.update({
        where: { id: order.id },
        data: {
          estado: nextStatus as any,
          boldTransactionId: payload.data?.payment_id ?? order.boldTransactionId,
          boldStatus: payload.type ?? order.boldStatus
        }
      });

      if (nextStatus === "PAID") {
        await transaction.cartItem.deleteMany({
          where: {
            userId: order.userId
          }
        });
      }
    });

    if (nextStatus === "PAID") {
      await sendOrderConfirmationEmail({
        email: order.user.email,
        nombre: order.user.nombre,
        orderReference: order.reference,
        total: toNumber(order.total) ?? 0
      });
    }
  }

  response.status(200).json({
    received: true
  });
};
