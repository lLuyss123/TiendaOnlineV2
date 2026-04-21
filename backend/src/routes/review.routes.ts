import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requireVerifiedUser } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import {
  deleteReview,
  deleteReviewVote,
  reportReview,
  updateReview,
  voteReview
} from "../controllers/review.controller";

export const reviewRouter = Router();

reviewRouter.use(asyncHandler(requireAuth));

reviewRouter.put(
  "/resenas/:reviewId",
  requireVerifiedUser,
  upload.array("fotos", 5),
  asyncHandler(updateReview)
);
reviewRouter.delete("/resenas/:reviewId", requireVerifiedUser, asyncHandler(deleteReview));
reviewRouter.post("/resenas/:reviewId/voto", requireVerifiedUser, asyncHandler(voteReview));
reviewRouter.delete("/resenas/:reviewId/voto", requireVerifiedUser, asyncHandler(deleteReviewVote));
reviewRouter.post("/resenas/:reviewId/reportar", requireVerifiedUser, asyncHandler(reportReview));
