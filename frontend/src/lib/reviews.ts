import type { ReviewFilters, User } from "@/types/api";

const avatarPalette = [
  { background: "#ffe4d6", foreground: "#c2410c" },
  { background: "#dcfce7", foreground: "#047857" },
  { background: "#dbeafe", foreground: "#1d4ed8" },
  { background: "#fce7f3", foreground: "#be185d" },
  { background: "#ede9fe", foreground: "#6d28d9" },
  { background: "#fef3c7", foreground: "#b45309" }
];

const hashString = (value: string) =>
  value.split("").reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);

export const reviewAvatarColors = (seed: string) => avatarPalette[hashString(seed) % avatarPalette.length];

export const reviewMaskedName = (fullName: string) => {
  const [firstName = "Cliente", ...rest] = fullName.trim().split(/\s+/);
  const surnameInitial = rest[0]?.charAt(0).toUpperCase();
  return surnameInitial ? `${firstName} ${surnameInitial}.` : firstName;
};

export const reviewInitials = (fullName: string) => {
  const [firstName = "C", secondName = ""] = fullName.trim().split(/\s+/);
  return `${firstName.charAt(0)}${secondName.charAt(0)}`.toUpperCase();
};

export const ratingLabel = (value: number) => {
  switch (value) {
    case 1:
      return "Muy mala";
    case 2:
      return "Mala";
    case 3:
      return "Regular";
    case 4:
      return "Buena";
    case 5:
      return "Excelente";
    default:
      return "Selecciona una calificacion";
  }
};

export const fitDisplayLabel = (value?: string | null) => {
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

export const filtersSummary = (filters: ReviewFilters, total: number) => {
  const parts = [`Mostrando ${total} resenas`];

  if (filters.estrellas) {
    parts.push(`con ${"★".repeat(filters.estrellas)}`);
  }

  if (filters.tipo === "fotos") {
    parts.push("con fotos");
  }

  if (filters.tipo === "verificadas") {
    parts.push("verificadas");
  }

  if (filters.ajuste) {
    parts.push(`ajuste ${fitDisplayLabel(filters.ajuste)}`);
  }

  return parts.join(" ");
};

export const buildOptimisticReviewUser = (user: User) => ({
  id: user.id,
  nombre: reviewMaskedName(user.nombre),
  nombreCompleto: user.nombre,
  iniciales: reviewInitials(user.nombre),
  avatarColor: reviewAvatarColors(user.id)
});
