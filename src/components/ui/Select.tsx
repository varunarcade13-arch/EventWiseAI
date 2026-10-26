import { cn } from "@/lib/utils";
import React, { forwardRef, SelectHTMLAttributes, useId } from "react";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, required, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || (label ? `${label.toLowerCase().replace(/\s+/g, "-")}-${generatedId}` : undefined);
    const errorId = error ? `${selectId || generatedId}-error` : undefined;
    const helperId = helperText ? `${selectId || generatedId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200"
          >
            {label}
            {required && (
              <span className="text-rose-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-required={required ? "true" : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150 cursor-pointer",
            "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900",
            error
              ? "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus-visible:ring-rose-500/30"
              : "border-slate-300 dark:border-slate-600 focus:border-brand-500 dark:focus:border-brand-400 focus-visible:ring-brand-500/20",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-rose-600 dark:text-rose-300 font-medium">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-300">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
