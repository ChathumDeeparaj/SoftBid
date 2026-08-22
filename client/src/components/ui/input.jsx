import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-white/8 bg-luxury-800 px-4 py-2 text-sm text-ivory placeholder:text-ivory-subtle/50",
      "transition-all duration-200 outline-none",
      "focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
