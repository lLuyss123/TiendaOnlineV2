import { Permission } from "@prisma/client";

export const COOKIE_NAME = "sportstore_session";
export const DEFAULT_PAGE_SIZE = 12;
export const SHIPPING_FLAT_RATE = 18000;
export const LOW_STOCK_THRESHOLD = 5;

export const editablePermissions: Permission[] = [
  Permission.VER_PRODUCTOS,
  Permission.CREAR_PRODUCTOS,
  Permission.EDITAR_PRODUCTOS,
  Permission.VER_ORDENES,
  Permission.GESTIONAR_ORDENES,
  Permission.VER_USUARIOS,
  Permission.GESTIONAR_BLOG,
  Permission.GESTIONAR_CUPONES,
  Permission.GESTIONAR_RESENAS,
  Permission.ELIMINAR_RESENAS
];

export const tagPalette = {
  NUEVO: { color: "#10b981", icono: "sparkles" },
  OFERTA: { color: "#ef4444", icono: "badge-percent" },
  MAS_VENDIDO: { color: "#d8a63f", icono: "flame" },
  EXCLUSIVO: { color: "#8b5cf6", icono: "crown" },
  TEMPORADA: { color: "#3b82f6", icono: "snowflake" },
  PROXIMAMENTE: { color: "#374151", icono: "clock-3" },
  AGOTADO: { color: "#9ca3af", icono: "ban" },
  POCAS_UNIDADES: { color: "#f97316", icono: "alert-triangle" }
} as const;
