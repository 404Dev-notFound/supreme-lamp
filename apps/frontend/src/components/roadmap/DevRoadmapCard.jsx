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
};

export default function DevRoadmapCard({ roadmap }) {
  if (!roadmap) return null;

  const IconComponent =
    (roadmap.iconName && ICON_MAP[roadmap.iconName]) || Sparkles;

  const categoryColor =
    {
      role: "border-blue-500/30 text-blue-400 bg-blue-500/10",
      skill: "border-purple-500/30 text-purple-400 bg-purple-500/10",
      "best-practice":
        "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    }[roadmap.category || "skill"] ||
    "border-zinc-500/30 text-zinc-400 bg-zinc-500/10";

  const levelColor =
    {
      Beginner: "text-emerald-400",
      Intermediate: "text-amber-400",
      Advanced: "text-rose-400",
    }[roadmap.level || "Intermediate"] || "text-amber-400";

  return (
    <Link
      href={`/roadmaps/${roadmap.slug}`}
      className="group relative flex flex-col justify-between p-6 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-1 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-all duration-500 pointer-events-none" />

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-orange-500/30 transition-all duration-300 text-orange-400">
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryColor}`}
            >
              {roadmap.category}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors mb-2 tracking-tight">
          {roadmap.title}
        </h3>

        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 leading-relaxed">
          {roadmap.description}
        </p>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
            <strong className="text-zinc-200">{roadmap.topicCount}</strong>{" "}
            topics
          </span>
          <span className="text-zinc-600">•</span>
          <span className={levelColor}>{roadmap.level}</span>
        </div>

        <span className="flex items-center gap-1 font-semibold text-orange-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
