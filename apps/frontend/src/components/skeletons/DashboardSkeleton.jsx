import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen text-zinc-100 font-sans pb-24 animate-pulse">
      {/* Top Navbar Skeleton */}
      <div className="h-16 px-6 glass border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-6 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="pt-28 pb-16 px-6 max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
        <Skeleton className="w-64 h-7 rounded-full" />
        <Skeleton className="w-full max-w-2xl h-14 rounded-2xl" />
        <Skeleton className="w-full max-w-lg h-6 rounded-lg" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="w-36 h-11 rounded-full" />
          <Skeleton className="w-36 h-11 rounded-full" />
        </div>
      </div>

      {/* Main Feature Cards Skeleton */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl glass-card border border-white/10 space-y-4 h-[200px]"
          >
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="w-3/4 h-6 rounded" />
            <Skeleton className="w-full h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardSkeleton;
