import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function GenericCardSkeleton({ count = 3, className = "" }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between h-[240px]"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <Skeleton className="w-3/4 h-6 rounded-lg mb-3" />
            <Skeleton className="w-full h-4 rounded mb-2" />
            <Skeleton className="w-5/6 h-4 rounded" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-16 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default GenericCardSkeleton;
