"use client";

import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, ExternalLink, FileText, Sparkles } from "lucide-react";

const EXTERNAL_URL = "https://ats-resume-analysis.netlify.app";

export default function ResumeScreenerModal({ isOpen, onClose }) {
  const [iframeLoading, setIframeLoading] = useState(true);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
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
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-[96vw] max-w-6xl h-[92vh] md:h-[88vh] transform overflow-hidden rounded-2xl md:rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 flex flex-col text-left transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 shrink-0 bg-white/[0.02]">
                  {/* Left: Window Controls + Title */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center space-x-2 mr-1">
                      <button
                        onClick={onClose}
                        aria-label="Close"
                        className="w-3.5 h-3.5 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors cursor-pointer"
                      />
                      <div className="w-3.5 h-3.5 bg-yellow-500/80 rounded-full" />
                      <div className="w-3.5 h-3.5 bg-green-500/80 rounded-full" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <Dialog.Title
                        as="h3"
                        className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2"
                      >
                        Resume Screener
                      </Dialog.Title>
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 gap-1">
                        <Sparkles className="w-3 h-3" />
                        ATS Analysis
                      </span>
                    </div>
                  </div>

                  {/* Right: Visit Website + Close Button */}
                  <div className="flex items-center gap-2 sm:gap-3">
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

                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Embedded Website Container */}
                <div className="relative flex-1 w-full h-full bg-zinc-950 overflow-hidden">
                  {iframeLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
                      <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-zinc-300 font-medium">
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

                {/* Footer Bar */}
                <div className="px-4 sm:px-6 py-2 border-t border-white/5 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 shrink-0">
                  <span className="truncate">
                    ATS Resume Analysis • PDF resume screening, keyword matching, and recruiter scoring
                  </span>
                  <a
                    href={EXTERNAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline font-medium inline-flex items-center gap-1 shrink-0"
                  >
                    Open in new tab <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
