"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  Filter,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-3xl glass-card border border-white/10 p-6 md:p-8 text-left align-middle shadow-2xl transition-all">
                {/* Window Controls & Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="w-3.5 h-3.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors cursor-pointer"
                    />
                    <div className="w-3.5 h-3.5 bg-yellow-500/80 rounded-full" />
                    <div className="w-3.5 h-3.5 bg-green-500/80 rounded-full" />
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold text-white flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    Job Matcher & Opportunity Radar
                  </Dialog.Title>
                  <div className="w-12" />
                </div>

                {/* Profile Overview Card */}
                <section className="mb-6 p-5 rounded-2xl glass border border-white/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3">
                    Your Target Profile
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-300">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">
                        Target Role
                      </span>
                      <strong className="text-white text-sm">
                        Software Engineer
                      </strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">
                        Experience
                      </span>
                      <strong className="text-white text-sm">3 years</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">
                        Readiness Score
                      </span>
                      <strong className="text-amber-400 text-sm">78%</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">
                        Target Industry
                      </span>
                      <strong className="text-white text-sm">
                        Technology & AI
                      </strong>
                    </div>
                  </div>
                </section>

                {/* Filters & Sorting */}
                <section className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer">
                      <Filter className="w-3.5 h-3.5 text-zinc-400" /> Filters
                    </button>
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-xl px-3 py-1.5 glass border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-orange-500/50 bg-zinc-900 cursor-pointer"
                  >
                    <option value="best">Best Match</option>
                    <option value="readiness">Highest Readiness</option>
                    <option value="latest">Latest</option>
                  </select>
                </section>

                {/* Job Listings with Skeletons */}
                <section className="max-h-[55vh] overflow-y-auto pr-1">
                  {loading && <JobMatcherSkeleton />}

                  {error && (
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-400 text-sm flex flex-col items-center gap-2">
                      <AlertCircle className="w-6 h-6" />
                      <span>{error}</span>
                    </div>
                  )}

                  {!loading && !error && (!jobs || jobs.length === 0) && (
                    <div className="text-center py-12 glass-card rounded-2xl border border-white/10">
                      <Building2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white mb-1">
                        No job matches found for current criteria
                      </p>
                      <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                        Try broadening your skill profile or filter settings.
                      </p>
                    </div>
                  )}

                  {!loading && !error && jobs && jobs.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-5 rounded-2xl glass-card border border-white/10 flex flex-col justify-between hover:border-orange-500/30 transition-all group"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              {job.company?.logo ? (
                                <img
                                  src={job.company.logo}
                                  alt={job.company.name}
                                  className="w-9 h-9 rounded-xl object-cover bg-white/10"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                                  {job.company?.name?.[0] || "J"}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h5 className="font-semibold text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                                  {job.title}
                                </h5>
                                <p className="text-xs text-zinc-400 truncate">
                                  {job.company?.name} • {job.location} (
                                  {job.workMode})
                                </p>
                              </div>
                            </div>

                            {/* Skills Tag Cloud */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {(job.matchedSkills || []).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full"
                                >
                                  {s}
                                </span>
                              ))}
                              {(job.missingSkills || []).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 text-zinc-500 line-through rounded-full"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-300">
                              {job.matchPercent}% Match
                            </span>
                            <div className="flex items-center gap-2">
                              <Link
                                href="/roadmaps"
                                onClick={() => setOpen(false)}
                                className="text-xs text-zinc-400 hover:text-white transition-colors"
                              >
                                Roadmap
                              </Link>
                              <button className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer">
                                Apply <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
