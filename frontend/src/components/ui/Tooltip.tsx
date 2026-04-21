import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type TooltipProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    label: string;
  }
>;

export const Tooltip = ({ children, className, label, ...props }: TooltipProps) => (
  <div className={cn("group/tooltip relative inline-flex", className)} {...props}>
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-xl transition duration-200 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0 group-focus-within/tooltip:opacity-100 dark:bg-white dark:text-slate-950"
    >
      {label}
    </span>
  </div>
);
