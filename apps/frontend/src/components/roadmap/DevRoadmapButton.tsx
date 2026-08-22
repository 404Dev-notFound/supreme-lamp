"use client";

import React from "react";
import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";

interface DevRoadmapButtonProps {
  href?: string;
  className?: string;
  variant?: "primary" | "secondary" | "glow";
  size?: "sm" | "md" | "lg";
}

export default function DevRoadmapButton({
  href = "/roadmaps",
  className = "",
  variant = "glow",
  size = "md",
}: DevRoadmapButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-4 text-base gap-2.5",
  };

  const baseStyle =
    "relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 group overflow-hidden cursor-pointer select-none";

  if (variant === "glow") {
    return (
      <Link
        href={href}
        aria-label="Explore Developer Roadmaps"
        className={`${baseStyle} ${sizeClasses[size]} bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-primary/20 hover:from-amber-500/30 hover:to-primary/30 border border-orange-500/40 text-amber-200 hover:text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 ${className}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-amber-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Compass className="w-4 h-4 text-orange-400 group-hover:rotate-45 transition-transform duration-500" />
        <span className="relative z-10 font-semibold tracking-tight">
          Explore Dev Roadmaps
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/30 border border-orange-400/40 text-orange-300 ml-1">
          <Sparkles className="w-2.5 h-2.5 mr-0.5" /> 90+ Paths
        </span>
      </Link>
    );
  }

  if (variant === "primary") {
    return (
      <Link
        href={href}
        aria-label="Explore Developer Roadmaps"
        className={`${baseStyle} ${sizeClasses[size]} bg-white text-black hover:bg-zinc-200 shadow-md ${className}`}
      >
        <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
        <span className="font-semibold">Dev Roadmaps</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label="Explore Developer Roadmaps"
      className={`${baseStyle} ${sizeClasses[size]} glass border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 hover:bg-white/5 ${className}`}
    >
      <Compass className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:rotate-45 transition-transform duration-500" />
      <span>Dev Roadmaps</span>
    </Link>
  );
}
