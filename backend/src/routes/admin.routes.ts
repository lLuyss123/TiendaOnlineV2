import { Permission, Role } from "@prisma/client";
import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requireVerifiedUser } from "../middlewares/auth";
import { requirePermission } from "../middlewares/permisos";
import { requireRole } from "../middlewares/roles";
import { upload } from "../middlewares/upload";
import {
  addImageUrlForProduct,
  createBlogPost,
  createCoupon,
  createProduct,
  createTag,
  deactivateUser,
  deleteBlogPost,
  deleteCoupon,
  deleteImageForProduct,
  deleteProduct,
  deleteTag,
  getAdminProduct,
  getAdminStats,
  listAdminProducts,
  listAdminOrders,
  listBlogPostsAdmin,
  listCoupons,
  listSubAdmins,
  listTags,
  listUsers,
  reorderProductImages,
  setCoverImageForProduct,
  updateImageVisibilityForProduct,
  updateAdminOrderStatus,
  updateBlogPost,
  updateCoupon,
  updateProductActive,
  updateProduct,
  updateTag,
  updateUserPermissions,
  updateUserRole,
  uploadImagesForProduct
} from "../controllers/admin.controller";
import {
  createAdminReply,
  deleteAdminReply,
  deleteAdminReview,
  dismissAdminReports,
  listAdminReviews,
  listReportedAdminReviews,
  updateAdminReply,
  verifyAdminReview
} from "../controllers/review.controller";

export const adminRouter = Router();

adminRouter.use(asyncHandler(requireAuth), requireVerifiedUser, requireRole(Role.SUPER_ADMIN, Role.SUB_ADMIN));

adminRouter.get("/stats", asyncHandler(getAdminStats));

adminRouter.get("/productos", requirePermission(Permission.VER_PRODUCTOS), asyncHandler(listAdminProducts));
adminRouter.get("/productos/:id", requirePermission(Permission.VER_PRODUCTOS), asyncHandler(getAdminProduct));
adminRouter.post("/productos", requirePermission(Permission.CREAR_PRODUCTOS), asyncHandler(createProduct));
adminRouter.put("/productos/:id", requirePermission(Permission.EDITAR_PRODUCTOS), asyncHandler(updateProduct));
adminRouter.put(
  "/productos/:id/activo",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(updateProductActive)
);
adminRouter.delete("/productos/:id", requireRole(Role.SUPER_ADMIN), asyncHandler(deleteProduct));
adminRouter.post(
  "/productos/:id/imagenes",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  upload.array("images", 10),
  asyncHandler(uploadImagesForProduct)
);
adminRouter.post(
  "/productos/:id/imagenes/url",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(addImageUrlForProduct)
);
adminRouter.delete(
  "/productos/:id/imagenes/:imgId",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(deleteImageForProduct)
);
adminRouter.put(
  "/productos/:id/imagenes/:imgId/visibilidad",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(updateImageVisibilityForProduct)
);
adminRouter.put(
  "/productos/:id/imagenes/:imgId/portada",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(setCoverImageForProduct)
);
adminRouter.put(
  "/productos/:id/imagenes/reordenar",
  requirePermission(Permission.EDITAR_PRODUCTOS),
  asyncHandler(reorderProductImages)
);

adminRouter.get("/ordenes", requirePermission(Permission.VER_ORDENES), asyncHandler(listAdminOrders));
adminRouter.put(
  "/ordenes/:id/estado",
  requirePermission(Permission.GESTIONAR_ORDENES),
  asyncHandler(updateAdminOrderStatus)
);

adminRouter.get("/usuarios", requireRole(Role.SUPER_ADMIN), asyncHandler(listUsers));
adminRouter.put("/usuarios/:id/rol", requireRole(Role.SUPER_ADMIN), asyncHandler(updateUserRole));
adminRouter.put(
  "/usuarios/:id/permisos",
  requireRole(Role.SUPER_ADMIN),
  asyncHandler(updateUserPermissions)
);
adminRouter.put(
  "/usuarios/:id/desactivar",
  requireRole(Role.SUPER_ADMIN),
  asyncHandler(deactivateUser)
);
adminRouter.get("/sub-admins", requireRole(Role.SUPER_ADMIN), asyncHandler(listSubAdmins));

adminRouter.get("/etiquetas", requirePermission(Permission.VER_PRODUCTOS), asyncHandler(listTags));
adminRouter.post("/etiquetas", requirePermission(Permission.EDITAR_PRODUCTOS), asyncHandler(createTag));
adminRouter.put("/etiquetas/:id", requirePermission(Permission.EDITAR_PRODUCTOS), asyncHandler(updateTag));
adminRouter.delete("/etiquetas/:id", requireRole(Role.SUPER_ADMIN), asyncHandler(deleteTag));

adminRouter.get("/cupones", requirePermission(Permission.GESTIONAR_CUPONES), asyncHandler(listCoupons));
adminRouter.post("/cupones", requirePermission(Permission.GESTIONAR_CUPONES), asyncHandler(createCoupon));
adminRouter.put("/cupones/:id", requirePermission(Permission.GESTIONAR_CUPONES), asyncHandler(updateCoupon));
adminRouter.delete("/cupones/:id", requireRole(Role.SUPER_ADMIN), asyncHandler(deleteCoupon));

adminRouter.get("/resenas", requirePermission(Permission.GESTIONAR_RESENAS), asyncHandler(listAdminReviews));
adminRouter.get(
  "/resenas/reportadas",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(listReportedAdminReviews)
);
adminRouter.post(
  "/resenas/:reviewId/respuesta",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(createAdminReply)
);
adminRouter.put(
  "/resenas/:reviewId/respuesta",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(updateAdminReply)
);
adminRouter.delete(
  "/resenas/:reviewId/respuesta",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(deleteAdminReply)
);
adminRouter.put(
  "/resenas/:reviewId/verificar",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(verifyAdminReview)
);
adminRouter.delete(
  "/resenas/:reviewId",
  requirePermission(Permission.ELIMINAR_RESENAS),
  asyncHandler(deleteAdminReview)
);
adminRouter.delete(
  "/resenas/:reviewId/reportes",
  requirePermission(Permission.GESTIONAR_RESENAS),
  asyncHandler(dismissAdminReports)
);

adminRouter.get("/blog", requirePermission(Permission.GESTIONAR_BLOG), asyncHandler(listBlogPostsAdmin));
adminRouter.post("/blog", requirePermission(Permission.GESTIONAR_BLOG), asyncHandler(createBlogPost));
adminRouter.put("/blog/:id", requirePermission(Permission.GESTIONAR_BLOG), asyncHandler(updateBlogPost));
adminRouter.delete("/blog/:id", requireRole(Role.SUPER_ADMIN), asyncHandler(deleteBlogPost));
