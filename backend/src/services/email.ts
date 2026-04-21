import { Resend } from "resend";

import { env } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  if (!resend) {
    console.info("[email:mock]", { to, subject });
    return { mocked: true };
  }

  return resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

export const sendVerificationEmail = async (params: {
  email: string;
  nombre: string;
  token: string;
}) =>
  sendEmail({
    to: params.email,
    subject: "Activa tu cuenta de SportStore",
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Bienvenido a SportStore, ${params.nombre}</h1>
        <p>Confirma tu correo para activar tu cuenta y empezar a comprar.</p>
        <p>
          <a href="${env.FRONTEND_URL}/verificar-email?token=${params.token}" style="display:inline-block;padding:12px 20px;background:#111827;color:#fff;text-decoration:none;border-radius:999px">
            Activar mi cuenta
          </a>
        </p>
        <p>Este enlace expira en 24 horas.</p>
      </div>
    `
  });

export const sendPasswordResetEmail = async (params: {
  email: string;
  nombre: string;
  token: string;
}) =>
  sendEmail({
    to: params.email,
    subject: "Restablece tu contraseña de SportStore",
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Hola, ${params.nombre}</h1>
        <p>Recibimos una solicitud para cambiar tu contraseña.</p>
        <p>
          <a href="${env.FRONTEND_URL}/nueva-contrasena?token=${params.token}" style="display:inline-block;padding:12px 20px;background:#ea580c;color:#fff;text-decoration:none;border-radius:999px">
            Cambiar contraseña
          </a>
        </p>
        <p>Este enlace expira en 1 hora. Si no fuiste tú, ignora este mensaje.</p>
      </div>
    `
  });

export const sendOrderConfirmationEmail = async (params: {
  email: string;
  nombre: string;
  orderReference: string;
  total: number;
}) =>
  sendEmail({
    to: params.email,
    subject: `Confirmación de pedido ${params.orderReference}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Tu pedido está confirmado</h1>
        <p>${params.nombre}, recibimos tu orden <strong>${params.orderReference}</strong>.</p>
        <p>Total pagado: <strong>$${params.total.toLocaleString("es-CO")}</strong></p>
        <p>Puedes revisar el detalle en tu cuenta de SportStore.</p>
      </div>
    `
  });

export const sendStockAlertEmail = async (params: {
  email: string;
  nombre: string;
  productName: string;
  productSlug: string;
}) =>
  sendEmail({
    to: params.email,
    subject: `${params.productName} volvió al stock`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Hola, ${params.nombre}</h1>
        <p>El producto <strong>${params.productName}</strong> ya está disponible otra vez.</p>
        <p>
          <a href="${env.FRONTEND_URL}/productos/${params.productSlug}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:999px">
            Ver producto
          </a>
        </p>
      </div>
    `
  });

export const sendReviewRequestEmail = async (params: {
  email: string;
  nombre: string;
  productName: string;
  productImage: string;
  productSlug: string;
}) =>
  sendEmail({
    to: params.email,
    subject: `Como te fue con ${params.productName}?`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Hola, ${params.nombre}</h1>
        <p>Tu compra ya deberia haberte acompaÃ±ado algunos dias. CuÃ©ntanos cÃ³mo te fue.</p>
        ${
          params.productImage
            ? `<img src="${params.productImage}" alt="${params.productName}" style="width:160px;height:160px;object-fit:cover;border-radius:24px;margin:16px 0" />`
            : ""
        }
        <p><strong>${params.productName}</strong></p>
        <p>
          <a href="${env.FRONTEND_URL}/productos/${params.productSlug}#resenas" style="display:inline-block;padding:12px 20px;background:#ea580c;color:#fff;text-decoration:none;border-radius:999px">
            Dejar reseÃ±a
          </a>
        </p>
      </div>
    `
  });

export const sendReviewModerationAlertEmail = async (params: {
  email: string;
  nombre: string;
  productName: string;
  reportCount: number;
}) =>
  sendEmail({
    to: params.email,
    subject: `ReseÃ±a ocultada automÃ¡ticamente: ${params.productName}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827">
        <h1>Hola, ${params.nombre}</h1>
        <p>Una reseÃ±a del producto <strong>${params.productName}</strong> fue ocultada de forma automÃ¡tica.</p>
        <p>Motivo: acumulÃ³ ${params.reportCount} reportes.</p>
        <p>
          <a href="${env.FRONTEND_URL}/admin/resenas/reportadas" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:999px">
            Revisar moderaciÃ³n
          </a>
        </p>
      </div>
    `
  });
