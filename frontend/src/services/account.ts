import type { Address, BoldCheckoutConfig, CartItem, Order, Product, User } from "@/types/api";

import { apiFetch } from "./api";

export const accountService = {
  getCart: () => apiFetch<{ items: CartItem[] }>("/api/carrito"),
  addToCart: (payload: { productId: string; cantidad: number; talla?: string; color?: string }) =>
    apiFetch<{ item: CartItem }>("/api/carrito", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCartItem: (itemId: string, payload: { cantidad: number; talla?: string; color?: string }) =>
    apiFetch<{ item: CartItem }>(`/api/carrito/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteCartItem: (itemId: string) =>
    apiFetch<void>(`/api/carrito/${itemId}`, {
      method: "DELETE"
    }),
  clearCart: () =>
    apiFetch<void>("/api/carrito", {
      method: "DELETE"
    }),
  getWishlist: () => apiFetch<{ items: Array<{ id: string; product: Product }> }>("/api/wishlist"),
  addToWishlist: (productId: string) =>
    apiFetch<{ item: { id: string; product: Product } }>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId })
    }),
  removeFromWishlist: (productId: string) =>
    apiFetch<void>(`/api/wishlist/${productId}`, {
      method: "DELETE"
    }),
  createOrder: (payload: {
    addressId?: string;
    shippingAddress?: Omit<Address, "id">;
    couponCode?: string;
    metodoPago?: string;
  }) =>
    apiFetch<{ item: Order; payment: { provider: "BOLD"; checkout: BoldCheckoutConfig } }>("/api/ordenes", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getMyOrders: () => apiFetch<{ items: Order[] }>("/api/ordenes/mis-ordenes"),
  getOrder: (id: string) => apiFetch<{ item: Order }>(`/api/ordenes/${id}`),
  getProfile: () => apiFetch<{ item: Pick<User, "id" | "nombre" | "email" | "telefono" | "avatar"> }>("/api/cuenta/perfil"),
  updateProfile: (payload: { nombre: string; email: string; telefono?: string; avatar?: string }) =>
    apiFetch<{ item: Pick<User, "id" | "nombre" | "email" | "telefono" | "avatar"> }>("/api/cuenta/perfil", {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  getAddresses: () => apiFetch<{ items: Address[] }>("/api/cuenta/direcciones"),
  createAddress: (payload: Omit<Address, "id">) =>
    apiFetch<{ item: Address }>("/api/cuenta/direcciones", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateAddress: (id: string, payload: Omit<Address, "id">) =>
    apiFetch<{ item: Address }>(`/api/cuenta/direcciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteAddress: (id: string) =>
    apiFetch<void>(`/api/cuenta/direcciones/${id}`, {
      method: "DELETE"
    })
};
