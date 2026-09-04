"use client";

import React, { useEffect } from "react";
import {
  X,
  ExternalLink,
  BookOpen,
  Video,
  FileText,
  CheckCircle2,
  Circle,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function DevRoadmapTopicDrawer({
  topic,
  isOpen,
  onClose,
  isCompleted,
  onToggleComplete,
  roadmapSlug,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !topic) return null;

  const getResourceIcon = (type) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-rose-400 shrink-0" />;
      case "course":
        return <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />;
      case "doc":
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl h-full bg-zinc-950/95 border-l border-white/10 p-6 md:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl z-10">
        <div>
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
            <button
              onClick={() => onToggleComplete(topic.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/25"
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mastered</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  <span>Mark as Done</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Header */}
          <div className="mt-6">
            <span className="text-xs uppercase tracking-widest font-semibold text-orange-400 mb-2 block">
              Topic Curriculum
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {topic.title}
            </h2>
          </div>

          {/* Description */}
          <div className="mt-6 text-sm md:text-base text-zinc-300 leading-relaxed bg-white/5 p-5 rounded-xl border border-white/5">
            {topic.description}
          </div>

          {/* Learning Resources */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Handpicked Learning Resources
              </h3>
              <span className="text-xs text-zinc-500">
                {topic.resources?.length || 0} available
              </span>
            </div>

            {topic.resources && topic.resources.length > 0 ? (
              <div className="space-y-2.5">
                {topic.resources.map((res) => (
                  <a
                    key={res.id || res.url}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-orange-500/40 hover:bg-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        {getResourceIcon(res.type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                          {res.title}
                        </p>
                        <span className="text-[11px] capitalize text-zinc-500">
                          {res.type}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic py-4">
                No direct resource links attached. Refer to official community
                documentation.
              </p>
            )}
          </div>
        </div>

        {/* Footer info & attribution */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>FlowCTRL Career Engine</span>
          <a
            href={`https://roadmap.sh/${roadmapSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-orange-400/80 hover:text-orange-300 transition-colors"
          >
            Original Curriculum at roadmap.sh{" "}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
