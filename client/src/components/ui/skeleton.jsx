import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-luxury-800",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
