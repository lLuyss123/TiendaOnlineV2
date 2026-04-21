import type { PropsWithChildren } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusNoticeProps = PropsWithChildren<{
  tone?: "info" | "success" | "error";
  loading?: boolean;
  className?: string;
}>;

export const StatusNotice = ({
  children,
  tone = "info",
  loading = false,
  className
}: StatusNoticeProps) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    aria-live="polite"
    className={cn(
      "flex items-start gap-3 rounded-[1.35rem] border px-4 py-3 text-sm",
      tone === "info" &&
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200",
      tone === "success" &&
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
      tone === "error" &&
        "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200",
      className
    )}
  >
    {loading ? (
      <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />
    ) : tone === "success" ? (
      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
    ) : tone === "error" ? (
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
    ) : (
      <Info size={16} className="mt-0.5 shrink-0" />
    )}
    <p className="leading-6">{children}</p>
  </div>
);
