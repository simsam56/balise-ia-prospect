"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black hover:bg-zinc-200 border border-white",
  secondary:
    "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
  ghost:
    "bg-transparent text-zinc-200 border border-transparent hover:bg-zinc-800",
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "secondary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:cursor-not-allowed disabled:opacity-50",
          variantClass[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
