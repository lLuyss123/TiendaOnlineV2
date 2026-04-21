import type { NextFunction, Request, Response } from "express";

import { Permission, Role } from "@prisma/client";

import { AppError } from "../lib/errors";

export const requirePermission =
  (permission: Permission) =>
  (request: Request, _response: Response, next: NextFunction) => {
    if (!request.authUser) {
      next(new AppError("Debes iniciar sesión", 401));
      return;
    }

    if (request.authUser.role === Role.SUPER_ADMIN) {
      next();
      return;
    }

    if (request.authUser.role !== Role.SUB_ADMIN) {
      next(new AppError("Solo administradores pueden hacer esto", 403));
      return;
    }

    if (!request.authUser.permissions.includes(permission)) {
      next(new AppError("Tu cuenta no tiene este permiso granular", 403));
      return;
    }

    next();
  };
