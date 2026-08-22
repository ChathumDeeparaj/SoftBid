import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gold-gradient text-luxury-950 shadow-gold-sm hover:shadow-gold hover:brightness-110",
        destructive:
          "bg-danger/10 text-red-400 border border-red-500/30 hover:bg-danger/20 hover:border-red-500/50",
        outline:
          "border border-gold-500/30 bg-transparent text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/60 hover:text-gold-300",
        secondary:
          "bg-luxury-800 text-ivory border border-white/5 hover:bg-luxury-700 hover:border-white/10",
        ghost:
          "text-ivory-subtle hover:bg-luxury-800 hover:text-ivory",
        link:
          "text-gold-400 underline-offset-4 hover:underline hover:text-gold-300",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-12 rounded-lg px-8 text-base",
        xl:      "h-14 rounded-xl px-10 text-base font-bold",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
