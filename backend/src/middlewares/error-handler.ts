import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { isProduction } from "../config/env";
import { isAppError } from "../lib/errors";

export const notFoundHandler = (request: Request, response: Response) => {
  response.status(404).json({
    message: `No encontramos la ruta ${request.method} ${request.originalUrl}`
  });
};

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction
) => {
  void next;

  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Datos inválidos",
      errors: error.flatten()
    });
    return;
  }

  if (isAppError(error)) {
    response.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    message: "Ocurrió un error inesperado",
    ...(isProduction ? {} : { error })
  });
};
