"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import {
  BrainCircuit,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Hammer,
  Clock,
  Layers,
  Zap,
  Target,
  Send,
  Loader2,
  ExternalLink,
  Compass,
  Code,
  FileText
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";

export default function RagAssistantPage() {
  const [query, setQuery] = useState("");
  const [targetRole, setTargetRole] = useState("Backend Engineer");
  const [targetDomain, setTargetDomain] = useState("Product-based company");
  const [currentSkills, setCurrentSkills] = useState("JavaScript, React, Node.js");
  const [yearsOfExperience, setYearsOfExperience] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [completedTopics, setCompletedTopics] = useState(new Set());

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    const skillsArray = currentSkills
      .split(",")
      .map((s) => ({ name: s.trim(), proficiency: 3 }))
      .filter((s) => s.name);

    const payload = {
      query: query.trim() || `I want to become a ${targetRole} in a ${targetDomain}`,
      targetRole,
      targetDomain,
      currentSkills: skillsArray,
      yearsOfExperience: Number(yearsOfExperience),
      timeCommitmentHoursPerWeek: 15,
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/rag/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to generate roadmap");
      }

      setResult(data.data);
    } catch (err) {
      console.error("RAG Generation error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicName) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicName)) next.delete(topicName);
      else next.add(topicName);
      return next;
    });
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to Home"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">fC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              <BrandWordmark className="text-lg" />{" "}<span className="text-pink-400 font-normal">/ Career Assistant</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/roadmaps" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-400" />
            Roadmaps
          </Link>
          <Link href="/dsa" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-400" />
            DSA
          </Link>
          <Link href="/project-tutorials" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <Hammer className="w-4 h-4 text-amber-400" />
            Tutorials
          </Link>
          <Link href="/resources" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            Resources
          </Link>
          <Link href="/assistant" className="text-pink-400 font-semibold flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-pink-400" />
            Career Assistant
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <BrainCircuit className="w-3.5 h-3.5" />
            Personalized Guidance • Built Around Your Goals
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Find Your Path. Plan Your Next Move.
          </h1>
          <p className="text-zinc-300 max-w-3xl text-sm sm:text-base leading-relaxed">
            Tell us what you know and where you want to go. We&apos;ll help you find the skills to learn, create a clear roadmap, and discover projects and resources that move you closer to your goal.
          </p>
        </div>

        {/* Input Form Panel */}
        <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 mb-10 shadow-xl">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Your Goal or Current Situation
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. I am a college student learning JavaScript and React, and I want to prepare for frontend developer roles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Target Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                  <option value="DevOps Engineer">DevOps & Cloud Architect</option>
                  <option value="AI Engineer">AI / Machine Learning Engineer</option>
                  <option value="Security Analyst">Security Analyst</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Target Environment
                </label>
                <select
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                >
                  <option value="Product-based company">Product-based Company</option>
                  <option value="Fast-paced Startup">Fast-growing Startup</option>
                  <option value="Fintech / Enterprise">Tech Enterprise</option>
                  <option value="Frontier R&D">Research &amp; Innovation Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Skills You Know (Comma-Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. JavaScript, React, SQL"
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Years of Experience (0 for Students)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Planning Your Learning Path...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Plan My Career Roadmap
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Area */}
        {result && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header info */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
              <h2 className="text-2xl font-bold text-white mb-2">
                {result.roadmapTitle || result.title || "Custom Engineering Learning Path"}
              </h2>
              {result.summary && (
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">{result.summary}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
                {result.estimatedTotalWeeks && (
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <Clock className="w-4 h-4" /> {result.estimatedTotalWeeks} Weeks Planned
                  </span>
                )}
                {result.totalTopicsCount && (
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> {result.totalTopicsCount} Core Curriculum Topics
                  </span>
                )}
              </div>
            </div>

            {/* 1. Skill Progression Card */}
            {(result.skillGapAnalysis || result.skillGapMetrics) && (
              <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" /> Skills You Have &amp; What to Learn Next
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Target Role: <span className="text-zinc-200 font-semibold">{result.targetRole || targetRole}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                    Skills to Focus On: {result.skillGapMetrics?.totalGapsIdentified || 6}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Matched Skills */}
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Skills You Already Have
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentSkills.split(",").map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
                        >
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Priority Skills to Learn */}
                  <div>
                    <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Priority Concepts to Learn Next
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Distributed Systems", "Message Queues", "Database Indexing", "Caching Strategies", "System Architecture", "API Observability"].map((gap, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium"
                        >
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Structured Learning Stages */}
            {result.stages && result.stages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" /> Your Step-by-Step Learning Milestones
                </h3>

                <div className="space-y-4">
                  {result.stages.map((stage, sIdx) => {
                    const stageTitle = stage.stageName || stage.title || `Stage ${sIdx + 1}`;
                    const stageItems = stage.items || stage.topics || [];

                    return (
                      <div
                        key={sIdx}
                        className="glass p-6 rounded-2xl border border-white/10 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <div>
                            <div className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">
                              Milestone {sIdx + 1}
                            </div>
                            <h4 className="text-lg font-bold text-zinc-100">{stageTitle}</h4>
                            {stage.stageDescription && (
                              <p className="text-xs text-zinc-400 mt-0.5">{stage.stageDescription}</p>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            Estimated: {stage.estimatedWeeks || 3} weeks
                          </div>
                        </div>

                        {/* Topics inside stage */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {stageItems.map((topic, tIdx) => {
                            const topicName = typeof topic === "string" ? topic : (topic.topic || topic.name || topic.title);
                            const isDone = completedTopics.has(topicName);
                            const effort = typeof topic === "object" ? topic.estimatedEffort : null;
                            const difficulty = typeof topic === "object" ? topic.difficulty : null;

                            return (
                              <div
                                key={tIdx}
                                onClick={() => toggleTopic(topicName)}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                  isDone
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                    : "bg-zinc-900/60 border-white/5 hover:border-white/10 text-zinc-200"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 truncate">
                                    <CheckCircle2
                                      className={`w-4 h-4 shrink-0 ${
                                        isDone ? "text-emerald-400 fill-emerald-400/20" : "text-zinc-600"
                                      }`}
                                    />
                                    <span className={`text-xs font-semibold truncate ${isDone ? "line-through text-zinc-400" : ""}`}>
                                      {topicName}
                                    </span>
                                  </div>
                                  {difficulty && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-zinc-400">
                                      {difficulty}
                                    </span>
                                  )}
                                </div>

                                {typeof topic === "object" && topic.whyRecommended && (
                                  <p className="text-[11px] text-zinc-400 line-clamp-2">
                                    {topic.whyRecommended}
                                  </p>
                                )}

                                {effort && (
                                  <div className="text-[10px] text-amber-400/80 font-mono">
                                    {effort}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Recommended Projects */}
            <div className="glass p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-orange-400" /> Recommended Projects to Build
              </h3>
              <p className="text-xs text-zinc-400">
                Hands-on project tutorials selected from our catalog to help you turn concepts into practical experience.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {[
                  {
                    title: "Build Your Own Redis from Scratch",
                    slug: "build-your-own-redis",
                    description: "Implement in-memory RESP protocol, event loops, and TTL expiry in C/Python.",
                    language: "C / Python",
                    priority: "CRITICAL"
                  },
                  {
                    title: "Build Your Own SQLite Database from Scratch",
                    slug: "build-your-own-sqlite-database",
                    description: "Construct B-Tree indexes, pager engines, and SQL REPL parsing.",
                    language: "C / Rust",
                    priority: "RECOMMENDED"
                  },
                  {
                    title: "Write Yourself a Git! (Content-Addressable Storage)",
                    slug: "write-yourself-a-git",
                    description: "Learn commit trees, SHA-1 hashes, and DAG storage structures.",
                    language: "Python",
                    priority: "RECOMMENDED"
                  },
                  {
                    title: "Build Your Own Container Using Less Than 100 Lines of Go",
                    slug: "build-your-own-container-using-less-than-100-lines-of-go",
                    description: "Namespaces, cgroups, chroot, and isolated Linux processes.",
                    language: "Go",
                    priority: "CORE SKILL"
                  }
                ].map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {rec.priority}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">{rec.language}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 mb-1">
                        {rec.title}
                      </h4>
                      <p className="text-zinc-400 text-xs leading-relaxed mb-3">
                        {rec.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <Link
                        href={`/project-tutorials/${rec.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline"
                      >
                        Launch Build Guide <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
