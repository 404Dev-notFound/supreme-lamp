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
  Clock,
  Sparkles,
  Layers,
  Target,
  ArrowRight,
  Code2,
  CheckSquare,
  GraduationCap,
  Bookmark,
  Share2,
} from "lucide-react";

export default function RoadmapStepDrawer({
  step,
  isOpen,
  onClose,
  status = "not_started",
  onUpdateStatus,
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

  if (!isOpen || !step) return null;

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "advanced":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "intermediate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "video":
        return <Video className="w-4 h-4 text-rose-400 shrink-0" />;
      case "course":
        return <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />;
      case "article":
      case "doc":
      case "documentation":
        return <FileText className="w-4 h-4 text-sky-400 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  const recommendedCourses = step.recommendedCourses || [];
  const referenceLinks = step.referenceLinks || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-2xl h-full bg-zinc-950/95 border-l border-white/10 p-6 md:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl z-10 space-y-6">
        <div>
          {/* Top Bar: Navigation, Close & Progress Controls */}
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                {step.stageName || `Stage ${step.stageIndex + 1}`}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium border ${getDifficultyBadge(
                  step.difficulty
                )}`}
              >
                {step.difficulty || "Beginner"}
              </span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Title & Estimated Effort */}
          <div className="mt-6 space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {step.topic}
            </h2>
            {step.estimatedEffort && (
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>Estimated Time: {step.estimatedEffort}</span>
              </div>
            )}
          </div>

          {/* Section 8: Interactive Progress Tracking Selector */}
          <div className="mt-5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2 font-semibold">
              Step Progress Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus(step.id, "not_started")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === "not_started"
                    ? "bg-zinc-800 text-white border-zinc-500 shadow-md"
                    : "bg-transparent text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
                }`}
              >
                <Circle className="w-3.5 h-3.5" />
                <span>Not Started</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus(step.id, "in_progress")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === "in_progress"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10"
                    : "bg-transparent text-zinc-400 border-white/5 hover:text-amber-300 hover:bg-white/5"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>In Progress</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateStatus(step.id, "completed")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === "completed"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                    : "bg-transparent text-zinc-400 border-white/5 hover:text-emerald-300 hover:bg-white/5"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Completed</span>
              </button>
            </div>
          </div>

          {/* Section: Why This Step Matters */}
          {step.whyItMatters && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                <Target className="w-4 h-4 text-orange-400" />
                <span>Why This Step Matters</span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {step.whyItMatters}
              </p>
            </div>
          )}

          {/* Section: What You Will Learn */}
          {step.whatYouWillLearn && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>What You Will Learn</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                {step.whatYouWillLearn}
              </p>
            </div>
          )}

          {/* Section: Prerequisites */}
          {step.prerequisites && step.prerequisites.length > 0 && (
            <div className="mt-6 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Prerequisites Required
              </span>
              <div className="flex flex-wrap gap-2">
                {step.prerequisites.map((prereq, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900 border border-white/10 text-zinc-300"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Recommended Courses (From 90+ Resource Collection) */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
                <GraduationCap className="w-4 h-4 text-orange-400" />
                <span>Recommended Resources ({recommendedCourses.length})</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Grounded in 101 structured curricula
              </span>
            </div>

            {recommendedCourses.length > 0 ? (
              <div className="space-y-2.5">
                {recommendedCourses.map((course, idx) => (
                  <div
                    key={course.id || idx}
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-orange-500/30 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-0.5">
                          {getResourceIcon(course.type)}
                        </div>
                        <div>
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5"
                          >
                            <span>{course.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          </a>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-orange-400 uppercase">
                              {course.provider || "Official Curriculum"}
                            </span>
                            <span className="text-[11px] text-zinc-500">•</span>
                            <span className="text-[11px] font-mono text-zinc-400 capitalize">
                              {course.type || "Resource"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 hover:bg-orange-500 hover:text-white text-zinc-300 border border-white/10 transition-all shrink-0 cursor-pointer"
                      >
                        Open Resource
                      </a>
                    </div>

                    {course.whyRecommended && (
                      <p className="mt-2 text-xs text-zinc-400 italic pl-10 border-l border-white/5 ml-1">
                        "{course.whyRecommended}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 text-center">
                No specific single resource listed for this step. Explore the verified documentation links below.
              </div>
            )}
          </div>

          {/* Section: Reference Links */}
          {referenceLinks.length > 0 && (
            <div className="mt-6 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                Verified Reference Documentation
              </span>
              <div className="space-y-1.5">
                {referenceLinks.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all group"
                  >
                    <span className="truncate max-w-md font-mono">{url}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Section: Practical Application */}
          {step.practicalApplication && (
            <div className="mt-6 p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span>Practical Application Project</span>
              </div>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-normal">
                {step.practicalApplication}
              </p>
            </div>
          )}

          {/* Section: Completion Criteria */}
          {step.completionCriteria && (
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Completion Criteria</span>
              </div>
              <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
                {step.completionCriteria}
              </p>
            </div>
          )}

          {/* Section: Next Recommended Step */}
          {step.nextStep && (
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-orange-950/20 to-zinc-950 border border-orange-500/20 flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 block font-semibold">
                  Next Learning Milestone
                </span>
                <p className="text-xs md:text-sm font-semibold text-white mt-0.5">
                  {step.nextStep}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>flowCTRL • Career Operating System</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
