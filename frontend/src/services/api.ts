import type { ApiErrorShape } from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  errors?: unknown;

  constructor(message: string, status: number, payload?: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = payload?.details;
    this.errors = payload?.errors;
  }
}

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers ?? {});
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body !== undefined && init?.body !== null;

  if (!isFormData && hasBody && method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers,
    ...init
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => ({}))) as ApiErrorShape;

  if (!response.ok) {
    throw new ApiError(data.message || "Ocurrió un error en la solicitud", response.status, data);
  }

  return data as T;
};
