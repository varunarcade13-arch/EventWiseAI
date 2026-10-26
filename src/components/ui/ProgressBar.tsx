import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "brand" | "emerald" | "amber" | "rose";
  size?: "sm" | "md" | "lg";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = "brand",
  size = "md",
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorStyles = {
    brand: "bg-brand-600 dark:bg-brand-500",
    emerald: "bg-emerald-600 dark:bg-emerald-500",
    amber: "bg-amber-500 dark:bg-amber-400",
    rose: "bg-rose-600 dark:bg-rose-500",
  };

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showPercentage && <span className="ml-auto">{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Planning progress"}
        className={cn(
          "w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
