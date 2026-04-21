import clsx, { type ClassValue } from "clsx";

import type { ProductImage } from "@/types/api";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const currency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);

export const dateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(value))
    : "";

export const relativeTime = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, "month");
  }

  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, "year");
};

export const fitLabel = (value?: string | null) => {
  if (!value) {
    return "";
  }

  if (value.toLowerCase().startsWith("peq")) {
    return "Pequeno";
  }

  if (value.toLowerCase().startsWith("gra")) {
    return "Grande";
  }

  return "Exacto";
};

export const getVisibleProductImages = (
  images: ProductImage[],
  options?: {
    includeHiddenFallback?: boolean;
  }
) => {
  const visibleImages = images.filter((image) => image.visible !== false);

  if (visibleImages.length > 0) {
    return visibleImages;
  }

  return options?.includeHiddenFallback ? images : [];
};

export const getPrimaryProductImage = (
  images: ProductImage[],
  options?: {
    includeHiddenFallback?: boolean;
  }
) => {
  const candidateImages = getVisibleProductImages(images, options);
  return candidateImages.find((image) => image.esPortada) ?? candidateImages[0];
};
