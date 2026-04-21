import { Router } from "express";

import { asyncHandler } from "../lib/async-handler";
import { requireAuth, requireVerifiedUser } from "../middlewares/auth";
import {
  addCartItem,
  addWishlistItem,
  clearCart,
  createAddress,
  createOrder,
  deleteAddress,
  deleteCartItem,
  deleteWishlistItem,
  getCart,
  getOrder,
  getProfile,
  getWishlist,
  listAddresses,
  listMyOrders,
  updateAddress,
  updateCartItem,
  updateProfile
} from "../controllers/account.controller";

export const accountRouter = Router();

accountRouter.use(asyncHandler(requireAuth), requireVerifiedUser);

accountRouter.get("/carrito", asyncHandler(getCart));
accountRouter.post("/carrito", asyncHandler(addCartItem));
accountRouter.put("/carrito/:itemId", asyncHandler(updateCartItem));
accountRouter.delete("/carrito/:itemId", asyncHandler(deleteCartItem));
accountRouter.delete("/carrito", asyncHandler(clearCart));

accountRouter.get("/wishlist", asyncHandler(getWishlist));
accountRouter.post("/wishlist", asyncHandler(addWishlistItem));
accountRouter.delete("/wishlist/:productId", asyncHandler(deleteWishlistItem));

accountRouter.post("/ordenes", asyncHandler(createOrder));
accountRouter.get("/ordenes/mis-ordenes", asyncHandler(listMyOrders));
accountRouter.get("/ordenes/:id", asyncHandler(getOrder));

accountRouter.get("/cuenta/perfil", asyncHandler(getProfile));
accountRouter.put("/cuenta/perfil", asyncHandler(updateProfile));
accountRouter.get("/cuenta/direcciones", asyncHandler(listAddresses));
accountRouter.post("/cuenta/direcciones", asyncHandler(createAddress));
accountRouter.put("/cuenta/direcciones/:id", asyncHandler(updateAddress));
accountRouter.delete("/cuenta/direcciones/:id", asyncHandler(deleteAddress));
