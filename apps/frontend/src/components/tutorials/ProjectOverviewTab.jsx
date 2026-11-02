"use client";

import React from "react";
import {
  CheckCircle2,
  ExternalLink,
  BookOpen,
  FolderGit2,
  Layers,
  Wrench,
  Sparkles,
  ShieldCheck,
  FileCode,
  Globe,
} from "lucide-react";

export default function ProjectOverviewTab({ project, onStartBuilding }) {
  const getResourceIcon = (type) => {
    switch (type) {
      case "GITHUB_REPO":
        return FolderGit2;
      case "SPECIFICATION":
      case "OFFICIAL_DOCS":
        return Globe;
      case "VIDEO":
        return Sparkles;
      case "ORIGINAL_TUTORIAL":
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-10">
      {/* 1. What You Will Build Banner */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">
          <Layers className="w-4 h-4" />
          Project Blueprint
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-4">
          What You Will Build
        </h2>

        <p className="text-zinc-300 text-base leading-relaxed mb-6 max-w-4xl">
          {project.whatYouWillBuild || project.description}
        </p>

        {project.expectedOutcome && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 text-sm text-zinc-300">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200">Expected Final Outcome: </span>
              {project.expectedOutcome}
            </div>
          </div>
        )}
      </section>

      {/* 2. Grid: Why Build This & Real-World Applications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            <Sparkles className="w-4 h-4" />
            First Principles Engineering
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-3">Why Build This?</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {project.whyBuildThis ||
              "Building core technologies from scratch transforms theoretical understanding into concrete engineering capability. Rather than using black-box libraries, you discover the low-level trade-offs, algorithms, and architectures that power production software."}
          </p>
        </section>

        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <Globe className="w-4 h-4" />
            Industry Application
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-3">Real-World Applications</h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {project.realWorldApplications ||
              "The concepts mastered in this project directly apply to systems architecture, performance tuning, distributed infrastructure, and designing reliable backend services."}
          </p>
        </section>
      </div>

      {/* 3. Learning Outcomes Checklist */}
      {project.learningOutcomes && project.learningOutcomes.length > 0 && (
        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            Competencies & Skills
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            What You Will Understand After Completion
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {project.learningOutcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-sm text-zinc-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Prerequisites & Tools Required */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {project.prerequisites && project.prerequisites.length > 0 && (
          <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">
              <BookOpen className="w-4 h-4" />
              Before You Begin
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Prerequisites</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              {project.prerequisites.map((prereq, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {project.toolsRequired && project.toolsRequired.length > 0 && (
          <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">
              <Wrench className="w-4 h-4" />
              Environment Setup
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-3">Tools Required</h3>
            <ul className="space-y-2 text-sm text-zinc-300">
              {project.toolsRequired.map((tool, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <span>{tool}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* 5. Verified External Resources */}
      {project.resources && project.resources.length > 0 && (
        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              Verified Learning References
            </div>
            <span className="text-xs text-zinc-500">
              {project.resources.length} verified source links
            </span>
          </div>

          <h3 className="text-lg font-semibold text-zinc-100 mb-4">
            Original Tutorials, Documentation & Source Code
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.resources.map((res) => {
              const ResIcon = getResourceIcon(res.resourceType);
              return (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/30 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-400">
                        <ResIcon className="w-3.5 h-3.5" />
                        {res.resourceType.replace(/_/g, " ")}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors" />
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors mb-1">
                      {res.title}
                    </h4>
                    {res.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-2">
                        {res.description}
                      </p>
                    )}
                  </div>
                  {res.author && (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      By {res.author}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Provenance & Attribution Banner */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-500">
        <div>
          <span className="text-zinc-400 font-medium">Source Provenance: </span>
          Curated from{" "}
          <a
            href={project.sourceRepo || "https://github.com/codecrafters-io/build-your-own-x"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:underline"
          >
            build-your-own-x
          </a>{" "}
          under CC0-1.0 Universal Public Domain Dedication.
          {project.sourceAuthor && ` Author: ${project.sourceAuthor}.`}
        </div>

        <button
          type="button"
          onClick={onStartBuilding}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all shrink-0"
        >
          <Layers className="w-3.5 h-3.5" />
          Jump to Interactive Steps
        </button>
      </div>
    </div>
  );
}
