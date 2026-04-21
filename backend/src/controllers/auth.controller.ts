import { Permission, Role } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";
import {
  comparePassword,
  generateSecureToken,
  hashPassword,
  signAuthToken,
  verifyAuthToken
} from "../utils/auth";
import { authCookieName, authCookieOptions, clearAuthCookieOptions } from "../utils/http";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email";
import { dispatchDueReviewReminderJobsForUser } from "../services/reviews";

const registerSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const resendVerificationSchema = z.object({
  email: z.string().email()
});

const passwordResetRequestSchema = z.object({
  email: z.string().email()
});

const passwordResetSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  });

const validateResetTokenSchema = z.object({
  token: z.string().min(10)
});

const serializeSessionUser = (
  user: {
    id: string;
    nombre: string;
    email: string;
    avatar: string | null;
    telefono: string | null;
    rol: Role;
    activo: boolean;
    subAdminPermissions?: Array<{ permission: Permission; active: boolean }>;
  }
) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  avatar: user.avatar,
  telefono: user.telefono,
  rol: user.rol,
  activo: user.activo,
  permisos:
    user.subAdminPermissions?.filter((item) => item.active).map((item) => item.permission) ?? []
});

export const register = async (request: Request, response: Response) => {
  const { nombre, email, password } = registerSchema.parse(request.body);
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    throw new AppError("Ya existe una cuenta con ese email", 409);
  }

  const passwordHash = await hashPassword(password);
  const token = generateSecureToken();

  const user = await prisma.user.create({
    data: {
      nombre,
      email: normalizedEmail,
      password: passwordHash,
      rol: Role.CLIENTE,
      activo: false,
      emailVerificationTokens: {
        create: {
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    }
  });

  await sendVerificationEmail({
    email: user.email,
    nombre: user.nombre,
    token
  });

  response.status(201).json({
    message: "Tu cuenta fue creada. Revisa tu correo para activarla.",
    user: serializeSessionUser({ ...user, subAdminPermissions: [] })
  });
};

export const login = async (request: Request, response: Response) => {
  const { email, password } = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { subAdminPermissions: true }
  });

  if (!user) {
    throw new AppError("Email o contraseña incorrectos", 401);
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new AppError("Email o contraseña incorrectos", 401);
  }

  if (!user.activo && user.rol === Role.CLIENTE) {
    throw new AppError("Debes confirmar tu correo antes de iniciar sesión", 403, {
      needsVerification: true
    });
  }

  const permissions = user.subAdminPermissions.filter((item) => item.active).map((item) => item.permission);
  const token = signAuthToken({
    userId: user.id,
    role: user.rol,
    permissions
  });

  void dispatchDueReviewReminderJobsForUser(user.id).catch((error) => {
    console.error("[review-reminder:login]", error);
  });

  response.cookie(authCookieName, token, authCookieOptions);
  response.json({
    message: "Sesión iniciada",
    user: serializeSessionUser(user)
  });
};

export const me = async (request: Request, response: Response) => {
  const token = request.cookies?.[authCookieName] as string | undefined;

  if (!token) {
    response.json({ user: null });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { subAdminPermissions: true }
    });

    if (!user) {
      response.clearCookie(authCookieName, clearAuthCookieOptions);
      response.json({ user: null });
      return;
    }

    void dispatchDueReviewReminderJobsForUser(user.id).catch((error) => {
      console.error("[review-reminder:me]", error);
    });

    response.json({
      user: serializeSessionUser(user)
    });
  } catch {
    response.clearCookie(authCookieName, clearAuthCookieOptions);
    response.json({ user: null });
  }
};

export const verifyEmail = async (request: Request, response: Response) => {
  const token = z.string().min(10).parse(request.query.token);

  const verification = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!verification || verification.usedAt) {
    throw new AppError("El token no es válido", 400);
  }

  if (verification.expiresAt < new Date()) {
    throw new AppError("El enlace de verificación expiró", 410);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { activo: true }
    }),
    prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { usedAt: new Date() }
    }),
    prisma.emailVerificationToken.deleteMany({
      where: {
        userId: verification.userId,
        id: { not: verification.id }
      }
    })
  ]);

  response.json({
    message: "Tu cuenta fue activada correctamente"
  });
};

export const resendVerification = async (request: Request, response: Response) => {
  const { email } = resendVerificationSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.activo) {
    response.json({
      message: "Si existe una cuenta pendiente, te enviaremos un nuevo correo"
    });
    return;
  }

  const token = generateSecureToken();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })
  ]);

  await sendVerificationEmail({
    email: user.email,
    nombre: user.nombre,
    token
  });

  response.json({
    message: "Te enviamos un nuevo correo de verificación"
  });
};

export const requestPasswordReset = async (request: Request, response: Response) => {
  const { email } = passwordResetRequestSchema.parse(request.body);
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (user) {
    const token = generateSecureToken();

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      })
    ]);

    await sendPasswordResetEmail({
      email: user.email,
      nombre: user.nombre,
      token
    });
  }

  response.json({
    message: "Si existe una cuenta asociada, te enviaremos instrucciones"
  });
};

export const validatePasswordResetToken = async (request: Request, response: Response) => {
  const { token } = validateResetTokenSchema.parse(request.body);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.usedAt) {
    throw new AppError("El token no es válido", 400);
  }

  if (resetToken.expiresAt < new Date()) {
    throw new AppError("El token expiró", 410);
  }

  response.json({
    valid: true
  });
};

export const resetPassword = async (request: Request, response: Response) => {
  const { token, password } = passwordResetSchema.parse(request.body);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetToken || resetToken.usedAt) {
    throw new AppError("El token no es válido", 400);
  }

  if (resetToken.expiresAt < new Date()) {
    throw new AppError("El token expiró", 410);
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id }
      }
    })
  ]);

  response.json({
    message: "Tu contraseña fue actualizada"
  });
};

export const logout = async (_request: Request, response: Response) => {
  response.clearCookie(authCookieName, clearAuthCookieOptions);
  response.json({
    message: "Sesión cerrada"
  });
};
