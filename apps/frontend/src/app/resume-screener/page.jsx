"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Sparkles } from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";

const EXTERNAL_URL = "https://ats-resume-analysis.netlify.app";

export default function ResumeScreenerPage() {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="flowCTRL Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white hidden sm:inline">
              flowCTRL
            </span>
          </Link>
          <span className="text-zinc-500 mx-1">/</span>
          <span className="font-semibold text-lg tracking-tight text-white truncate max-w-[200px] sm:max-w-md">
            Resume Screener
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/roadmaps"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:inline"
          >
            Roadmaps
          </Link>
          <a
            href={EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-amber-300 hover:text-white border border-orange-500/40 text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
            title="Open external ATS Resume Analysis in new tab"
          >
            <span>Visit Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <NavProfile />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
        {/* Header Banner */}
        <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  ATS Resume Screener
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Live ATS Analysis
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                ATS Resume Analysis & Scoring
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Upload your resume to evaluate ATS compatibility, keyword
                matching, formatting flaws, and get actionable recruiter
                insights.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Home
              </Link>
              <a
                href={EXTERNAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors text-xs shadow-lg shadow-orange-500/20"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Embedded Window Preview */}
        <div className="h-[75vh] md:h-[80vh] w-full glass-card rounded-2xl md:rounded-3xl border border-white/15 flex flex-col overflow-hidden shadow-2xl">
          {/* Fake Window Header */}
          <div className="h-11 border-b border-white/10 flex items-center justify-between px-4 glass shrink-0 relative bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-zinc-400 font-medium hidden sm:inline flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-orange-400" />
                ATS Resume Screener
              </span>
            </div>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs text-zinc-400 font-medium tracking-wide justify-center shadow-inner max-w-sm truncate">
              <span className="opacity-50 mr-1.5">🔒</span>
              {EXTERNAL_URL}
            </div>

            <a
              href={EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 font-medium"
            >
              <span className="hidden sm:inline">Visit Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Embedded Content Container */}
          <div className="relative flex-1 w-full h-full bg-zinc-950 overflow-hidden">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <p className="text-xs text-zinc-400 font-medium">
                  Loading ATS Resume Screener...
                </p>
              </div>
            )}

            <iframe
              src={EXTERNAL_URL}
              title="ATS Resume Screener & Analysis"
              className="w-full h-full border-0 bg-zinc-950"
              allow="clipboard-read; clipboard-write"
              loading="lazy"
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-2 border-t border-white/5 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400 shrink-0">
            <span>
              External tool:{" "}
              <strong className="text-zinc-200">ATS Resume Analysis</strong> •
              Screen resumes, analyze formatting, and view score breakdown
            </span>
            <a
              href={EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline font-medium inline-flex items-center gap-1"
            >
              Open fullscreen <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
