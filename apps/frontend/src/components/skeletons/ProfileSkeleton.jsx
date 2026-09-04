import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-48 h-6 rounded" />
          <Skeleton className="w-36 h-4 rounded" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>

      <div className="space-y-2">
        <Skeleton className="w-28 h-4 rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-20 h-7 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
