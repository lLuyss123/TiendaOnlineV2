import type { NextFunction, Request, Response } from "express";

import type { Role } from "@prisma/client";

import { AppError } from "../lib/errors";

export const requireRole =
  (...allowedRoles: Role[]) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authUser) {
      next(new AppError("Debes iniciar sesión", 401));
      return;
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      next(new AppError("No tienes permisos para realizar esta acción", 403));
      return;
    }

    next();
  };
