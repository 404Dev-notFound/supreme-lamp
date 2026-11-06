"use client";

import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Sparkles,
  RotateCcw,
  LogIn,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function ProjectProgressTab({
  project,
  steps = [],
  userProgress,
  completedStepIds = new Set(),
  onToggleStepCompletion,
  onStartLearning,
  onResetProgress,
  onCompleteProject,
  authUser,
  isUpdating = false,
}) {
  const totalSteps = steps.length;
  const completedCount = completedStepIds.size;
  const percent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isCompleted = userProgress?.status === "COMPLETED" || (totalSteps > 0 && completedCount === totalSteps);

  const hoursRemaining = project.estimatedHours
    ? Math.max(1, Math.round(project.estimatedHours * (1 - percent / 100)))
    : 5;

  return (
    <div className="space-y-8">
      {/* 1. Progress Metric Card */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              <Sparkles className="w-4 h-4" />
              Learning Progress & Portfolio Tracking
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">
              {isCompleted
                ? "Project Completed! 🎉"
                : percent > 0
                ? "In Progress"
                : "Ready to Begin"}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {totalSteps > 0
                ? `${completedCount} of ${totalSteps} implementation steps completed (${percent}%)`
                : "Explore project resources and architecture blueprint."}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onStartLearning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
            >
              <Layers className="w-4 h-4" />
              {isCompleted ? "Review Build Guide" : "Go to Build Guide"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {authUser && !isCompleted && totalSteps > 0 && (
              <button
                type="button"
                onClick={onCompleteProject}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-medium text-xs hover:bg-emerald-500/20 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mark All Done
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Stats */}
        <div className="mt-6 space-y-4">
          <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted
                  ? "bg-emerald-400"
                  : "bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-zinc-500 font-mono block mb-1">
                STATUS
              </span>
              <span className="text-sm font-semibold text-zinc-200">
                {isCompleted ? "Completed" : percent > 0 ? "In Progress" : "Not Started"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-zinc-500 font-mono block mb-1">
                COMPLETED
              </span>
              <span className="text-sm font-semibold text-orange-400 font-mono">
                {completedCount} / {totalSteps}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-zinc-500 font-mono block mb-1">
                EST. TIME REMAINING
              </span>
              <span className="text-sm font-semibold text-zinc-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                ~{isCompleted ? 0 : hoursRemaining}h
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] text-zinc-500 font-mono block mb-1">
                ACCOUNT SYNC
              </span>
              <span className="text-sm font-semibold text-zinc-200">
                {authUser ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-xs">
                    <Check className="w-3.5 h-3.5" /> Synced
                  </span>
                ) : (
                  <span className="text-amber-400 text-xs">Guest Mode</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Mode Callout */}
      {!authUser && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">
                Exploring as a Guest User
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                You can freely read all build instructions, architecture diagrams, and view video walkthroughs. Sign in to save step milestones to your personal cloud profile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (window.location.href = "?modal=signin")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shrink-0 shadow-md"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In to Save
          </button>
        </div>
      )}

      {/* Step Milestone Checklist */}
      {totalSteps > 0 ? (
        <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              Step-by-Step Checklist
            </h3>
            <span className="text-xs text-zinc-500">
              Click a step to toggle completion
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((step) => {
              const isStepDone = completedStepIds.has(step.id);
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    isStepDone
                      ? "bg-emerald-500/[0.04] border-emerald-500/20 text-zinc-300"
                      : "bg-white/[0.02] border-white/5 hover:border-white/10 text-zinc-400"
                  }`}
                >
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onToggleStepCompletion(step.stepNumber, !isStepDone)}
                    className="mt-0.5 shrink-0 focus:outline-none"
                    aria-label={`Toggle step ${step.stepNumber}`}
                  >
                    {isStepDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-orange-400 font-semibold">
                        Step {step.stepNumber}
                      </span>
                      {isStepDone && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                    <h4
                      className={`text-sm font-semibold mb-1 ${
                        isStepDone ? "text-zinc-200 line-through opacity-80" : "text-zinc-100"
                      }`}
                    >
                      {step.title}
                    </h4>
                    {step.objective && (
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {step.objective}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60 text-center">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-200 mb-1">
            Self-Paced Project Exploration
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
            This project tutorial relies on verified external references, codebases, and video walkthroughs. You can explore the build guide and architecture tabs directly.
          </p>
          <button
            type="button"
            onClick={onStartLearning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-all"
          >
            Open Build Guide
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

