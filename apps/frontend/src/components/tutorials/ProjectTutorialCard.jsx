"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Layers,
  Bookmark,
  ArrowRight,
  Database,
  GitBranch,
  Server,
  Code,
  Layout,
  Cpu,
  BrainCircuit,
  Network,
  Terminal,
  Search,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_ICONS = {
  databases: Database,
  "developer-tools": GitBranch,
  "web-servers": Server,
  "compilers-languages": Code,
  "frontend-frameworks": Layout,
  systems: Cpu,
  "ai-machine-learning": BrainCircuit,
  "distributed-systems": Network,
  "command-line-apps": Terminal,
  "search-engines": Search,
};

const DIFFICULTY_STYLES = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Advanced: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function ProjectTutorialCard({
  project,
  onToggleBookmark,
  isBookmarked = false,
}) {
  const IconComponent = CATEGORY_ICONS[project.categorySlug] || Terminal;
  const difficultyClass = DIFFICULTY_STYLES[project.difficulty] || DIFFICULTY_STYLES.Intermediate;
  const progress = project.userProgress;
  const isCompleted = progress?.status === "COMPLETED";
  const isInProgress = progress?.status === "IN_PROGRESS";

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl glass-card border border-white/10 bg-zinc-950/60 p-6 transition-all duration-300 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5">
      {/* Background ambient subtle glow on hover */}
      <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-full bg-orange-500/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-0 pointer-events-none" />

      <div>
        {/* Top Badges: Category, Language, Difficulty & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
              <IconComponent className="w-3.5 h-3.5 text-orange-400" />
              {project.categoryName || project.categorySlug}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {project.language}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${difficultyClass}`}>
              {project.difficulty}
            </span>
          </div>

          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleBookmark(project.id);
              }}
              title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>
          )}
        </div>

        {/* Title */}
        <Link href={`/project-tutorials/${project.slug}`} className="block group-hover:text-orange-400 transition-colors">
          <h3 className="text-lg font-semibold tracking-tight text-zinc-100 line-clamp-1 mb-2">
            {project.title}
          </h3>
        </Link>

        {/* Short Description */}
        <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed mb-4">
          {project.description}
        </p>

        {/* Tech Stack Pills */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[11px] text-zinc-500">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        {/* Progress Bar (if user has started this project) */}
        {progress && (
          <div className="mb-4 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Completed</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    In Progress
                  </>
                )}
              </span>
              <span className="text-zinc-400">
                {progress.completedStepCount} / {project.totalSteps || progress.totalStepCount} steps ({progress.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-orange-500 to-amber-400"
                }`}
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Info: Duration, Steps, CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            {project.estimatedHours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                ~{project.estimatedHours}h
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              {project.totalSteps} steps
            </span>
          </div>

          <Link
            href={`/project-tutorials/${project.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 text-zinc-200 border border-white/10 hover:border-orange-500/30 transition-all font-medium text-xs"
          >
            {isInProgress ? "Resume" : isCompleted ? "Review" : "Explore"}
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
