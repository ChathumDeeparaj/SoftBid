import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-white/8 bg-luxury-800 px-4 py-3 text-sm text-ivory placeholder:text-ivory-subtle/50",
      "transition-all duration-200 outline-none resize-none",
      "focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
