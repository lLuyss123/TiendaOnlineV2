import type {
  AdminReview,
  AdminStats,
  AdminUser,
  BlogPost,
  Coupon,
  Order,
  Permission,
  Product,
  ReviewReply,
  Tag
} from "@/types/api";

import { apiFetch } from "./api";

export const adminService = {
  getStats: () => apiFetch<AdminStats>("/api/admin/stats"),
  listOrders: () =>
    apiFetch<{ items: Array<Order & { user?: { nombre: string; email: string } }> }>("/api/admin/ordenes"),
  updateOrderStatus: (id: string, estado: string) =>
    apiFetch<{ item: Order }>(`/api/admin/ordenes/${id}/estado`, {
      method: "PUT",
      body: JSON.stringify({ estado })
    }),
  listUsers: () => apiFetch<{ items: AdminUser[] }>("/api/admin/usuarios"),
  updateUserRole: (id: string, rol: string) =>
    apiFetch<{ item: AdminUser }>(`/api/admin/usuarios/${id}/rol`, {
      method: "PUT",
      body: JSON.stringify({ rol })
    }),
  updateUserPermissions: (id: string, permisos: Permission[]) =>
    apiFetch<{ message: string }>(`/api/admin/usuarios/${id}/permisos`, {
      method: "PUT",
      body: JSON.stringify({ permisos })
    }),
  updateUserActive: (id: string, activo: boolean) =>
    apiFetch<{ item: AdminUser }>(`/api/admin/usuarios/${id}/desactivar`, {
      method: "PUT",
      body: JSON.stringify({ activo })
    }),
  listSubAdmins: () =>
    apiFetch<{ items: Array<{ id: string; nombre: string; email: string; permisos: Permission[] }> }>(
      "/api/admin/sub-admins"
    ),
  listTags: () => apiFetch<{ items: Tag[] }>("/api/admin/etiquetas"),
  createTag: (payload: { nombre: string; color: string; icono: string }) =>
    apiFetch<{ item: Tag }>("/api/admin/etiquetas", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTag: (id: string, payload: { nombre: string; color: string; icono: string }) =>
    apiFetch<{ item: Tag }>(`/api/admin/etiquetas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteTag: (id: string) =>
    apiFetch<void>(`/api/admin/etiquetas/${id}`, {
      method: "DELETE"
    }),
  createProduct: (payload: Record<string, unknown>) =>
    apiFetch<{ item: Product }>("/api/admin/productos", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateProduct: (id: string, payload: Record<string, unknown>) =>
    apiFetch<{ item: Product }>(`/api/admin/productos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteProduct: (id: string) =>
    apiFetch<{ item: Product }>(`/api/admin/productos/${id}`, {
      method: "DELETE"
    }),
  uploadProductImages: async (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append("images", file));

    return apiFetch<{ items: Product["images"] }>(`/api/admin/productos/${id}/imagenes`, {
      method: "POST",
      body: form
    });
  },
  deleteProductImage: (productId: string, imageId: string) =>
    apiFetch<void>(`/api/admin/productos/${productId}/imagenes/${imageId}`, {
      method: "DELETE"
    }),
  setProductCover: (productId: string, imageId: string) =>
    apiFetch<{ message: string }>(`/api/admin/productos/${productId}/imagenes/${imageId}/portada`, {
      method: "PUT"
    }),
  reorderProductImages: (productId: string, imageIds: string[]) =>
    apiFetch<{ message: string }>(`/api/admin/productos/${productId}/imagenes/reordenar`, {
      method: "PUT",
      body: JSON.stringify({ imageIds })
    }),
  listCoupons: () => apiFetch<{ items: Coupon[] }>("/api/admin/cupones"),
  createCoupon: (payload: Record<string, unknown>) =>
    apiFetch<{ item: Coupon }>("/api/admin/cupones", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateCoupon: (id: string, payload: Record<string, unknown>) =>
    apiFetch<{ item: Coupon }>(`/api/admin/cupones/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteCoupon: (id: string) =>
    apiFetch<void>(`/api/admin/cupones/${id}`, {
      method: "DELETE"
    }),
  listBlogPosts: () => apiFetch<{ items: BlogPost[] }>("/api/admin/blog"),
  createBlogPost: (payload: Record<string, unknown>) =>
    apiFetch<{ item: BlogPost }>("/api/admin/blog", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateBlogPost: (id: string, payload: Record<string, unknown>) =>
    apiFetch<{ item: BlogPost }>(`/api/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteBlogPost: (id: string) =>
    apiFetch<void>(`/api/admin/blog/${id}`, {
      method: "DELETE"
    }),
  listReviews: (params = new URLSearchParams()) =>
    apiFetch<{ items: AdminReview[] }>(`/api/admin/resenas?${params.toString()}`),
  listReportedReviews: () => apiFetch<{ items: AdminReview[] }>("/api/admin/resenas/reportadas"),
  createReviewReply: (reviewId: string, contenido: string) =>
    apiFetch<{ item: ReviewReply }>(`/api/admin/resenas/${reviewId}/respuesta`, {
      method: "POST",
      body: JSON.stringify({ contenido })
    }),
  updateReviewReply: (reviewId: string, contenido: string) =>
    apiFetch<{ item: ReviewReply }>(`/api/admin/resenas/${reviewId}/respuesta`, {
      method: "PUT",
      body: JSON.stringify({ contenido })
    }),
  deleteReviewReply: (reviewId: string) =>
    apiFetch<void>(`/api/admin/resenas/${reviewId}/respuesta`, {
      method: "DELETE"
    }),
  verifyReview: (reviewId: string) =>
    apiFetch<{ item: AdminReview }>(`/api/admin/resenas/${reviewId}/verificar`, {
      method: "PUT"
    }),
  deleteReview: (reviewId: string) =>
    apiFetch<void>(`/api/admin/resenas/${reviewId}`, {
      method: "DELETE"
    }),
  dismissReports: (reviewId: string) =>
    apiFetch<{ message: string }>(`/api/admin/resenas/${reviewId}/reportes`, {
      method: "DELETE"
    })
};
