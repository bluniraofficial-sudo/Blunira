"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  spinnerSize?: number;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/10",
  secondary:
    "bg-[#1c1f2a] hover:bg-[#272b38] border border-white/5 text-gray-300",
  danger:
    "bg-red-950/20 hover:bg-red-900/30 border border-red-950/40 text-red-400 hover:text-red-300",
  ghost:
    "bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200",
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      loading = false,
      spinnerSize = 16,
      variant = "primary",
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-bold rounded-xl text-xs
          transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-[0.98]
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";