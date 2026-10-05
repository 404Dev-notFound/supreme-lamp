"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  Sparkles,
  BarChart3,
  Target,
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit,
  ExternalLink,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import JobMatcherModal from "@/components/JobMatcherModal";
import ResumeScreenerModal from "@/components/modals/ResumeScreenerModal";
import WellbeingEmbed from "@/components/WellbeingEmbed";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const [isJobMatcherOpen, setJobMatcherOpen] = useState(false);
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);

  const displayName = user?.name || user?.email?.split("@")[0] || "Architect";
  const userRole = user?.role || "ENGINEER";

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
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link
              href="/dashboard"
              className="text-amber-400 font-semibold flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-orange-400" />
              Mission Control
            </Link>
            <Link
              href="/roadmaps"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              Roadmaps
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
              onClick={() => setJobMatcherOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <Target className="w-4 h-4 text-blue-400" />
              Job Matcher
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto w-full relative z-10 flex-1">
        {/* Welcome Header */}
        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl glass-card border border-white/10 relative overflow-hidden bg-zinc-950/60 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {userRole}
                </span>
                <span className="text-xs text-zinc-400">
                  Mission Control Center Active
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                Track your active learning roadmap tracks, verify your technical competencies, and audit your career readiness score.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/roadmaps"
                className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-lg shadow-primary/20"
              >
                <Compass className="w-4 h-4" />
                Explore Tracks
              </Link>
              <button
                type="button"
                onClick={() => setJobMatcherOpen(true)}
                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Radar Jobs
              </button>
            </div>
          </div>
        </section>

        {/* Quick KPI Stat Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-400">
                Career Readiness
              </span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">84%</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+12% from last milestone</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-400">
                Active Roadmaps
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Compass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">4 Tracks</div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Full-Stack, AI, DevOps, Backend</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-400">
                ATS Resume Match
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">91 / 100</div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Passed automated parsers</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-zinc-400">
                Opportunity Radar
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">18 Openings</div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>High fit match rate (&gt;85%)</span>
            </div>
          </div>
        </section>

        {/* Learning Roadmap Tracks & Mental Health Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Active Learning Tracks (2 Cols) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-400" />
                Your Recommended Tracks
              </h2>
              <Link
                href="/roadmaps"
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                View all 90+ tracks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/roadmaps/frontend"
                className="p-5 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all group bg-zinc-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Core Role
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-amber-300">
                  Frontend Engineering
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  Modern JavaScript, React 19, Server Components, CSS Architecture, and Web Performance.
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full w-[65%]" />
                </div>
              </Link>

              <Link
                href="/roadmaps/full-stack"
                className="p-5 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all group bg-zinc-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    High Demand
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-orange-400">
                  Full Stack Developer
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  Client & server architecture, PostgreSQL, REST/GraphQL APIs, and Docker deployments.
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full w-[45%]" />
                </div>
              </Link>

              <Link
                href="/roadmaps/ai-engineer"
                className="p-5 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all group bg-zinc-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Emerging AI
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-purple-300">
                  AI & LLM Applications
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  Prompt engineering, embeddings, RAG architectures, and agentic workflows.
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full w-[30%]" />
                </div>
              </Link>

              <Link
                href="/roadmaps/devops"
                className="p-5 rounded-2xl glass-card border border-white/10 hover:border-orange-500/40 transition-all group bg-zinc-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Infrastructure
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-300">
                  DevOps & Cloud Native
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  CI/CD pipelines, Docker containers, Kubernetes clusters, and cloud monitoring.
                </p>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-[50%]" />
                </div>
              </Link>
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
                href="https://fluffy-spoon-score.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="aspect-[4/3] rounded-2xl glass-card border border-white/10 overflow-hidden flex flex-col bg-zinc-950/80">
              <div className="h-9 border-b border-white/10 flex items-center px-3 gap-2 bg-white/5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-zinc-400 ml-2 truncate font-mono">
                  fluffy-spoon-score.vercel.app
                </span>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <WellbeingEmbed />
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Modals */}
      <JobMatcherModal isOpen={isJobMatcherOpen} setOpen={setJobMatcherOpen} />
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
    </div>
  );
}
