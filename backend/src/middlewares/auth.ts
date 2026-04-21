import type { NextFunction, Request, Response } from "express";

import { Role } from "@prisma/client";

import { authCookieName } from "../utils/http";
import { AppError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { verifyAuthToken } from "../utils/auth";

const extractToken = (request: Request) => {
  const authorizationHeader = request.headers.authorization;

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.replace("Bearer ", "");
  }

  return request.cookies?.[authCookieName] as string | undefined;
};

export const requireAuth = async (request: Request, _response: Response, next: NextFunction) => {
  const token = extractToken(request);

  if (!token) {
    next(new AppError("Debes iniciar sesión", 401));
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { subAdminPermissions: true }
    });

    if (!user) {
      next(new AppError("La sesión ya no es válida", 401));
      return;
    }

    request.authUser = {
      userId: user.id,
      email: user.email,
      role: user.rol,
      active: user.activo,
      permissions: user.subAdminPermissions.filter((item) => item.active).map((item) => item.permission)
    };

    next();
  } catch {
    next(new AppError("La sesión expiró o no es válida", 401));
  }
};

export const requireVerifiedUser = (request: Request, _response: Response, next: NextFunction) => {
  if (!request.authUser) {
    next(new AppError("Debes iniciar sesión", 401));
    return;
  }

  if (!request.authUser.active && request.authUser.role === Role.CLIENTE) {
    next(new AppError("Debes confirmar tu correo para continuar", 403));
    return;
  }

  next();
};
