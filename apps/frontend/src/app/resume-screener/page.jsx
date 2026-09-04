"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  BarChart,
} from "lucide-react";
import NavProfile from "../../components/NavProfile";
import Link from "next/link";
import ResumeScreenerSkeleton from "@/components/skeletons/ResumeScreenerSkeleton";

export default function ResumeScreener() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Connect to the resume screener microservice
      const res = await fetch("http://localhost:5001/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze resume");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze resume. Please ensure the Resume Screener service is active.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-2">
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
              flowCTRL
            </span>
          </Link>
          <span className="text-zinc-500 mx-2">/</span>
          <span className="font-medium text-zinc-300">Resume Screener</span>
        </div>
        <div className="flex items-center gap-4">
          <NavProfile />
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            ATS Resume Checker
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Upload your resume to get an instant ATS compatibility score,
            identify missing keywords, and receive actionable feedback.
          </p>
        </div>

        {!result && !loading && (
          <div className="max-w-xl mx-auto">
            <div className="glass-card p-10 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload your resume</h3>
              <p className="text-zinc-400 mb-8 text-sm">
                PDF format only. Maximum 8MB.
              </p>

              <label className="cursor-pointer relative group w-full">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl p-4 transition-all">
                  <FileText className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-zinc-300 group-hover:text-white font-medium transition-colors">
                    {file ? file.name : "Select PDF file"}
                  </span>
                </div>
              </label>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  Analyze Resume
                </button>
              )}

              {error && (
                <div className="mt-6 p-4 w-full rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-left flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-6">
            <div className="text-center py-4 text-sm text-zinc-400 animate-pulse">
              Analyzing resume layout, keywords, and ATS parsing structure...
            </div>
            <ResumeScreenerSkeleton />
          </div>
        )}

        {result && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Score Card */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 glass-card p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                <div className="relative mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className="stroke-white/10"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      className={`stroke-current ${result.overall_score >= 80 ? "text-green-500" : result.overall_score >= 50 ? "text-yellow-500" : "text-red-500"}`}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray="351.86"
                      strokeDashoffset={
                        351.86 - (351.86 * result.overall_score) / 100
                      }
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold">
                      {result.overall_score}
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">{result.verdict}</h2>
                <p className="text-zinc-400 text-sm">{result.verdict_reason}</p>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="mt-6 text-sm text-primary hover:underline cursor-pointer"
                >
                  Upload another resume
                </button>
              </div>

              <div className="md:col-span-2 flex flex-col gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-blue-400" /> ATS
                      Compatibility
                    </h3>
                    <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                      {result.ats_compatibility?.score || 0}/100
                    </div>
                  </div>
                  {result.ats_compatibility?.issues &&
                  result.ats_compatibility.issues.length > 0 ? (
                    <ul className="space-y-3">
                      {result.ats_compatibility.issues.map((issue, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-zinc-300"
                        >
                          <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span>
                        No major ATS parsing issues found. Formatting looks
                        clean.
                      </span>
                    </div>
                  )}
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10 flex-1">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-primary" /> Top Priority
                    Fixes
                  </h3>
                  <ul className="space-y-3">
                    {result.top_3_priority_fixes?.map((fix, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-zinc-300"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Strengths & Flaws */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Key Strengths
                </h3>
                <ul className="space-y-4">
                  {result.strengths?.map((str, i) => (
                    <li
                      key={i}
                      className="bg-white/5 p-4 rounded-xl border border-white/5"
                    >
                      <p className="font-medium text-sm text-zinc-200 mb-1">
                        {str.point}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {str.why_it_matters}
                      </p>
                    </li>
                  ))}
                  {(!result.strengths || result.strengths.length === 0) && (
                    <p className="text-sm text-zinc-500">
                      No major strengths identified.
                    </p>
                  )}
                </ul>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {result.flaws?.map((flaw, i) => (
                    <li
                      key={i}
                      className="bg-white/5 p-4 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${flaw.severity === "Critical" ? "bg-red-500/20 text-red-400" : flaw.severity === "Major" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}
                        >
                          {flaw.severity}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-zinc-200 mb-1">
                        {flaw.issue}
                      </p>
                      <p className="text-xs text-zinc-500">
                        <span className="text-primary">Fix:</span> {flaw.fix}
                      </p>
                    </li>
                  ))}
                  {(!result.flaws || result.flaws.length === 0) && (
                    <p className="text-sm text-green-500">
                      No major flaws identified! Great job.
                    </p>
                  )}
                </ul>
              </div>
            </div>

            {/* Section Feedback */}
            {result.section_feedback && (
              <div className="glass-card p-6 rounded-2xl border border-white/10">
                <h3 className="text-lg font-semibold mb-6">
                  Section-by-Section Feedback
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(result.section_feedback).map(
                    ([section, feedback], i) => (
                      <div key={i} className="bg-white/5 p-4 rounded-xl">
                        <h4 className="capitalize font-medium text-sm text-zinc-300 mb-2">
                          {section}
                        </h4>
                        <p className="text-sm text-zinc-500">{feedback}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
