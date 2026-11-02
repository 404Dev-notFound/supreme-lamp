"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Filter,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle2,
  X,
  Target,
} from "lucide-react";
import useJobMatches from "../lib/useJobMatches";
import JobMatcherSkeleton from "./skeletons/JobMatcherSkeleton";
import Link from "next/link";

export default function JobMatcherModal({ isOpen, setOpen }) {
  const [filters] = useState({
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

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl glass-card border border-white/10 text-left align-middle shadow-2xl transition-all">
                {/* Modal Header — mirrors ATS Screener modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-white/[0.02]">
                  {/* Left: Window Controls + Title */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center space-x-2 mr-1">
                      <button
                        onClick={() => setOpen(false)}
                        aria-label="Close"
                        className="w-3.5 h-3.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors cursor-pointer"
                      />
                      <div className="w-3.5 h-3.5 bg-yellow-500/80 rounded-full" />
                      <div className="w-3.5 h-3.5 bg-green-500/80 rounded-full" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <Dialog.Title
                        as="h3"
                        className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2"
                      >
                        Job Matcher
                      </Dialog.Title>
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                        <Sparkles className="w-3 h-3" />
                        Opportunity Radar
                      </span>
                    </div>
                  </div>

                  {/* Right: View Full Page + Close */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Link
                      href="/job-matcher"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary hover:text-white border border-primary/40 text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                    >
                      <span>Full Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8">
                  {/* Profile Overview Card */}
                  <section className="mb-6 p-5 rounded-2xl glass border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                      Your Target Profile
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-300">
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Target Role</span>
                        <strong className="text-white text-sm">Software Engineer</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Experience</span>
                        <strong className="text-white text-sm">3 years</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Readiness Score</span>
                        <strong className="text-amber-400 text-sm">78%</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 block mb-0.5">Target Industry</span>
                        <strong className="text-white text-sm">Technology & AI</strong>
                      </div>
                    </div>
                  </section>

                  {/* Filters & Sorting */}
                  <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer">
                        <Filter className="w-3.5 h-3.5 text-zinc-300" /> Filters
                      </button>
                    </div>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="rounded-xl px-3 py-1.5 glass border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-primary/50 bg-zinc-900 cursor-pointer"
                    >
                      <option value="best">Best Match</option>
                      <option value="readiness">Highest Readiness</option>
                      <option value="latest">Latest</option>
                    </select>
                  </section>

                  {/* Job Listings */}
                  <section className="max-h-[52vh] overflow-y-auto pr-1 space-y-0">
                    {loading && <JobMatcherSkeleton />}

                    {error && (
                      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-400 text-sm flex flex-col items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        <span>{error}</span>
                      </div>
                    )}

                    {!loading && !error && (!jobs || jobs.length === 0) && (
                      <div className="text-center py-12 glass-card rounded-2xl border border-white/10">
                        <Building2 className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-white mb-1">
                          No job matches found for current criteria
                        </p>
                        <p className="text-xs text-zinc-300 max-w-xs mx-auto">
                          Try broadening your skill profile or filter settings.
                        </p>
                      </div>
                    )}

                    {!loading && !error && jobs && jobs.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {jobs.map((job) => {
                          const match = job.matchPercent ?? job.matchScore ?? job.matchPct ?? 85;
                          const companyName =
                            (typeof job.company === "object"
                              ? job.company?.name
                              : job.company) || "Tech Co";
                          const companyInitial = companyName[0];

                          return (
                            <div
                              key={job.id}
                              className="p-5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between hover:border-primary/30 transition-all group"
                            >
                              <div>
                                {/* Company + Title */}
                                <div className="flex items-center gap-3 mb-3">
                                  {job.company?.logo ? (
                                    <img
                                      src={job.company.logo}
                                      alt={companyName}
                                      className="w-9 h-9 rounded-xl object-cover bg-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
                                      {companyInitial}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-semibold text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                                      {job.title}
                                    </h5>
                                    <p className="text-xs text-zinc-300 truncate">
                                      {companyName} • {job.location} ({job.workMode})
                                    </p>
                                  </div>
                                </div>

                                {/* Match progress micro bar */}
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full"
                                    style={{ width: `${Math.min(Number(match), 100)}%` }}
                                  />
                                </div>

                                {/* Skills */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {(job.matchedSkills || []).map((s) => (
                                    <span
                                      key={s}
                                      className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full"
                                    >
                                      <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                      {s}
                                    </span>
                                  ))}
                                  {(job.missingSkills || []).map((s) => (
                                    <span
                                      key={s}
                                      className="px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-400 line-through rounded-full"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-300">
                                  {match}% Match
                                </span>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href="/roadmaps"
                                    onClick={() => setOpen(false)}
                                    className="text-xs text-zinc-300 hover:text-white transition-colors"
                                  >
                                    Roadmap
                                  </Link>
                                  <a
                                    href={job.applyUrl || "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-amber-300 transition-colors"
                                  >
                                    Apply <ArrowRight className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>

                {/* Modal Footer Bar */}
                <div className="px-6 py-2.5 border-t border-white/5 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 shrink-0">
                  <span>
                    Job Matcher · Scripted by{" "}
                    <a
                      href="mailto:scriptedbydev@gmail.com"
                      className="text-zinc-300 hover:text-amber-300 font-semibold transition-colors"
                    >
                      dev
                    </a>{" "}
                    · flowCTRL Ecosystem
                  </span>
                  <Link
                    href="/job-matcher"
                    onClick={() => setOpen(false)}
                    className="text-primary hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    Open full page <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
