"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  BookOpen,
  Play,
  FolderGit2,
  Layers,
  ShieldAlert,
  Globe,
} from "lucide-react";

function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}

export default function ProjectStepWorkspace({
  project,
  steps = [],
  userProgress,
  completedStepIds = new Set(),
  onToggleStepCompletion,
  isUpdating = false,
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(() => {
    // Default to the first incomplete step, or step 1
    if (!steps || steps.length === 0) return 0;
    const firstIncompleteIdx = steps.findIndex((s) => !completedStepIds.has(s.id));
    return firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0;
  });

  const [copied, setCopied] = useState(false);

  if (!steps || steps.length === 0) {
    const fallbackVideoId =
      extractYouTubeId(project?.tutorialUrl) ||
      extractYouTubeId(project?.videoUrl) ||
      (project?.resources &&
        project.resources
          .map((r) => extractYouTubeId(r.url))
          .find(Boolean));

    const tutorialLink = project?.tutorialUrl || project?.resources?.[0]?.url;
    const githubLink = project?.githubUrl || project?.sourceRepo || (project?.sourceRepositories && project.sourceRepositories[0]);

    return (
      <div className="space-y-8">
        <div className="p-8 md:p-12 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-3">
            <ShieldAlert className="w-4 h-4" />
            Step-by-Step Breakdown Unavailable
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mb-4">
            Curated First-Principles Build Guide
          </h2>

          <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-3xl mb-8">
            This project tutorial does not yet have decomposed, interactive milestone steps in flowCTRL. We strictly preserve engineering integrity and do not generate fabricated or unverified instructions. You can build this project directly using the verified source repository, original guide, and documentation below.
          </p>

          {/* Primary Quick Links */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {tutorialLink && (
              <a
                href={tutorialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
              >
                <BookOpen className="w-4 h-4" />
                Open Verified Original Tutorial
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {githubLink && (
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-100 font-semibold text-xs border border-white/10 transition-all"
              >
                <FolderGit2 className="w-4 h-4" />
                View GitHub Repository
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Playable YouTube Video Embed if available */}
          {fallbackVideoId && (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl mb-8">
              <div className="p-3 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2 font-medium">
                  <Play className="w-4 h-4 fill-red-500 text-red-500" />
                  <span>Interactive Video Walkthrough</span>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${fallbackVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  Watch on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${fallbackVideoId}?rel=0`}
                  title="Tutorial Video Walkthrough"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Verified Resources Checklist */}
          {project?.resources && project.resources.length > 0 && (
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Verified Reference Links
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-orange-500/30 transition-all flex items-center justify-between gap-3 text-xs group"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">
                        {res.title}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {res.resourceType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentStep = steps[activeStepIndex] || steps[0];
  const isCurrentStepCompleted = completedStepIds.has(currentStep.id);
  const isLastStep = activeStepIndex === steps.length - 1;
  const isFirstStep = activeStepIndex === 0;

  const stepVideoId = extractYouTubeId(
    currentStep.videoUrl ||
    currentStep.youtubeUrl ||
    (project?.tutorialUrl && project.tutorialUrl.includes("youtu") ? project.tutorialUrl : null)
  );

  const handleCopyCode = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Step Navigation Timeline (4 cols on lg) */}
      <aside className="lg:col-span-4 rounded-2xl glass-card border border-white/10 bg-zinc-950/60 p-4 sticky top-28">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Step Roadmap ({completedStepIds.size}/{steps.length} Completed)
          </span>
          <span className="text-xs font-mono text-orange-400 font-medium">
            {steps.length > 0
              ? Math.round((completedStepIds.size / steps.length) * 100)
              : 0}
            %
          </span>
        </div>

        <nav className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          {steps.map((step, idx) => {
            const isCompleted = completedStepIds.has(step.id);
            const isActive = idx === activeStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIndex(idx)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all text-sm ${
                  isActive
                    ? "bg-orange-500/10 border border-orange-500/30 text-white"
                    : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isActive ? (
                    <div className="w-4 h-4 rounded-full border-2 border-orange-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className={`font-mono ${isActive ? "text-orange-400" : "text-zinc-500"}`}>
                      Step {step.stepNumber}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-400 font-medium">Done</span>
                    )}
                  </div>
                  <div className={`truncate font-medium text-xs ${isActive ? "text-zinc-100" : "text-zinc-300"}`}>
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right Column: Step Implementation Workspace (8 cols on lg) */}
      <main className="lg:col-span-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 p-8 relative overflow-hidden">
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono text-xs font-semibold mb-2">
              Step {currentStep.stepNumber} of {steps.length}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
              {currentStep.title}
            </h2>
          </div>

          {/* Quick Mark Complete Button */}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggleStepCompletion(currentStep.stepNumber, !isCurrentStepCompleted)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md shrink-0 ${
              isCurrentStepCompleted
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCurrentStepCompleted ? "text-emerald-400" : "text-black"}`} />
            {isCurrentStepCompleted ? "Step Completed" : "Mark as Completed"}
          </button>
        </div>

        {/* Objective & Why Necessary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {currentStep.objective && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Objective
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentStep.objective}
              </p>
            </div>
          )}

          {currentStep.whyNecessary && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Why This Step Is Necessary
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentStep.whyNecessary}
              </p>
            </div>
          )}
        </div>

        {/* Concepts Tags */}
        {currentStep.concepts && currentStep.concepts.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-zinc-500">Concepts:</span>
            {currentStep.concepts.map((concept, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300"
              >
                {concept}
              </span>
            ))}
          </div>
        )}

        {/* Video Tutorial Walkthrough (if YouTube) */}
        {stepVideoId && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950/80 shadow-xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs text-zinc-300 bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-red-500 text-red-500" />
                <span className="font-semibold text-zinc-200">Video Walkthrough</span>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${stepVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline flex items-center gap-1 font-medium"
              >
                Open on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${stepVideoId}?rel=0`}
                title="Step Video Walkthrough"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Detailed Implementation Guidance */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            <BookOpen className="w-4 h-4 text-orange-400" />
            Implementation Guide
          </div>
          <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-line bg-zinc-900/40 border border-white/5 p-5 rounded-2xl">
            {currentStep.content}
          </div>
        </div>

        {/* Code Snippet / Example */}
        {currentStep.codeSnippet && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-2 font-mono text-zinc-400 uppercase">
                <Code2 className="w-4 h-4 text-orange-400" />
                {currentStep.codeLanguage || project.language || "Code Snippet"}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(currentStep.codeSnippet)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-zinc-950 border border-white/10 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed selection:bg-orange-500/30">
              <code>{currentStep.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Expected Result */}
        {currentStep.expectedResult && (
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Verification & Expected Output
            </div>
            <p className="text-sm text-zinc-300">
              {currentStep.expectedResult}
            </p>
          </div>
        )}

        {/* Reference URLs */}
        {currentStep.referenceUrls && currentStep.referenceUrls.length > 0 && (
          <div className="mb-8 pt-4 border-t border-white/5">
            <span className="text-xs font-medium text-zinc-400 block mb-2">
              Official Reference Documentation for this step:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentStep.referenceUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-orange-400 hover:text-orange-300 border border-white/5 text-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {new URL(url).hostname}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Pagination Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            type="button"
            disabled={isFirstStep}
            onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>

          <span className="text-xs text-zinc-500 font-mono">
            {activeStepIndex + 1} / {steps.length}
          </span>

          <button
            type="button"
            disabled={isLastStep}
            onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

