import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    fullWidth?: boolean;
  }
>;

export const Button = ({
  children,
  className,
  variant = "primary",
  fullWidth,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60",
      variant === "primary" &&
        "bg-ember text-white shadow-glow hover:bg-orange-500 dark:bg-ember dark:text-white",
      variant === "secondary" &&
        "border border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
      variant === "ghost" &&
        "text-slate-700 hover:bg-slate-200/70 dark:text-white dark:hover:bg-white/10",
      variant === "danger" && "bg-red-500 text-white hover:bg-red-600",
      fullWidth && "w-full",
      className
    )}
    {...props}
  >
    {children}
  </button>
);
