import { cn } from "@/lib/utils";

type BadgeProps = {
  label: string;
  color?: string;
  className?: string;
};

const labelMap: Record<string, string> = {
  NUEVO: "Nuevo",
  OFERTA: "Oferta",
  MAS_VENDIDO: "Más Vendido",
  EXCLUSIVO: "Exclusivo",
  TEMPORADA: "Temporada",
  PROXIMAMENTE: "Próximamente",
  AGOTADO: "Agotado",
  POCAS_UNIDADES: "Pocas Unidades"
};

const formatLabel = (label: string) =>
  labelMap[label] ??
  label
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;

  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
};

export const Badge = ({ label, color, className }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold leading-none tracking-normal",
      className
    )}
    style={
      (() => {
        const badgeColor = color ?? "#111827";
        const { r, g, b } = hexToRgb(badgeColor);

        return {
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
          borderColor: `rgba(${r}, ${g}, ${b}, 0.18)`,
          color: badgeColor
        };
      })()
    }
  >
    {formatLabel(label)}
  </span>
);
