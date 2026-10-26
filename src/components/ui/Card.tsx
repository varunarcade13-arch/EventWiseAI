import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient" | "outline";
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default:
      "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm",
    glass:
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-glass",
    gradient:
      "bg-gradient-to-br from-white to-brand-50/40 dark:from-slate-900 dark:to-brand-950/30 border border-brand-200/50 dark:border-brand-900/50 shadow-sm",
    outline:
      "bg-transparent border border-dashed border-slate-300 dark:border-slate-700",
  };

  return (
    <div
      className={cn("rounded-2xl p-5 transition-all duration-200", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn("flex items-center justify-between gap-4 mb-4", className)} {...props}>
    {children}
  </div>
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const CardTitle: React.FC<CardTitleProps> = ({
  className,
  children,
  as: Component = "h3",
  ...props
}) => (
  <Component className={cn("text-base font-semibold text-slate-900 dark:text-slate-100", className)} {...props}>
    {children}
  </Component>
);

export const CardDescription: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn("text-xs text-slate-500 dark:text-slate-400 mt-0.5", className)} {...props}>
    {children}
  </p>
);
