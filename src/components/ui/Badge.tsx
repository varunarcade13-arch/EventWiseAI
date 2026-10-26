import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "brand" | "purple";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = "neutral",
  size = "sm",
  ...props
}) => {
  const variantStyles = {
    neutral:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700",
    success:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700",
    warning:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-700",
    danger:
      "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-700",
    brand:
      "bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-700",
    purple:
      "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
