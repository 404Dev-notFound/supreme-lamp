import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function WellbeingSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="w-48 h-6 rounded" />
          <Skeleton className="w-72 h-4 rounded" />
        </div>
        <Skeleton className="w-24 h-8 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl glass border border-white/5 space-y-2"
          >
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-36 h-8 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
        <Skeleton className="w-40 h-5 rounded" />
        <Skeleton className="w-full h-32 rounded-xl" />
      </div>
    </div>
  );
}

export default WellbeingSkeleton;
