import type {
  BlogPost,
  MyReviewResponse,
  PaginatedResponse,
  Product,
  Review,
  ReviewFilters,
  ReviewListResponse
} from "@/types/api";

import { apiFetch } from "./api";

const toReviewFormData = (payload: {
  calificacion: number;
  titulo: string;
  comentario: string;
  ajuste?: string;
  comodidad?: number;
  fotos?: File[];
  existingPhotoIds?: string[];
}) => {
  const formData = new FormData();
  formData.append("calificacion", String(payload.calificacion));
  formData.append("titulo", payload.titulo);
  formData.append("comentario", payload.comentario);

  if (payload.ajuste) {
    formData.append("ajuste", payload.ajuste);
  }

  if (payload.comodidad) {
    formData.append("comodidad", String(payload.comodidad));
  }

  if (payload.existingPhotoIds) {
    formData.append("existingPhotoIds", JSON.stringify(payload.existingPhotoIds));
  }

  payload.fotos?.forEach((file) => {
    formData.append("fotos", file);
  });

  return formData;
};

export const shopService = {
  listProducts: (params = new URLSearchParams()) =>
    apiFetch<PaginatedResponse<Product>>(`/api/productos?${params.toString()}`),
  getProduct: (id: string) => apiFetch<{ item: Product }>(`/api/productos/${id}`),
  getRelatedProducts: (id: string) => apiFetch<{ items: Product[] }>(`/api/productos/${id}/relacionados`),
  listReviews: (id: string, filters = new URLSearchParams()) =>
    apiFetch<ReviewListResponse>(`/api/productos/${id}/resenas?${filters.toString()}`),
  getMyReview: (id: string) => apiFetch<MyReviewResponse>(`/api/productos/${id}/resenas/mi-resena`),
  createReview: (
    id: string,
    payload: {
      calificacion: number;
      titulo: string;
      comentario: string;
      ajuste?: string;
      comodidad?: number;
      fotos?: File[];
    }
  ) =>
    apiFetch<{ item: Review; message: string }>(`/api/productos/${id}/resenas`, {
      method: "POST",
      body: toReviewFormData(payload)
    }),
  updateReview: (
    reviewId: string,
    payload: {
      calificacion: number;
      titulo: string;
      comentario: string;
      ajuste?: string;
      comodidad?: number;
      fotos?: File[];
      existingPhotoIds?: string[];
    }
  ) =>
    apiFetch<{ item: Review; message: string }>(`/api/resenas/${reviewId}`, {
      method: "PUT",
      body: toReviewFormData(payload)
    }),
  deleteReview: (reviewId: string) =>
    apiFetch<void>(`/api/resenas/${reviewId}`, {
      method: "DELETE"
    }),
  voteReview: (reviewId: string, util: boolean) =>
    apiFetch<{ message: string; item: { utiles: number; noUtiles: number; utilidad: number } }>(
      `/api/resenas/${reviewId}/voto`,
      {
        method: "POST",
        body: JSON.stringify({ util })
      }
    ),
  deleteReviewVote: (reviewId: string) =>
    apiFetch<{ message: string; item: { utiles: number; noUtiles: number; utilidad: number } }>(
      `/api/resenas/${reviewId}/voto`,
      {
        method: "DELETE"
      }
    ),
  reportReview: (
    reviewId: string,
    motivo: "Spam" | "Contenido inapropiado" | "Resena falsa" | "Otro"
  ) =>
    apiFetch<{ message: string; item: { hidden: boolean; reportCount: number } }>(
      `/api/resenas/${reviewId}/reportar`,
      {
        method: "POST",
        body: JSON.stringify({ motivo })
      }
    ),
  createStockAlert: (productId: string) =>
    apiFetch<{ message: string }>("/api/stock-alert", {
      method: "POST",
      body: JSON.stringify({ productId })
    }),
  validateCoupon: (payload: { codigo: string; subtotal: number }) =>
    apiFetch<{ item: { codigo: string; valor: number }; discount: number }>("/api/cupones/validar", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listBlogPosts: () => apiFetch<{ items: BlogPost[] }>("/api/blog"),
  getBlogPost: (id: string) => apiFetch<{ item: BlogPost }>(`/api/blog/${id}`)
};

export const reviewFilterToSearchParams = (filters: ReviewFilters & { page?: number; limit?: number }) => {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.estrellas) {
    params.set("estrellas", String(filters.estrellas));
  }

  if (filters.tipo) {
    params.set("tipo", filters.tipo);
  }

  if (filters.ajuste) {
    params.set("ajuste", filters.ajuste);
  }

  if (filters.orden) {
    params.set("orden", filters.orden);
  }

  if (filters.busqueda) {
    params.set("busqueda", filters.busqueda);
  }

  return params;
};
