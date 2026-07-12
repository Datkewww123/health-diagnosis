import React, { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light/40 focus:border-primary-light transition-all disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-950 text-slate-900 dark:text-slate-100",
              {
                "pl-11": !!icon,
                "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500": !!error,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-rose-500 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
