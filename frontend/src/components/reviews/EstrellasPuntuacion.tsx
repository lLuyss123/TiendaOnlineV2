import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const FilledStar = ({
  percent,
  className
}: {
  percent: number;
  className?: string;
}) => (
  <span className={cn("relative inline-flex", className)}>
    <Star className={cn("text-slate-300", className)} strokeWidth={1.75} />
    <span className="absolute inset-0 overflow-hidden" style={{ width: `${percent}%` }}>
      <Star className={cn("fill-[#ff6b3d] text-[#ff6b3d]", className)} strokeWidth={1.75} />
    </span>
  </span>
);

export const EstrellasPuntuacion = ({
  value,
  size = "md",
  interactive = false,
  onChange,
  onHoverChange,
  className
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  onHoverChange?: (value: number | null) => void;
  className?: string;
}) => {
  const sizeClass =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: 5 }, (_, index) => {
        const starIndex = index + 1;
        const fill = Math.max(0, Math.min(1, value - index)) * 100;

        if (!interactive) {
          return <FilledStar key={starIndex} percent={fill} className={sizeClass} />;
        }

        return (
          <button
            key={starIndex}
            type="button"
            className="rounded-full transition hover:scale-105"
            onMouseEnter={() => onHoverChange?.(starIndex)}
            onMouseLeave={() => onHoverChange?.(null)}
            onClick={() => onChange?.(starIndex)}
            aria-label={`Calificar con ${starIndex} estrellas`}
          >
            <FilledStar percent={fill > 0 ? 100 : 0} className={sizeClass} />
          </button>
        );
      })}
    </div>
  );
};
