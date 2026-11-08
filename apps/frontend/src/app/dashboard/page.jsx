"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Code,
  Hammer,
  ArrowRight,
  Sparkles,
  BarChart3,
  Target,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit,
  ExternalLink,
  Zap,
  Bookmark,
  LogIn,
  RotateCcw,
  FolderGit2,
  Flame,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import ResumeScreenerModal from "@/components/modals/ResumeScreenerModal";
import UpgradeMembershipModal from "@/components/modals/UpgradeMembershipModal";
import WellbeingEmbed from "@/components/WellbeingEmbed";
import { useAuth } from "@/hooks/useAuth";
import { dashboardService } from "@/services/dashboard.service";

export default function DashboardPage() {
  const { user: authUser, status: authStatus } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Fetch live account dashboard metrics when user is authenticated
  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.fetchDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadDashboard();
    } else if (authStatus === "unauthenticated") {
      setDashboardData(null);
      setLoading(false);
    }
  }, [authStatus]);

  const user = dashboardData?.user || authUser;
  const membership = dashboardData?.membership;
  const kpis = dashboardData?.kpis;
  const enrolledRoadmaps = dashboardData?.enrolledRoadmaps || [];
  const activeTutorials = dashboardData?.activeTutorials || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const achievements = dashboardData?.achievements || [];
  const dsaSolved = dashboardData?.dsaSolved || [];

  const displayName = user?.name || user?.email?.split("@")[0] || "Developer";
  const userRole = user?.role || "ENGINEER";
  const isPremium = membership?.isPremium || user?.isPremium || userRole === "ADMIN";

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 flex flex-col justify-between">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
          </Link>
          <div className="hidden xl:flex items-center gap-5 text-sm font-medium text-zinc-300">
            <Link href="/dashboard" className="text-amber-400 font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              Mission Control
            </Link>
            <Link href="/roadmaps" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
              <Compass className="w-4 h-4 text-orange-400" />
              Roadmaps
            </Link>
            <Link href="/dsa" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
              <Code className="w-4 h-4 text-emerald-400" />
              DSA
            </Link>
            <Link href="/project-tutorials" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
              <Hammer className="w-4 h-4 text-amber-400" />
              Tutorials
            </Link>
            <Link href="/resources" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
              <FileText className="w-4 h-4 text-blue-400" />
              Resources
            </Link>
            <Link href="/assistant" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
              <BrainCircuit className="w-4 h-4 text-pink-400" />
              AI Assistant
            </Link>
            <button
              type="button"
              onClick={() => setResumeScreenerOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Resume
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto w-full relative z-10 flex-1">
        {/* State A: Loading Skeleton */}
        {authStatus === "loading" || (authStatus === "authenticated" && loading) ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-44 rounded-3xl bg-zinc-900/60 border border-white/5" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-zinc-900/40 border border-white/5" />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-zinc-900/40 border border-white/5" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-72 rounded-2xl bg-zinc-900/40 border border-white/5" />
              <div className="h-72 rounded-2xl bg-zinc-900/40 border border-white/5" />
            </div>
          </div>
        ) : authStatus === "unauthenticated" ? (
          /* State B: Guest / Unauthenticated State */
          <div className="p-12 md:p-16 rounded-3xl glass-card border border-white/10 bg-zinc-950/60 text-center max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/10">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
              Mission Control Center
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
              Sign in to unlock your dynamic learning dashboard. Track your roadmap progress, DSA solutions, project tutorials, and verified career readiness.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/?modal=signin"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Account
              </Link>
              <Link
                href="/roadmaps"
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-xs hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-orange-400" />
                Browse Catalog as Guest
              </Link>
            </div>
          </div>
        ) : (
          /* State C: Authenticated Database-Driven Dashboard */
          <>
            {/* Welcome Header */}
            <section className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl glass-card border border-white/10 relative overflow-hidden bg-zinc-950/60 backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {userRole}
                    </span>
                    {isPremium ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-black flex items-center gap-1 shadow-sm shadow-orange-500/30">
                        <Sparkles className="w-3 h-3 text-black" />
                        PREMIUM ACTIVE
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUpgradeModalOpen(true)}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-amber-300 border border-amber-500/30 hover:bg-orange-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        Free Tier • Upgrade
                      </button>
                    )}
                    <span className="text-xs text-zinc-400">
                      Mission Control Live
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                    Welcome back, {displayName}
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                    {user?.headline || "Track your active roadmap tracks, verify your technical competencies, and audit your career readiness score."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={loadDashboard}
                    className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 text-xs transition-all cursor-pointer"
                    title="Refresh Live Metrics"
                    aria-label="Refresh Live Metrics"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <Link
                    href="/roadmaps"
                    className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg shadow-primary/20"
                  >
                    <Compass className="w-4 h-4" />
                    Explore Tracks
                  </Link>
                </div>
              </div>
            </section>

            {/* Quick Access Ecosystem Links */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Learning Ecosystem Quick Access
                </h2>
                <span className="text-xs text-zinc-400">All 5 core modules live</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <Link href="/roadmaps" className="p-4 rounded-xl glass border border-white/10 hover:border-orange-500/40 transition-all text-center group">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-zinc-100 group-hover:text-orange-400">Roadmaps</div>
                  <div className="text-[10px] text-zinc-400">101 Tracks</div>
                </Link>

                <Link href="/dsa" className="p-4 rounded-xl glass border border-white/10 hover:border-emerald-500/40 transition-all text-center group">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-zinc-100 group-hover:text-emerald-400">DSA Engine</div>
                  <div className="text-[10px] text-zinc-400">24 Languages</div>
                </Link>

                <Link href="/project-tutorials" className="p-4 rounded-xl glass border border-white/10 hover:border-amber-500/40 transition-all text-center group">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-zinc-100 group-hover:text-amber-400">Tutorials</div>
                  <div className="text-[10px] text-zinc-400">1,274 Projects</div>
                </Link>

                <Link href="/resources" className="p-4 rounded-xl glass border border-white/10 hover:border-blue-500/40 transition-all text-center group">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-zinc-100 group-hover:text-blue-400">Resources</div>
                  <div className="text-[10px] text-zinc-400">5,749 Books & Docs</div>
                </Link>

                <Link href="/assistant" className="p-4 rounded-xl glass border border-white/10 hover:border-pink-500/40 transition-all text-center group">
                  <div className="w-9 h-9 mx-auto rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-xs text-zinc-100 group-hover:text-pink-400">AI Advisor</div>
                  <div className="text-[10px] text-zinc-400">Adaptive RAG</div>
                </Link>
              </div>
            </section>

            {/* Dynamic Database-Driven KPI Stat Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
              {/* Metric 1: Career Readiness Score */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">Career Readiness</span>
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.careerReadinessScore || 0}%
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <CheckCircle2 className={`w-3 h-3 ${(kpis?.careerReadinessScore || 0) > 0 ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span>
                    {(kpis?.careerReadinessScore || 0) > 0
                      ? "Active progress tracking"
                      : "Start learning to build score"}
                  </span>
                </div>
              </div>

              {/* Metric 2: Enrolled Roadmaps */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">Enrolled Tracks</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.totalEnrolledRoadmaps || 0} Tracks
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>
                    {kpis?.completedRoadmapsCount || 0} completed • {kpis?.avgRoadmapProgress || 0}% avg
                  </span>
                </div>
              </div>

              {/* Metric 3: DSA Problems Solved */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">DSA Solved</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Code className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.dsaProblemsSolvedCount || 0} Solved
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <CheckCircle2 className={`w-3 h-3 ${(kpis?.dsaProblemsSolvedCount || 0) > 0 ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span>
                    {(kpis?.dsaProblemsSolvedCount || 0) > 0
                      ? "Problems practiced"
                      : "Start practicing to track progress"}
                  </span>
                </div>
              </div>

              {/* Metric 4: Project Tutorials */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">Tutorials</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Hammer className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.tutorialsStartedCount || 0} Started
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <Bookmark className="w-3 h-3 text-blue-400" />
                  <span>
                    {kpis?.tutorialsCompletedCount || 0} finished • {kpis?.totalSavedResources || 0} saved
                  </span>
                </div>
              </div>

              {/* Metric 5: ATS Resume Score */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">ATS Resume</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.resumeAtsScore !== null && kpis?.resumeAtsScore !== undefined
                    ? `${kpis.resumeAtsScore} / 100`
                    : "Not Audited"}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <CheckCircle2 className={`w-3 h-3 ${kpis?.resumeAtsScore !== null ? "text-emerald-400" : "text-zinc-500"}`} />
                  <span className="truncate">
                    {kpis?.resumeAnalysis?.verdict || "No audit uploaded"}
                  </span>
                </div>
              </div>

              {/* Metric 6: Learning Streak */}
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400">Active Streak</span>
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {kpis?.currentStreak || 0} Days
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate">
                  <Flame className={`w-3 h-3 ${(kpis?.currentStreak || 0) > 0 ? "text-orange-400 fill-orange-400/20" : "text-zinc-500"}`} />
                  <span>
                    {(kpis?.currentStreak || 0) > 0
                      ? "Consecutive activity"
                      : "Activity today needed"}
                  </span>
                </div>
              </div>
            </section>

            {/* Enrolled Roadmaps & Active Tutorials vs Wellbeing Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
              {/* Enrolled Tracks & Active Learning Modules (2 Cols) */}
              <section className="lg:col-span-2 space-y-6">
                {/* 1. Enrolled Roadmaps */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-orange-400" />
                      Your Enrolled Roadmaps
                    </h2>
                    <Link
                      href="/roadmaps"
                      className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      Browse all 101 tracks <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {enrolledRoadmaps.length === 0 ? (
                    <div className="p-8 rounded-2xl glass-card border border-white/10 bg-zinc-950/40 text-center">
                      <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-zinc-200 mb-1">
                        No Active Roadmap Tracks
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                        You have not started any roadmaps yet. Choose an engineering track to track milestones and verify your progress.
                      </p>
                      <Link
                        href="/roadmaps"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                      >
                        <Compass className="w-4 h-4" />
                        Explore Roadmaps
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {enrolledRoadmaps.map((track) => (
                        <Link
                          key={track.id}
                          href={`/roadmaps/${track.slug}`}
                          className="p-5 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all group bg-zinc-950/40"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 capitalize">
                              {track.slug?.replace(/-/g, " ")}
                            </span>
                            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                          <h3 className="text-base font-bold text-white mb-1 group-hover:text-orange-400 capitalize">
                            {track.slug?.replace(/-/g, " ")} Roadmap
                          </h3>
                          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
                            <span>Progress</span>
                            <span>{track.percentComplete || 0}%</span>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, track.percentComplete || 0))}%` }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Active Project Tutorials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Hammer className="w-5 h-5 text-amber-400" />
                      Active Project Tutorials
                    </h2>
                    <Link
                      href="/project-tutorials"
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      Explore 1,274 tutorials <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {activeTutorials.length === 0 ? (
                    <div className="p-8 rounded-2xl glass-card border border-white/10 bg-zinc-950/40 text-center">
                      <FolderGit2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <h3 className="text-base font-semibold text-zinc-200 mb-1">
                        No Tutorials In Progress
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                        Recreate production-grade software from first principles with step-by-step build guides.
                      </p>
                      <Link
                        href="/project-tutorials"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-black font-semibold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                      >
                        <Hammer className="w-4 h-4" />
                        Browse Project Catalog
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeTutorials.map((prog) => (
                        <Link
                          key={prog.id}
                          href={prog.project?.slug ? `/project-tutorials/${prog.project.slug}` : "/project-tutorials"}
                          className="p-5 rounded-2xl glass-card border border-white/10 hover:border-amber-500/40 transition-all group bg-zinc-950/40"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {prog.project?.difficulty || "Practical"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Step {prog.currentStep || 1}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mb-2 group-hover:text-amber-300 line-clamp-1">
                            {prog.project?.title || "Project Tutorial"}
                          </h3>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(0, prog.percentComplete || 0))}%` }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Chronological Account Activity Timeline */}
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Recent Account Activity
                  </h2>

                  {recentActivity.length === 0 ? (
                    <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/40 text-center">
                      <p className="text-xs text-zinc-400">
                        No recent activity recorded yet. As you solve DSA problems, advance roadmap tracks, or complete project milestones, your verified history will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-xl glass border border-white/10 flex items-center justify-between bg-zinc-950/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300">
                              {act.icon === "Compass" && <Compass className="w-4 h-4 text-orange-400" />}
                              {act.icon === "Hammer" && <Hammer className="w-4 h-4 text-amber-400" />}
                              {act.icon === "Bookmark" && <Bookmark className="w-4 h-4 text-blue-400" />}
                              {act.icon === "Target" && <Target className="w-4 h-4 text-purple-400" />}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-100">{act.title}</div>
                              <div className="text-[11px] text-zinc-400">{act.subtitle}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Embedded Mental Health / Wellbeing (1 Col) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-emerald-400" />
                    Mental Health Radar
                  </h2>
                  <a
                    href="https://fluffy-spoon-score.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    title="Visit Website (opens in a new tab)"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="aspect-[4/3] rounded-2xl glass-card border border-white/10 overflow-hidden flex flex-col bg-zinc-950/80">
                  <div className="h-9 border-b border-white/10 flex items-center justify-between px-3 gap-2 bg-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      <span className="text-[10px] text-zinc-400 ml-2 truncate font-mono">
                        fluffy-spoon-score.vercel.app
                      </span>
                    </div>
                    <a
                      href="https://fluffy-spoon-score.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-zinc-400 hover:text-emerald-400 font-medium inline-flex items-center gap-1 transition-colors"
                      title="Visit Website in new tab"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    <WellbeingEmbed />
                  </div>
                </div>

                {/* Personal Achievements & Badges */}
                <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Personal Achievements
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {achievements.length} Unlocked
                    </span>
                  </div>
                  {achievements.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-zinc-400 mb-1">No Badges Unlocked Yet</p>
                      <p className="text-[11px] text-zinc-500">
                        Enroll in tracks, solve DSA algorithms, and complete tutorials to unlock badges.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {achievements.map((ach) => (
                        <div
                          key={ach.id}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">{ach.title}</div>
                            <div className="text-[10px] text-zinc-400">{ach.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <UpgradeMembershipModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      />
    </div>
  );
}
