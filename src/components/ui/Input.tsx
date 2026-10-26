import { cn } from "@/lib/utils";
import React, { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150",
            "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/30"
              : "border-slate-300 dark:border-slate-700 focus:border-brand-500 focus:ring-brand-500/20",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
