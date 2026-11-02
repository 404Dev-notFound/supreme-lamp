"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Layers,
  Sparkles,
  Zap,
  Layout,
  Server,
  Cpu,
  Bot,
  Box,
  Network,
  Terminal,
  ShieldCheck,
  Code2,
  Lock,
  Binary,
  Database,
} from "lucide-react";

const ICON_MAP = {
  Layout,
  Server,
  Layers,
  Cpu,
  Bot,
  Code2,
  Terminal,
  GitBranch: Layers,
  Box,
  Network,
  FileCode: Code2,
  FileJson: Code2,
  Zap,
  ShieldCheck,
  Sparkles,
  Compass: Sparkles,
  Binary,
  Database,
};

export default function DevRoadmapCard({ roadmap, onLockedClick = null }) {
  if (!roadmap) return null;

  const isPremiumTrack =
    roadmap.isPremium ||
    roadmap.accessLevel === "PREMIUM" ||
    roadmap.badge === "PREMIUM";

  const isLocked = Boolean(roadmap.isLocked);

  const IconComponent =
    (roadmap.iconName && ICON_MAP[roadmap.iconName]) || Sparkles;

  const categoryColor = isPremiumTrack
    ? "border-orange-500/40 text-amber-200 bg-orange-500/15"
    : {
        role: "border-blue-400/40 text-blue-300 bg-blue-500/15",
        skill: "border-purple-400/40 text-purple-300 bg-purple-500/15",
        "best-practice":
          "border-emerald-400/40 text-emerald-300 bg-emerald-500/15",
      }[roadmap.category || "skill"] ||
      "border-zinc-400/40 text-zinc-300 bg-zinc-500/15";

  const levelColor =
    {
      Beginner: "text-emerald-300 font-medium",
      Intermediate: "text-amber-300 font-medium",
      Advanced: "text-rose-300 font-medium",
    }[roadmap.level || "Intermediate"] || "text-amber-300 font-medium";

  const handleClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      if (onLockedClick) {
        const rect = e.currentTarget.getBoundingClientRect();
        onLockedClick(roadmap, rect);
      }
    }
  };

  const cardStyle = isPremiumTrack
    ? "bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-orange-950/20 border-orange-500/35 hover:border-orange-500/70 shadow-lg shadow-orange-950/30 hover:shadow-orange-500/15"
    : "glass-card border-white/15 hover:border-orange-500/40 hover:shadow-orange-500/5";

  return (
    <Link
      href={`/roadmaps/${roadmap.slug}`}
      onClick={handleClick}
      className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden cursor-pointer ${cardStyle}`}
    >
      {/* Ambient background glow */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
          isPremiumTrack
            ? "bg-orange-500/15 group-hover:bg-orange-500/25"
            : "bg-orange-500/5 group-hover:bg-orange-500/15"
        }`}
      />

      <div>
        {/* Top Header: Icon & Category Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${
              isPremiumTrack
                ? "bg-orange-500/15 border border-orange-500/30 text-orange-400 group-hover:border-orange-500/50"
                : "bg-white/5 border border-white/10 text-orange-400 group-hover:border-orange-500/30"
            }`}
          >
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2">
            {isPremiumTrack && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-orange-500/40 text-amber-300 bg-orange-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-orange-400" />
                PREMIUM
              </span>
            )}
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryColor}`}
            >
              {roadmap.category}
            </span>
          </div>
        </div>

        {/* Title row with Lock Icon opposite resource name */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className={`text-lg font-bold transition-colors tracking-tight ${
              isPremiumTrack
                ? "text-white group-hover:text-amber-300"
                : "text-white group-hover:text-amber-300"
            }`}
          >
            {roadmap.title}
          </h3>

          {isLocked && (
            <div
              title="Locked - Premium Membership Required"
              className="mt-0.5 p-1 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0 group-hover:bg-orange-500/30 group-hover:scale-110 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <p className="text-sm text-zinc-300 line-clamp-2 mb-6 leading-relaxed font-normal">
          {roadmap.description}
        </p>
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <strong className="text-white font-semibold">
              {roadmap.topicCount || roadmap.topicsCount || 0}
            </strong>{" "}
            topics
          </span>
          <span className="text-zinc-400">•</span>
          <span className={levelColor}>{roadmap.level || "Intermediate"}</span>
        </div>

        {isLocked ? (
          <span className="flex items-center gap-1 font-semibold text-amber-300 group-hover:text-orange-300 transition-colors">
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            Unlock
          </span>
        ) : (
          <span className="flex items-center gap-1 font-semibold text-orange-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  );
}
