"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart,
  Compass,
  Hammer,
  Cpu,
  Users,
  Code,
  BookOpen,
  Target,
  FileText,
  BrainCircuit,
  ExternalLink,
} from "lucide-react";
import JobMatcherModal from "../components/JobMatcherModal";
import ResumeScreenerModal from "../components/modals/ResumeScreenerModal";
import MentalHealthScoreModal from "../components/modals/MentalHealthScoreModal";
import NavProfile from "../components/NavProfile";
import CompanyMarquee from "../components/CompanyMarquee";
import DevRoadmapButton from "../components/roadmap/DevRoadmapButton";
import HomeNotificationsSection from "../components/home/HomeNotificationsSection";
import Footer from "../components/Footer";

export default function LandingPage() {
  const [isJobMatcherOpen, setJobMatcherOpen] = useState(false);
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isMentalHealthScoreOpen, setMentalHealthScoreOpen] = useState(false);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30">
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
          <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
        </Link>
        <div className="hidden xl:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/roadmaps" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-200">
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
          <Link href="/ecosystem" className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Ecosystem
          </Link>
          <button type="button" onClick={() => setResumeScreenerOpen(true)} className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300">
            Resume
          </button>
        </div>
        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 glass">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          flowCTRL 2.0 is now live with 90+ Dev Roadmaps
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl leading-[1.1]">
          Control over your career. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            From confusion to clarity.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-10 leading-relaxed font-normal">
          The first Career Operating System designed to help you identify your
          skill gaps, explore interactive learning roadmaps, and systematically
          land your dream engineering role.
        </p>

        {/* Hero CTA Button Cluster */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <DevRoadmapButton size="md" variant="glow" />
          <Link
            href="?modal=signup"
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-all text-sm"
          >
            Start your journey <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/project-tutorials"
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <Hammer className="w-4 h-4 text-orange-400" />
            Project Tutorials
          </Link>
          <button
            type="button"
            onClick={() => setResumeScreenerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Resume Screener
          </button>
          <button
            type="button"
            onClick={() => setMentalHealthScoreOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            Mental Health Score
          </button>
        </div>
      </section>

      {/* Core Features */}
      <section
        id="features"
        className="py-24 px-6 border-t border-white/10 relative"
      >
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white shadow-sm">
              Everything you need to grow.
            </h2>
            <p className="text-zinc-300 text-lg max-w-2xl">
              Stop guessing what to learn next. flowCTRL analyzes your skills
              and provides a systematic path to your dream career.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1: Interactive Dev Roadmaps */}
            <Link
              href="/roadmaps"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-orange-500/20 hover:border-orange-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-orange-500/20">
                <Compass className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-amber-300">
                  90+ Dev Roadmaps
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  System Design
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Interactive learning graphs with System Design architecture, Frontend, AI, Backend, and DevOps tracks.
              </p>
              <span className="text-xs font-semibold text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Roadmaps <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 2: DSA Engine */}
            <Link
              href="/dsa"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/20">
                <Code className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-emerald-300">
                  DSA Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  6 Languages
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Master core algorithms with visual intuitions, time & space complexity, and progress tracking.
              </p>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Practice Algorithms <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 3: Project-Building Tutorials */}
            <Link
              href="/project-tutorials"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-amber-500/20 hover:border-amber-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-amber-500/20">
                <Hammer className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-amber-300">
                  1,274+ Project Tutorials
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Step-by-Step
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Build SQLite, Redis, Git, Docker, and React from scratch with guided step checkpoints and source attribution.
              </p>
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Build Projects <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>



            {/* Feature 5: Engineering Resources & Books */}
            <Link
              href="/resources"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-blue-500/20 hover:border-blue-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-300">
                  Curated Resources
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Library
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Essential engineering textbooks, architecture whitepapers, official documentation, and cheat sheets.
              </p>
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Browse Library <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 6: RAG AI Assistant */}
            <Link
              href="/assistant"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-pink-500/20 hover:border-pink-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-pink-500/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-pink-300">
                  RAG AI Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Adaptive
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Personalized roadmap generator with semantic search, skill gap detection, and matched tutorials.
              </p>
              <span className="text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ask AI Advisor <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Companies Marquee */}
      <CompanyMarquee />

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-md" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 glass-card p-12 rounded-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            Ready to take control?
          </h2>
          <p className="text-xl text-zinc-300 mb-10">
            Join thousands of ambitious individuals building their careers
            systematically with flowCTRL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="?modal=signup"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Create your free account
            </Link>
            <DevRoadmapButton variant="glow" size="lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeNotificationsSection />
      <Footer />

      <JobMatcherModal isOpen={isJobMatcherOpen} setOpen={setJobMatcherOpen} />
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <MentalHealthScoreModal
        isOpen={isMentalHealthScoreOpen}
        onClose={() => setMentalHealthScoreOpen(false)}
      />
    </div>
  );
}
