import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-gold-500/40 bg-gold-500/10 text-gold-400",
        gold:        "border-gold-500/60 bg-gold-500/15 text-gold-300",
        success:     "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
        warning:     "border-amber-500/40 bg-amber-500/10 text-amber-400",
        destructive: "border-red-500/40 bg-red-500/10 text-red-400",
        secondary:   "border-white/10 bg-white/5 text-ivory-subtle",
        outline:     "border-white/20 bg-transparent text-ivory",
        live:        "border-red-400/60 bg-red-400/10 text-red-400 animate-gold-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
