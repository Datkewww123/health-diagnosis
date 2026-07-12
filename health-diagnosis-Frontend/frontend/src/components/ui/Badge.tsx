import React, { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "primary",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none",
        {
          "bg-primary-light/10 text-primary-light dark:bg-primary-dark/20 dark:text-primary-light": variant === "primary",
          "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200": variant === "secondary",
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400": variant === "success",
          "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400": variant === "danger",
          "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400": variant === "warning",
          "border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
};

export default Badge;
