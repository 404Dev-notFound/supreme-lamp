import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ResumeScreenerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
          <Skeleton className="w-32 h-32 rounded-full mb-4" />
          <Skeleton className="w-36 h-6 rounded mb-2" />
          <Skeleton className="w-48 h-4 rounded" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="w-40 h-6 rounded" />
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
            <Skeleton className="w-36 h-6 rounded" />
            <Skeleton className="w-full h-8 rounded-lg" />
            <Skeleton className="w-full h-8 rounded-lg" />
            <Skeleton className="w-full h-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeScreenerSkeleton;
