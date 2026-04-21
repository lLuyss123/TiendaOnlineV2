import { Router } from "express";
import express from "express";

import { asyncHandler } from "../lib/async-handler";
import { handleBoldWebhook } from "../controllers/payment.controller";

export const paymentRouter = Router();

paymentRouter.post(
  "/bold/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(handleBoldWebhook)
);
