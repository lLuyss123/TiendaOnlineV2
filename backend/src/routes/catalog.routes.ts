import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requireVerifiedUser } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import {
  createStockAlert,
  getBlogPost,
  getProduct,
  getRelatedProducts,
  listBlogPosts,
  listProducts,
  validateCoupon
} from "../controllers/catalog.controller";
import {
  createProductReview,
  getMyReview,
  listProductReviews
} from "../controllers/review.controller";

export const catalogRouter = Router();

catalogRouter.get("/productos", asyncHandler(listProducts));
catalogRouter.get("/productos/:id", asyncHandler(getProduct));
catalogRouter.get("/productos/:id/relacionados", asyncHandler(getRelatedProducts));
catalogRouter.get("/productos/:id/resenas", asyncHandler(listProductReviews));
catalogRouter.get("/productos/:id/resenas/mi-resena", asyncHandler(requireAuth), asyncHandler(getMyReview));
catalogRouter.post(
  "/productos/:id/resenas",
  asyncHandler(requireAuth),
  requireVerifiedUser,
  upload.array("fotos", 5),
  asyncHandler(createProductReview)
);
catalogRouter.post(
  "/stock-alert",
  asyncHandler(requireAuth),
  requireVerifiedUser,
  asyncHandler(createStockAlert)
);
catalogRouter.post("/cupones/validar", asyncHandler(validateCoupon));
catalogRouter.get("/blog", asyncHandler(listBlogPosts));
catalogRouter.get("/blog/:id", asyncHandler(getBlogPost));
