import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import {
  login,
  logout,
  me,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  validatePasswordResetToken,
  verifyEmail
} from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/registro", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.get("/me", asyncHandler(me));
authRouter.get("/verificar-email", asyncHandler(verifyEmail));
authRouter.post("/reenviar-verificacion", asyncHandler(resendVerification));
authRouter.post("/recuperar-contrasena", asyncHandler(requestPasswordReset));
authRouter.post("/nueva-contrasena", asyncHandler(resetPassword));
authRouter.post("/validar-token-reset", asyncHandler(validatePasswordResetToken));
authRouter.post("/logout", asyncHandler(logout));
