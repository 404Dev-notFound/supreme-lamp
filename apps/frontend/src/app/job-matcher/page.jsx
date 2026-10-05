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
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to Home"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              flowCTRL{" "}
              <span className="text-orange-400 font-normal">/ Job Matcher</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/roadmaps"
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:inline"
          >
            Roadmaps
          </Link>
          <NavProfile />
        </div>
      </nav>

      {/* Hero Header */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto w-full relative z-10 flex-1">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI Opportunity Radar Active
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-3">
            Opportunities matched to your skills
          </h1>
          <p className="text-sm text-zinc-400">
            Compare your competency map against live roles from top engineering teams.
          </p>
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
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50"
            >
              <option value="" className="bg-zinc-900 text-white">All Work Modes</option>
              <option value="Remote" className="bg-zinc-900 text-white">Remote</option>
              <option value="Hybrid" className="bg-zinc-900 text-white">Hybrid</option>
              <option value="Onsite" className="bg-zinc-900 text-white">Onsite</option>
            </select>

            <select
              value={filters.experience}
              onChange={(e) => handleFilterChange("experience", e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50"
            >
              <option value="" className="bg-zinc-900 text-white">All Experience Levels</option>
              <option value="Junior" className="bg-zinc-900 text-white">Junior (0-2y)</option>
              <option value="Mid" className="bg-zinc-900 text-white">Mid-Level (3-5y)</option>
              <option value="Senior" className="bg-zinc-900 text-white">Senior (5+y)</option>
              <option value="Lead" className="bg-zinc-900 text-white">Lead / Principal</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary/50"
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
              const match = job.matchScore || job.matchPct || 85;
              return (
                <div
                  key={job.id}
                  className="p-6 rounded-3xl glass-card border border-white/10 hover:border-orange-500/30 transition-all bg-zinc-950/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                          {job.company || "Leading Tech Co"}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {job.title}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {match}% Match
                        </span>
                      </div>
                    </div>

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

                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
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

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <Link
                      href="/roadmaps"
                      className="text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      View skill gaps
                    </Link>
                    <a
                      href={job.applyUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      Apply Now <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
