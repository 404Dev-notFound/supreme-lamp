import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function JobMatcherSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl glass-card border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-5 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-16 h-4 rounded" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="space-y-1 text-right">
              <Skeleton className="w-16 h-4 rounded ml-auto" />
              <Skeleton className="w-24 h-2 rounded-full" />
            </div>
            <Skeleton className="w-24 h-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default JobMatcherSkeleton;
