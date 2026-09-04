import React from "react";
import { cn } from "@/lib/utils";

/**
 * Universal Glassmorphic Skeleton Primitive
 * Uses flowCTRL warm orange/amber gradient shimmer and glass frosted styling.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/5 border border-white/5 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export default Skeleton;
