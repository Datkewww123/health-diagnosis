import React, { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
          {
            // Variants
            "bg-primary text-white hover:bg-primary-hover shadow-sm": variant === "primary",
            "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700": variant === "secondary",
            "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300": variant === "ghost",
            "bg-danger text-white hover:bg-danger-dark shadow-sm": variant === "danger",
            "bg-success text-white hover:bg-success-dark shadow-sm": variant === "success",
            "border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300": variant === "outline",
            
            // Sizes
            "text-xs px-3 py-1.5 rounded-sm": size === "sm",
            "text-sm px-4 py-2.5 rounded-md": size === "md",
            "text-base px-5 py-3 rounded-xl": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
