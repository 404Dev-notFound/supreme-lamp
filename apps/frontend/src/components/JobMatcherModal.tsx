"use client";
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Filter, ArrowRight } from "lucide-react";
import useJobMatches from "../lib/useJobMatches";

interface JobMatcherModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export default function JobMatcherModal({
  isOpen,
  setOpen,
}: JobMatcherModalProps) {
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all glass">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="w-3 h-3 bg-red-500 rounded-full hover:opacity-80"
                    ></button>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium text-gray-900 dark:text-white"
                  >
                    Job Matcher
                  </Dialog.Title>
                </div>

                {/* Profile Overview */}
                <section className="mb-6 glass-card p-4 rounded-lg">
                  <h4 className="text-md font-semibold mb-2">Your Profile</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>
                      <strong>Target Role:</strong> Software Engineer
                    </div>
                    <div>
                      <strong>Experience:</strong> 3 years
                    </div>
                    <div>
                      <strong>Readiness Score:</strong>{" "}
                      <span className="text-amber-600">78%</span>
                    </div>
                    <div>
                      <strong>Preferred Industry:</strong> Technology
                    </div>
                  </div>
                </section>

                {/* Filters */}
                <section className="mb-4 flex flex-wrap gap-2 items-center">
                  <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-sm">
                    <Filter size={14} /> Filters
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded px-2 py-1 bg-white dark:bg-zinc-800 text-sm"
                  >
                    <option value="best">Best Match</option>
                    <option value="readiness">Highest Readiness</option>
                    <option value="latest">Latest</option>
                  </select>
                </section>

                {/* Job List */}
                <section className="max-h-[60vh] overflow-y-auto">
                  {loading && (
                    <p className="text-center py-4">Loading matches…</p>
                  )}
                  {error && (
                    <p className="text-center text-red-500 py-4">
                      Failed to load matches.
                    </p>
                  )}
                  {jobs && jobs.length === 0 && (
                    <p className="text-center py-4">No matches found.</p>
                  )}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs &&
                      jobs.map((job) => (
                        <div
                          key={job.id}
                          className="glass-card p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.company.logo}
                              alt={job.company.name}
                              className="w-8 h-8 rounded mr-2"
                            />
                            <h5 className="font-semibold text-gray-900 dark:text-white">
                              {job.title}
                            </h5>
                            {/* Placeholder for company name and location */}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                            {job.company.name} • {job.location} ({job.workMode})
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {job.matchedSkills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {job.missingSkills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded line-through"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-marigold-600 font-medium">
                              Match {job.matchPercent}%
                            </span>
                            <button className="flex items-center gap-1 text-primary hover:underline">
                              Apply <ArrowRight size={14} />
                            </button>
                          </div>
                          <button
                            className="mt-2 w-full text-left text-sm text-indigo-600 hover:underline"
                            onClick={() => (window.location.href = "/roadmap")}
                          >
                            Improve Match
                          </button>
                        </div>
                      ))}
                  </div>
                </section>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
