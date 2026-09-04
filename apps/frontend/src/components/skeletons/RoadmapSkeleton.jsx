import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function RoadmapGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col justify-between h-[220px]"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="w-3/4 h-6 rounded-lg mb-2" />
            <Skeleton className="w-full h-4 rounded mb-1.5" />
            <Skeleton className="w-4/5 h-4 rounded" />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoadmapDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="p-8 rounded-3xl glass-card border border-white/10 flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="space-y-3 max-w-xl w-full">
          <div className="flex gap-2">
            <Skeleton className="w-24 h-6 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-full" />
          </div>
          <Skeleton className="w-3/4 h-10 rounded-xl" />
          <Skeleton className="w-full h-5 rounded" />
        </div>
        <Skeleton className="w-64 h-24 rounded-2xl shrink-0" />
      </div>

      <div className="p-8 rounded-3xl glass-card border border-white/10 h-[450px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
          <Skeleton className="w-48 h-5 rounded mx-auto" />
          <Skeleton className="w-32 h-4 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default RoadmapGridSkeleton;
