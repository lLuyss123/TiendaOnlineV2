import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { accountRouter } from "./routes/account.routes";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { catalogRouter } from "./routes/catalog.routes";
import { paymentRouter } from "./routes/payment.routes";
import { reviewRouter } from "./routes/review.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

const configuredOrigins = env.FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevelopmentOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const isAllowedVercelPreviewOrigin = (origin: string) => {
  try {
    const incomingUrl = new URL(origin);

    if (!incomingUrl.hostname.endsWith(".vercel.app")) {
      return false;
    }

    return configuredOrigins.some((configuredOrigin) => {
      try {
        const configuredUrl = new URL(configuredOrigin);

        if (!configuredUrl.hostname.endsWith(".vercel.app")) {
          return false;
        }

        const projectSlug = configuredUrl.hostname.replace(/\.vercel\.app$/, "");
        return incomingUrl.hostname === configuredUrl.hostname || incomingUrl.hostname.startsWith(`${projectSlug}-`);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (isAllowedVercelPreviewOrigin(origin)) {
    return true;
  }

  if (!env.NODE_ENV || env.NODE_ENV !== "production") {
    return isLocalDevelopmentOrigin(origin);
  }

  return false;
};

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, isAllowedOrigin(origin) ? origin ?? true : false);
      },
      credentials: true
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/payments", paymentRouter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRouter);
  app.use("/api", catalogRouter);
  app.use("/api", reviewRouter);
  app.use("/api", accountRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
