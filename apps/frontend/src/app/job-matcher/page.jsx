"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import useJobMatches from "@/lib/useJobMatches";
import JobMatcherSkeleton from "@/components/skeletons/JobMatcherSkeleton";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";

export default function JobMatcherPage() {
  const [filters, setFilters] = useState({
    role: "",
    industry: "",
    location: "",
    workMode: "",
    experience: "",
    salaryMin: "",
    salaryMax: "",
    matchPct: "",
  });
  const [sort, setSort] = useState("best");
  const { data: jobs, loading, error } = useJobMatches(filters, sort);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 flex flex-col justify-between">
      {/* Navigation — consistent with ATS Screener page pattern */}
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
          <span className="text-zinc-400 mx-1">/</span>
          <span className="font-semibold text-lg tracking-tight text-white truncate max-w-[200px] sm:max-w-md">
            Job Matcher
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/roadmaps"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:inline"
          >
            Roadmaps
          </Link>
          <Link
            href="/resume-screener"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-amber-300 hover:text-white border border-orange-500/40 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            ATS Screener
          </Link>
          <NavProfile />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 w-full flex-1 relative z-10">
        {/* Header Banner — mirrors ATS Screener page design */}
        <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  AI Opportunity Radar
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Live Job Matching
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                Opportunities Matched to Your Skills
              </h1>
              <p className="text-sm text-zinc-300 max-w-2xl font-normal leading-relaxed">
                Compare your competency map against live roles from top
                engineering teams. Filter by work mode, experience, and salary range.
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
              <Link
                href="/roadmaps"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-xs shadow-lg shadow-primary/20"
              >
                View Roadmaps <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl glass-card border border-white/10 mb-8 flex flex-wrap items-center justify-between gap-4 bg-zinc-950/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              <span>Filters:</span>
            </div>

            <select
              value={filters.workMode}
              onChange={(e) => handleFilterChange("workMode", e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-white">All Work Modes</option>
              <option value="Remote" className="bg-zinc-900 text-white">Remote</option>
              <option value="Hybrid" className="bg-zinc-900 text-white">Hybrid</option>
              <option value="Onsite" className="bg-zinc-900 text-white">Onsite</option>
            </select>

            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange("experience", e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="" className="bg-zinc-900 text-white">All Experience Levels</option>
              <option value="Junior" className="bg-zinc-900 text-white">Junior (0–2y)</option>
              <option value="Mid" className="bg-zinc-900 text-white">Mid-Level (3–5y)</option>
              <option value="Senior" className="bg-zinc-900 text-white">Senior (5+y)</option>
              <option value="Lead" className="bg-zinc-900 text-white">Lead / Principal</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="best" className="bg-zinc-900 text-white">Best Match</option>
              <option value="salary" className="bg-zinc-900 text-white">Highest Compensation</option>
              <option value="recent" className="bg-zinc-900 text-white">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <JobMatcherSkeleton />
        ) : error ? (
          <div className="p-8 rounded-2xl glass-card border border-red-500/20 bg-red-500/5 text-center text-red-400 text-sm">
            {error}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="p-12 rounded-3xl glass-card border border-white/10 text-center bg-zinc-950/40">
            <Building2 className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              No matching positions found
            </h3>
            <p className="text-xs text-zinc-400">
              Try adjusting your filters or explore learning roadmaps to expand your matching skills.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map((job) => {
              const match = job.matchPercent ?? job.matchScore ?? job.matchPct ?? 85;
              const companyName =
                (typeof job.company === "object" ? job.company?.name : job.company) ||
                "Leading Tech Co";
              const companyInitial = companyName[0];

              return (
                <div
                  key={job.id}
                  className="p-6 rounded-3xl glass-card border border-white/10 hover:border-primary/30 transition-all bg-zinc-950/50 flex flex-col justify-between group"
                >
                  <div>
                    {/* Company + Title + Match Badge */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        {job.company?.logo ? (
                          <img
                            src={job.company.logo}
                            alt={companyName}
                            className="w-10 h-10 rounded-xl object-cover bg-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                            {companyInitial}
                          </div>
                        )}
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-0.5">
                            {companyName}
                          </span>
                          <h3 className="text-base font-bold text-white leading-tight group-hover:text-amber-200 transition-colors">
                            {job.title}
                          </h3>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        {match}% Match
                      </span>
                    </div>

                    {/* Match Progress Bar */}
                    <div className="mb-4">
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(Number(match), 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mb-4">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {job.location || "Remote"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                        {job.workMode || "Full-time"}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 text-zinc-300 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    {/* Matched Skills (green) */}
                    {job.matchedSkills && job.matchedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {job.matchedSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            {s}
                          </span>
                        ))}
                        {(job.missingSkills || []).map((s, idx) => (
                          <span
                            key={`miss-${idx}`}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-500 line-through"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Generic skills fallback */}
                    {!job.matchedSkills && job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {job.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-3">
                    <Link
                      href="/roadmaps"
                      className="text-xs text-zinc-400 hover:text-amber-300 transition-colors"
                    >
                      View skill gaps →
                    </Link>
                    <a
                      href={job.applyUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm shadow-primary/20"
                    >
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Scripted by dev attribution */}
        <div className="mt-12 text-center text-xs text-zinc-500 select-none">
          <span>flowCTRL Job Matcher · Scripted by </span>
          <a
            href="mailto:scriptedbydev@gmail.com"
            className="text-zinc-400 hover:text-amber-300 font-semibold transition-colors"
            title="scriptedbydev@gmail.com"
          >
            dev
          </a>
          <span> · flowCTRL Ecosystem</span>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
