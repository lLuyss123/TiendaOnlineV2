import type { User } from "@/types/api";

import { apiFetch } from "./api";

export const authService = {
  me: () => apiFetch<{ user: User | null }>("/api/auth/me"),
  register: (payload: { nombre: string; email: string; password: string }) =>
    apiFetch<{ message: string; user: User }>("/api/auth/registro", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: { email: string; password: string }) =>
    apiFetch<{ message: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () =>
    apiFetch<{ message: string }>("/api/auth/logout", {
      method: "POST"
    }),
  verifyEmail: (token: string) => apiFetch<{ message: string }>(`/api/auth/verificar-email?token=${token}`),
  resendVerification: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/reenviar-verificacion", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  requestPasswordReset: (email: string) =>
    apiFetch<{ message: string }>("/api/auth/recuperar-contrasena", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  validateResetToken: (token: string) =>
    apiFetch<{ valid: boolean }>("/api/auth/validar-token-reset", {
      method: "POST",
      body: JSON.stringify({ token })
    }),
  resetPassword: (payload: { token: string; password: string; confirmPassword: string }) =>
    apiFetch<{ message: string }>("/api/auth/nueva-contrasena", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
