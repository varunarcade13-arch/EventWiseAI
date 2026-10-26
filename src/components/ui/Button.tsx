import { cn } from "@/lib/utils";
import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "ai";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3.5 gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-brand-600 hover:bg-brand-700 text-white shadow-sm focus-visible:ring-brand-500",
      secondary:
        "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-transparent dark:border-slate-700 focus-visible:ring-slate-400",
      outline:
        "border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-600 dark:hover:bg-slate-800 dark:text-slate-100 focus-visible:ring-brand-500",
      ghost:
        "hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:ring-brand-500",
      danger:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
      ai: "bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-600 hover:from-brand-700 hover:via-indigo-700 hover:to-accent-700 text-white shadow-glow hover:shadow-lg focus-visible:ring-brand-500",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
