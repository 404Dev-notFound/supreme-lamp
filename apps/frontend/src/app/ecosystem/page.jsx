"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  GitBranch,
  Terminal,
  FileCheck,
  HeartPulse,
  Compass,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Clock,
  Circle,
  GraduationCap,
  Layers,
  ArrowRight,
} from "lucide-react";
import NavProfile from "../../components/NavProfile";
import Footer from "../../components/Footer";
import ResumeScreenerModal from "../../components/modals/ResumeScreenerModal";
import MentalHealthScoreModal from "../../components/modals/MentalHealthScoreModal";
import EcosystemCanvas from "../../components/ecosystem/EcosystemCanvas";
import RoadmapSearchBar from "../../components/roadmap/RoadmapSearchBar";
import RoadmapStepDrawer from "../../components/roadmap/RoadmapStepDrawer";
import { ECOSYSTEM_PROJECTS } from "../../lib/ecosystemData";

const PROJECT_ICONS = {
  flowctrl: Cpu,
  codecollab: GitBranch,
  judgex: Terminal,
  "mental-health": HeartPulse,
  "resume-screener": FileCheck,
};

function GithubIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function EcosystemPage() {
  const [activeProjectId, setActiveProjectId] = useState(null);

  // View Mode: 'roadmap' | 'ecosystem'
  const [viewMode, setViewMode] = useState("roadmap");

  // RAG Roadmap state
  const [roadmapData, setRoadmapData] = useState(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState("");

  // Step Detail Drawer state
  const [activeStep, setActiveStep] = useState(null);
  const [stepProgress, setStepProgress] = useState({});

  // Modals for Resume Screener and Mental Health Score
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isMentalHealthScoreOpen, setMentalHealthScoreOpen] = useState(false);

  // Load persistent progress and initial roadmap on mount
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem("flowctrl_rag_step_progress");
      if (savedProgress) {
        setStepProgress(JSON.parse(savedProgress));
      }
      const cachedRoadmap = localStorage.getItem("flowctrl_active_roadmap");
      if (cachedRoadmap) {
        const parsed = JSON.parse(cachedRoadmap);
        if (parsed && parsed.steps) {
          setRoadmapData(parsed);
          setCurrentQuery(parsed.userGoal || parsed.roadmapTitle || "");
        }
      }
    } catch {}
  }, []);

  // Natural Language Roadmap Generation handler
  const handleGenerateRoadmap = async (query) => {
    if (isLoadingRoadmap) return;
    setIsLoadingRoadmap(true);
    setRoadmapError(null);
    setCurrentQuery(query);

    try {
      const res = await fetch("/api/rag/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error || json.message || "Failed to generate roadmap from RAG engine."
        );
      }

      const generated = json.data;
      setRoadmapData(generated);
      setViewMode("roadmap");

      // Save to localStorage for instant recall
      try {
        localStorage.setItem("flowctrl_active_roadmap", JSON.stringify(generated));
      } catch {}

      // Initialize stepProgress for uninitialized steps
      if (generated?.steps) {
        setStepProgress((prev) => {
          const next = { ...prev };
          generated.steps.forEach((s) => {
            if (!next[s.id] && s.status) {
              next[s.id] = s.status;
            }
          });
          try {
            localStorage.setItem("flowctrl_rag_step_progress", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    } catch (err) {
      console.error("[Roadmap Generation Error]:", err);
      setRoadmapError(err.message || "Failed to generate roadmap. Please try again.");
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  // Step Progress status toggle handler (Not Started | In Progress | Completed)
  const handleUpdateStepStatus = async (stepId, status) => {
    setStepProgress((prev) => {
      const next = { ...prev, [stepId]: status };
      try {
        localStorage.setItem("flowctrl_rag_step_progress", JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch("/api/rag/progress/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId,
          status,
          roadmapId: roadmapData?.id,
        }),
      });
    } catch (err) {
      console.warn("Could not sync step progress to backend server:", err);
    }
  };

  const handleSelectProject = (id) => {
    setActiveProjectId((prev) => (prev === id ? null : id));
    const el = document.getElementById(`project-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-orange-500/30 pb-16">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-primary-foreground tracking-tighter">
              fC
            </span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            flowCTRL
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link
            href="/roadmaps"
            className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
          >
            <Compass className="w-4 h-4 text-orange-400" />
            Roadmaps
          </Link>
          <Link
            href="/ecosystem"
            className="text-orange-400 font-semibold transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-orange-400" />
            Ecosystem
          </Link>
          <button
            type="button"
            onClick={() => setResumeScreenerOpen(true)}
            className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300"
          >
            Resume Screener
          </button>
          <button
            type="button"
            onClick={() => setMentalHealthScoreOpen(true)}
            className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300"
          >
            Mental Health Score
          </button>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      <main className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
              AI RAG Career Engine & Interactive Canvas
            </span>
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              92 Curated Tracks • 10,400+ Topics • 24,000+ Verified Resources
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Personalized Career Roadmap & Ecosystem
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            Search for any career goal, engineering discipline, or learning objective.
            Our LangChain RAG model generates a structured, prerequisite-ordered roadmap
            rendered directly on the interactive canvas with courses and references from 90+ verified curricula.
          </p>
        </div>

        {/* SECTION 1: Frontend Search Bar */}
        <section aria-label="Roadmap Search Engine" className="w-full">
          <RoadmapSearchBar
            onGenerate={handleGenerateRoadmap}
            isLoading={isLoadingRoadmap}
            currentQuery={currentQuery}
            error={roadmapError}
          />
        </section>

        {/* SECTION 4: Interactive Roadmap Canvas (With Mode Switcher to 5-Project Ecosystem) */}
        <section aria-label="Interactive Canvas" className="w-full">
          <EcosystemCanvas
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            roadmapData={roadmapData}
            activeStepId={activeStep?.id}
            onSelectStep={(step) => setActiveStep(step)}
            stepProgress={stepProgress}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
          />
        </section>

        {/* SECTION: Roadmap Curriculum Overview (When in Roadmap Mode) */}
        {viewMode === "roadmap" && roadmapData && (
          <section
            aria-label="Roadmap Curriculum Breakdown"
            className="w-full space-y-6 pt-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold block">
                  Curriculum Overview
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {roadmapData.roadmapTitle}
                </h2>
                <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl">
                  {roadmapData.summary}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-right">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    Total Estimated Duration
                  </span>
                  <span className="text-sm font-mono font-bold text-orange-400">
                    {roadmapData.estimatedTotalWeeks || 16} Weeks
                  </span>
                </div>
              </div>
            </div>

            {/* Stages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {roadmapData.stages?.map((stage, sIdx) => {
                const stageSteps = roadmapData.steps?.filter(
                  (s) => s.stageIndex === sIdx
                ) || [];

                return (
                  <div
                    key={sIdx}
                    className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4 flex flex-col justify-between hover:border-orange-500/30 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          Stage 0{sIdx + 1}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {stageSteps.length} Milestones
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                        {stage.stageName}
                      </h3>

                      {stage.stageDescription && (
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {stage.stageDescription}
                        </p>
                      )}

                      {/* Step chips list */}
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        {stageSteps.map((step) => {
                          const isDone = stepProgress[step.id] === "completed";
                          const isDoing = stepProgress[step.id] === "in_progress";

                          return (
                            <div
                              key={step.id}
                              onClick={() => setActiveStep(step)}
                              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-orange-500/30 transition-all flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : isDoing ? (
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                )}
                                <span className="text-xs font-medium text-zinc-200 truncate">
                                  {step.topic}
                                </span>
                              </div>

                              <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 shrink-0 ml-2">
                                {step.recommendedCourses?.length || 0} courses →
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION: 5-Project Ecosystem Descriptions (Preserved and viewable) */}
        {viewMode === "ecosystem" && (
          <section aria-label="Project Descriptions" className="w-full text-left">
            <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-semibold block">
                  Robotic Architecture
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  FlowCTRL Core Ecosystem Platform
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                5 Symmetrical Integrated Projects
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ECOSYSTEM_PROJECTS.map((project) => {
                const isFlowCTRL = project.id === "flowctrl";
                const isSelected = activeProjectId === project.id;
                const Icon = PROJECT_ICONS[project.id] || Cpu;

                return (
                  <article
                    key={project.id}
                    id={`project-card-${project.id}`}
                    onClick={() => handleSelectProject(project.id)}
                    style={{
                      borderColor: isSelected
                        ? project.accentColor
                        : isFlowCTRL
                        ? "rgba(249, 115, 22, 0.4)"
                        : "rgba(255, 255, 255, 0.12)",
                      boxShadow: isSelected
                        ? `0 0 35px ${project.accentGlow}`
                        : "none",
                    }}
                    className={`rounded-2xl p-6 glass-card bg-zinc-950/80 transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
                      isFlowCTRL
                        ? "md:col-span-2 lg:col-span-3 border-orange-500/40 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-orange-950/20"
                        : "hover:border-white/30"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header Row: Badge & Position */}
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            backgroundColor: `${project.accentColor}18`,
                            borderColor: `${project.accentColor}40`,
                            color: project.accentColor,
                          }}
                          className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border uppercase"
                        >
                          {project.badge}
                        </span>
                        <span className="text-xs font-mono text-zinc-500">
                          {project.role}
                        </span>
                      </div>

                      {/* Project Title & Icon */}
                      <div className="flex items-center gap-3">
                        <div
                          style={{
                            backgroundColor: `${project.accentColor}20`,
                            borderColor: `${project.accentColor}40`,
                            color: project.accentColor,
                          }}
                          className="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                            {project.name}
                          </h2>
                          <p className="text-xs text-zinc-400 font-medium">
                            {project.tagline}
                          </p>
                        </div>
                      </div>

                      {/* Short Description */}
                      <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                        {project.shortDescription}
                      </p>

                      {/* Main Purpose */}
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                          Main Purpose
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {project.purpose}
                        </p>
                      </div>

                      {/* Key Features & Capabilities */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                          Key Features & Capabilities
                        </span>
                        <ul className="space-y-1.5">
                          {project.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-zinc-300 leading-snug"
                            >
                              <CheckCircle2
                                style={{ color: project.accentColor }}
                                className="w-3.5 h-3.5 shrink-0 mt-0.5"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Links Row */}
                    {(project.website || project.repository) && (
                      <div
                        className="pt-4 mt-4 border-t border-white/10 flex items-center justify-end gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.website && (
                          <a
                            href={project.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                          >
                            <span>Visit Website</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {project.repository && (
                          <a
                            href={project.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                          >
                            <GithubIcon className="w-3.5 h-3.5" />
                            <span>View Repository</span>
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* SECTION 5: Detailed Step Explanation Drawer */}
      <RoadmapStepDrawer
        step={activeStep}
        isOpen={Boolean(activeStep)}
        onClose={() => setActiveStep(null)}
        status={stepProgress[activeStep?.id] || "not_started"}
        onUpdateStatus={handleUpdateStepStatus}
      />

      {/* Modals for Resume Screener and Mental Health Score */}
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <MentalHealthScoreModal
        isOpen={isMentalHealthScoreOpen}
        onClose={() => setMentalHealthScoreOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
