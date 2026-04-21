import type { InputHTMLAttributes, JSX, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  error?: string;
};

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    textarea: true;
  };

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    textarea?: false;
  };

export function Input(props: TextareaProps): JSX.Element;
export function Input(props: InputProps): JSX.Element;
export function Input({ label, error, textarea, className, ...props }: TextareaProps | InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {textarea ? (
        <textarea
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={cn(
            "min-h-[120px] rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-ember dark:border-white/10 dark:bg-white/5 dark:text-white",
            className
          )}
        />
      ) : (
        <input
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
          className={cn(
            "rounded-full border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-ember dark:border-white/10 dark:bg-white/5 dark:text-white",
            className
          )}
        />
      )}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
