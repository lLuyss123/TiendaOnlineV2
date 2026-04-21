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

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
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
