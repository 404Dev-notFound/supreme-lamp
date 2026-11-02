"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Hammer,
  Compass,
  FileText,
  BrainCircuit,
  Cpu,
  ShieldCheck,
  Play,
  RotateCcw,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import ProjectOverviewTab from "@/components/tutorials/ProjectOverviewTab";
import ProjectStepWorkspace from "@/components/tutorials/ProjectStepWorkspace";
import ResumeScreenerModal from "@/components/modals/ResumeScreenerModal";
import WellbeingEmbed from "@/components/WellbeingEmbed";
import { projectTutorialsService } from "@/services/projectTutorials.service";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectTutorialDetailPage({ params }) {
  // Unwrap Next.js 15+ promise params safely
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user: authUser } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "workspace"
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Modals
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isMentalHealthScoreOpen, setMentalHealthScoreOpen] = useState(false);

  // Fetch tutorial data by slug
  const loadProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectTutorialsService.fetchProjectBySlug(slug);
      if (res?.data) {
        setProject(res.data);
      } else {
        setError("Project tutorial not found.");
      }
    } catch (err) {
      console.error("Error loading project tutorial:", err);
      setError("Failed to load project details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [slug, authUser]);

  // Step Completion Handler
  const handleToggleStepCompletion = async (stepNumber, isCompleted) => {
    if (!authUser) {
      window.location.href = "?modal=signin";
      return;
    }

    if (!project) return;
    setIsUpdatingProgress(true);

    try {
      const res = await projectTutorialsService.updateStepProgress(
        project.id,
        stepNumber,
        isCompleted
      );

      if (res?.data) {
        const completedStepIdSet = new Set(
          res.data.stepProgress.filter((sp) => sp.isCompleted).map((sp) => sp.projectStepId)
        );

        setProject((prev) => ({
          ...prev,
          userProgress: {
            ...prev.userProgress,
            status: res.data.status,
            completedStepCount: res.data.completedStepCount,
            totalStepCount: res.data.totalStepCount,
            progressPercent: res.data.progressPercent,
            currentStepNumber: res.data.currentStepNumber,
            completedStepIds: Array.from(completedStepIdSet),
          },
        }));
      }
    } catch (err) {
      console.error("Failed to update step progress:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Start Project Action
  const handleStartProject = async () => {
    if (!authUser) {
      window.location.href = "?modal=signin";
      return;
    }
    if (!project) return;

    try {
      const res = await projectTutorialsService.startProject(project.id);
      if (res?.data) {
        setProject((prev) => ({
          ...prev,
          userProgress: {
            ...res.data,
            completedStepIds: [],
          },
        }));
        setActiveTab("workspace");
      }
    } catch (err) {
      console.error("Failed to start project:", err);
    }
  };

  // Mark Project Complete Action
  const handleCompleteProject = async () => {
    if (!authUser) {
      window.location.href = "?modal=signin";
      return;
    }
    if (!project) return;

    try {
      const res = await projectTutorialsService.completeProject(project.id);
      if (res?.data) {
        const allStepIds = (project.steps || []).map((s) => s.id);
        setProject((prev) => ({
          ...prev,
          userProgress: {
            ...prev.userProgress,
            status: "COMPLETED",
            progressPercent: 100,
            completedStepCount: project.steps.length,
            completedStepIds: allStepIds,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to complete project:", err);
    }
  };

  // Bookmark Toggle
  const handleToggleBookmark = async () => {
    if (!authUser) {
      window.location.href = "?modal=signin";
      return;
    }
    if (!project) return;

    try {
      const res = await projectTutorialsService.toggleBookmark(project.id);
      setProject((prev) => ({
        ...prev,
        isBookmarked: res.data.bookmarked,
      }));
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen text-zinc-100 flex flex-col justify-between">
        <div className="pt-32 px-6 max-w-7xl mx-auto w-full animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-xl" />
          <div className="h-40 bg-white/5 rounded-3xl" />
          <div className="h-96 bg-white/5 rounded-3xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen text-zinc-100 flex flex-col justify-between">
        <div className="pt-40 px-6 max-w-lg mx-auto w-full text-center">
          <div className="p-8 rounded-3xl glass-card border border-red-500/20 bg-zinc-950/70">
            <h2 className="text-xl font-bold text-red-400 mb-2">Project Not Found</h2>
            <p className="text-sm text-zinc-400 mb-6">{error || "The requested project tutorial could not be loaded."}</p>
            <Link
              href="/project-tutorials"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project Tutorials
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const progress = project.userProgress;
  const isStarted = Boolean(progress);
  const isCompleted = progress?.status === "COMPLETED";
  const completedStepIdSet = new Set(progress?.completedStepIds || []);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-orange-500/30 flex flex-col justify-between">
      {/* 1. Global Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">fC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link
              href="/project-tutorials"
              className="text-orange-400 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Hammer className="w-4 h-4 text-orange-400" />
              Project Tutorials
            </Link>
            <Link
              href="/roadmaps"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              Roadmaps
            </Link>
            <Link
              href="/ecosystem"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              Ecosystem
            </Link>
            <button
              type="button"
              onClick={() => setResumeScreenerOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Resume Screener
            </button>
            <button
              type="button"
              onClick={() => setMentalHealthScoreOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              Mental Health Score
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10 flex-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-6">
          <Link
            href="/project-tutorials"
            className="hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Project Tutorials
          </Link>
          <span>/</span>
          <span className="text-zinc-200 truncate">{project.title}</span>
        </div>

        {/* Project Header Card */}
        <header className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Badges: Category, Language, Difficulty, Provenance */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-300">
                {project.category?.name || project.categorySlug}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700">
                {project.language}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium border border-orange-500/20 bg-orange-500/10 text-orange-400">
                {project.difficulty}
              </span>
              {project.estimatedHours && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs text-zinc-400 bg-white/5 border border-white/5">
                  <Clock className="w-3.5 h-3.5" />
                  ~{project.estimatedHours} Hours
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggleBookmark}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-all"
            >
              <Bookmark className={`w-3.5 h-3.5 ${project.isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
              {project.isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
            {project.title}
          </h1>

          <p className="text-base text-zinc-300 leading-relaxed max-w-4xl mb-6">
            {project.description}
          </p>

          {/* Progress Banner & Quick Actions */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="w-full">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-zinc-300">
                    {isCompleted
                      ? "Completed!"
                      : isStarted
                      ? "In Progress"
                      : "Not Started"}
                  </span>
                  <span className="text-zinc-400 font-mono">
                    {progress?.completedStepCount || 0} / {project.steps?.length || 0} Steps ({progress?.progressPercent || 0}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCompleted ? "bg-emerald-400" : "bg-gradient-to-r from-orange-500 to-amber-400"
                    }`}
                    style={{ width: `${progress?.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isStarted ? (
                <button
                  type="button"
                  onClick={handleStartProject}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Start Building Project
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("workspace")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isCompleted ? "Review Steps" : "Resume Workspace"}
                  </button>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={handleCompleteProject}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium text-xs hover:bg-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Workspace View Tabs */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-white/10 text-white border border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            Overview & Blueprint
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("workspace")}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === "workspace"
                ? "bg-orange-500 text-black font-semibold shadow-lg shadow-orange-500/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Interactive Workspace ({project.steps?.length || 0} Steps)
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <ProjectOverviewTab
            project={project}
            onStartBuilding={() => setActiveTab("workspace")}
          />
        )}

        {/* Tab 2: Interactive Step Workspace */}
        {activeTab === "workspace" && (
          <ProjectStepWorkspace
            project={project}
            steps={project.steps || []}
            userProgress={project.userProgress}
            completedStepIds={completedStepIdSet}
            onToggleStepCompletion={handleToggleStepCompletion}
            isUpdating={isUpdatingProgress}
          />
        )}
      </main>

      {/* Global Modals */}
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <WellbeingEmbed
        isOpen={isMentalHealthScoreOpen}
        onClose={() => setMentalHealthScoreOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
