"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Code,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Copy,
  Check,
  Compass,
  Hammer,
  FileText,
  BrainCircuit,
  Terminal,
  BookOpen,
  Cpu,
  GitBranch,
  Lightbulb,
  AlertTriangle,
  Play
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import { dsaService } from "@/services/dsa.service";
import { indexedDbStorage, STORES } from "@/lib/storage/indexedDbStorage";

const LANGUAGE_BADGES = {
  python: { label: "Python", color: "from-blue-500 to-yellow-500", icon: "Py" },
  javascript: { label: "JavaScript", color: "from-yellow-400 to-amber-500", icon: "JS" },
  typescript: { label: "TypeScript", color: "from-blue-600 to-cyan-500", icon: "TS" },
  java: { label: "Java", color: "from-orange-500 to-red-600", icon: "Jv" },
  cpp: { label: "C++", color: "from-blue-700 to-indigo-600", icon: "C++" },
  c: { label: "C", color: "from-slate-500 to-zinc-400", icon: "C" },
  go: { label: "Go", color: "from-cyan-400 to-blue-500", icon: "Go" },
  rust: { label: "Rust", color: "from-orange-600 to-amber-700", icon: "Rs" },
  csharp: { label: "C#", color: "from-purple-600 to-indigo-500", icon: "C#" },
  ruby: { label: "Ruby", color: "from-red-600 to-rose-700", icon: "Rb" },
  php: { label: "PHP", color: "from-indigo-400 to-blue-600", icon: "PHP" },
  swift: { label: "Swift", color: "from-orange-500 to-rose-500", icon: "Sw" },
  kotlin: { label: "Kotlin", color: "from-purple-500 to-pink-500", icon: "Kt" },
  dart: { label: "Dart", color: "from-cyan-500 to-blue-600", icon: "Dt" },
  scala: { label: "Scala", color: "from-red-500 to-orange-500", icon: "Sc" },
  julia: { label: "Julia", color: "from-purple-600 to-red-500", icon: "Jl" },
  haskell: { label: "Haskell", color: "from-indigo-600 to-purple-500", icon: "Hs" },
  zig: { label: "Zig", color: "from-amber-500 to-orange-600", icon: "Zg" },
  lua: { label: "Lua", color: "from-blue-500 to-indigo-700", icon: "Lua" },
  clojure: { label: "Clojure", color: "from-green-500 to-emerald-600", icon: "Clj" },
  r: { label: "R", color: "from-blue-600 to-slate-400", icon: "R" },
  fsharp: { label: "F#", color: "from-cyan-600 to-teal-500", icon: "F#" },
  solidity: { label: "Solidity", color: "from-zinc-400 to-slate-600", icon: "Sol" },
  assembly: { label: "Assembly", color: "from-emerald-600 to-teal-700", icon: "Asm" },
};

export default function DsaPage() {
  const [languages, setLanguages] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedAlgo, setSelectedAlgo] = useState(null);
  const [activeCodeLang, setActiveCodeLang] = useState("python");
  const [solvedMap, setSolvedMap] = useState({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flowctrl_dsa_solved");
      if (saved) setSolvedMap(JSON.parse(saved));
    } catch {}
  }, []);

  // Fetch languages and algorithms from client-side SWR cache / backend
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      dsaService.fetchLanguages({
        onBackgroundUpdate: (freshLangs) => {
          if (isMounted && Array.isArray(freshLangs) && freshLangs.length > 0) {
            setLanguages(freshLangs);
          }
        },
      }),
      dsaService.fetchAlgorithms({
        onBackgroundUpdate: (freshAlgos) => {
          if (isMounted && Array.isArray(freshAlgos) && freshAlgos.length > 0) {
            setAlgorithms(freshAlgos);
            const cats = Array.from(new Set(freshAlgos.map((a) => a.category)));
            setCategories(cats);
          }
        },
      }),
    ])
      .then(([langs, algos]) => {
        if (!isMounted) return;
        if (Array.isArray(langs) && langs.length > 0) {
          setLanguages(langs);
          setSelectedLanguage(langs[0].id);
          setActiveCodeLang(langs[0].id);
        }
        if (Array.isArray(algos) && algos.length > 0) {
          setAlgorithms(algos);
          if (algos.length > 0) {
            setSelectedAlgo(algos[0]);
          }
          const cats = Array.from(new Set(algos.map((a) => a.category)));
          setCategories(cats);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load DSA from cache/backend:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync active code language when selected language changes
  const handleSelectLanguage = (langId) => {
    setSelectedLanguage(langId);
    setActiveCodeLang(langId);
  };

  const toggleSolved = (slug) => {
    const next = { ...solvedMap, [slug]: !solvedMap[slug] };
    setSolvedMap(next);
    try {
      localStorage.setItem("flowctrl_dsa_solved", JSON.stringify(next));
    } catch {}
    indexedDbStorage.set(STORES.USER_PROGRESS, {
      key: "dsa:solved",
      solvedMap: next,
      updatedAt: Date.now(),
    }).catch(() => {});
  };

  // Filter algorithms by selected language, search, category, difficulty
  const filteredAlgorithms = useMemo(() => {
    return algorithms.filter((algo) => {
      // Must have snippet for selected language (or all)
      const hasLang = selectedLanguage === "all" || (algo.codeSnippets && algo.codeSnippets[selectedLanguage]);
      if (!hasLang) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        algo.title.toLowerCase().includes(q) ||
        (algo.description && algo.description.toLowerCase().includes(q)) ||
        (algo.problemStatement && algo.problemStatement.toLowerCase().includes(q)) ||
        algo.category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "all" ||
        algo.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesDiff =
        selectedDifficulty === "all" ||
        algo.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCat && matchesDiff;
    });
  }, [algorithms, selectedLanguage, searchQuery, selectedCategory, selectedDifficulty]);

  const solvedCount = useMemo(() => {
    return algorithms.filter((a) => solvedMap[a.slug]).length;
  }, [algorithms, solvedMap]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCode = useMemo(() => {
    if (!selectedAlgo?.codeSnippets) return "";
    return selectedAlgo.codeSnippets[activeCodeLang] || 
           selectedAlgo.codeSnippets[selectedLanguage] || 
           Object.values(selectedAlgo.codeSnippets)[0] || 
           "// No code snippet available for this language.";
  }, [selectedAlgo, activeCodeLang, selectedLanguage]);

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
              flowCTRL <span className="text-emerald-400 font-normal">/ DSA Learning Engine</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/roadmaps" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-orange-400" />
            Roadmaps
          </Link>
          <Link href="/dsa" className="text-emerald-400 font-semibold flex items-center gap-1.5">
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
          <Link href="/assistant" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-pink-400" />
            AI Assistant
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Banner with Progress Bar */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              24 Languages • In-Depth Theory • Interactive Split Workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Data Structures & Algorithms Engine
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Master core interview patterns with step-by-step intuition, complexity proofs, visual flowcharts, and multi-language verified code.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-400 font-medium">Learning Progress</span>
              <span className="text-emerald-400 font-bold">
                {solvedCount} / {algorithms.length} Solved
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{
                  width: `${algorithms.length > 0 ? (solvedCount / algorithms.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* STEP 1: Language Selection Cards */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Step 1: Choose Your Programming Language ({languages.length} available)
            </h2>
            <span className="text-[11px] text-zinc-500">Click to filter algorithms</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang.id;
              const badge = LANGUAGE_BADGES[lang.id] || { label: lang.name, color: "from-zinc-500 to-zinc-700", icon: lang.name.slice(0, 2) };

              return (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group ${
                    isSelected
                      ? "bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                      : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${badge.color} text-white font-black text-xs flex items-center justify-center shadow-inner`}>
                      {badge.icon}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className={`font-bold text-xs truncate ${isSelected ? "text-emerald-300" : "text-zinc-200 group-hover:text-white"}`}>
                      {lang.name}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {lang.algorithmCount} questions
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* STEP 2: Filter & Algorithm Selection Cards */}
        <section className="mb-8">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 self-start md:self-auto">
              <Layers className="w-4 h-4 text-amber-400" />
              Step 2: Select Algorithm ({filteredAlgorithms.length} in {LANGUAGE_BADGES[selectedLanguage]?.label || selectedLanguage})
            </h2>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search algorithms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-900/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Difficulty */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-zinc-900/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Algorithm Cards Horizontal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {filteredAlgorithms.map((algo) => {
              const isSelected = selectedAlgo?.slug === algo.slug;
              const isSolved = solvedMap[algo.slug];

              return (
                <div
                  key={algo.slug}
                  onClick={() => setSelectedAlgo(algo)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-zinc-900/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                      : "glass border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        algo.difficulty === "Easy"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : algo.difficulty === "Medium"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                      }`}>
                        {algo.difficulty}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSolved(algo.slug);
                        }}
                        className="hover:scale-110 transition-transform p-1"
                        aria-label="Toggle Solved"
                      >
                        {isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500 hover:text-zinc-400" />
                        )}
                      </button>
                    </div>

                    <h3 className={`text-sm font-bold mb-1 ${isSelected ? "text-emerald-300" : "text-white"}`}>
                      {algo.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                      {algo.problemStatement || algo.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-mono text-amber-300/90">{algo.timeComplexity}</span>
                    <span className="text-[10px] text-zinc-500">{algo.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* STEP 3: Detailed Learning Workspace (Split View) */}
        {selectedAlgo && (
          <section className="rounded-3xl glass-card border border-white/15 overflow-hidden shadow-2xl bg-zinc-950/70">
            {/* Workspace Header Bar */}
            <div className="p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedAlgo.title}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      selectedAlgo.difficulty === "Easy"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : selectedAlgo.difficulty === "Medium"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {selectedAlgo.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">{selectedAlgo.category}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSolved(selectedAlgo.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    solvedMap[selectedAlgo.slug]
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${solvedMap[selectedAlgo.slug] ? "text-emerald-400 fill-emerald-400/20" : "text-zinc-400"}`} />
                  {solvedMap[selectedAlgo.slug] ? "Solved" : "Mark as Solved"}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCode(currentCode)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            {/* Split Screen Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-[620px]">
              {/* LEFT HALF: Detailed Conceptual Learning, Flowcharts & Theory */}
              <div className="p-6 overflow-y-auto max-h-[750px] space-y-6 text-sm text-zinc-300 leading-relaxed custom-scrollbar">
                {/* 1. Problem Statement */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4 text-orange-400" />
                    Problem Statement
                  </h4>
                  <p className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 text-zinc-200 text-xs sm:text-sm">
                    {selectedAlgo.problemStatement || selectedAlgo.description}
                  </p>
                </div>

                {/* 2. Core Intuition & Concept */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Intuition & Why It Works
                  </h4>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    {selectedAlgo.intuition}
                  </p>
                </div>

                {/* 3. Complexity Cards Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Complexity Hierarchy
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Best Case</div>
                      <div className="font-mono text-xs font-bold text-emerald-400 mt-1">{selectedAlgo.bestCase || selectedAlgo.timeComplexity}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Average Case</div>
                      <div className="font-mono text-xs font-bold text-amber-400 mt-1">{selectedAlgo.averageCase || selectedAlgo.timeComplexity}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/5">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Worst Case</div>
                      <div className="font-mono text-xs font-bold text-rose-400 mt-1">{selectedAlgo.worstCase || selectedAlgo.timeComplexity}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400">
                    Space Complexity: <span className="font-mono font-semibold text-zinc-200">{selectedAlgo.spaceComplexity}</span>
                  </div>
                </div>

                {/* 4. Step-by-Step Approach */}
                {selectedAlgo.stepByStepSolution && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Step-by-Step Execution
                    </h4>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {selectedAlgo.stepByStepSolution.map((step, idx) => (
                        <li key={idx} className="bg-zinc-900/50 p-2.5 rounded-lg border border-white/5">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Flowchart & Visual Diagram */}
                {selectedAlgo.flowchart && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-2">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      Algorithm Flowchart & Logic
                    </h4>
                    <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-indigo-300 border border-indigo-500/20 overflow-x-auto whitespace-pre">
                      {selectedAlgo.flowchart}
                    </pre>
                  </div>
                )}

                {/* 6. Dry Run Walkthrough */}
                {selectedAlgo.dryRun && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5 mb-2">
                      <Play className="w-4 h-4 text-teal-400" />
                      Example Dry Run
                    </h4>
                    <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-[11px] text-teal-200 border border-teal-500/20 overflow-x-auto whitespace-pre">
                      {selectedAlgo.dryRun}
                    </pre>
                  </div>
                )}

                {/* 7. How to Communicate in Interviews */}
                {selectedAlgo.interviewCommunication && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5 mb-2">
                      <BrainCircuit className="w-4 h-4 text-pink-400" />
                      How to Communicate in Interviews
                    </h4>
                    <p className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20 text-pink-200 text-xs">
                      {selectedAlgo.interviewCommunication}
                    </p>
                  </div>
                )}

                {/* 8. Edge Cases & Related Concepts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {selectedAlgo.edgeCases && (
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                      <div className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Edge Cases
                      </div>
                      <ul className="text-[11px] text-zinc-400 list-disc list-inside space-y-0.5">
                        {selectedAlgo.edgeCases.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedAlgo.relatedConcepts && (
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5">
                      <div className="text-[11px] font-bold text-blue-400 mb-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Related Patterns
                      </div>
                      <ul className="text-[11px] text-zinc-400 list-disc list-inside space-y-0.5">
                        {selectedAlgo.relatedConcepts.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT HALF: Colourful Syntax-Highlighted Code Viewer / Editor */}
              <div className="flex flex-col bg-zinc-950 font-mono">
                {/* Code Header Bar with Language Switcher */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/80">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="text-xs text-zinc-400 font-sans font-medium ml-2">
                      {selectedAlgo.slug}.{LANGUAGE_BADGES[activeCodeLang]?.icon?.toLowerCase() || "code"}
                    </span>
                  </div>

                  {/* Switch Snippet Language */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500 font-sans">Language:</span>
                    <select
                      value={activeCodeLang}
                      onChange={(e) => setActiveCodeLang(e.target.value)}
                      className="bg-zinc-800 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-sans focus:outline-none cursor-pointer"
                    >
                      {Object.keys(selectedAlgo.codeSnippets || {}).map((langKey) => (
                        <option key={langKey} value={langKey}>
                          {LANGUAGE_BADGES[langKey]?.label || langKey}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Code Textarea / Viewer */}
                <div className="p-6 flex-1 overflow-auto max-h-[700px] text-xs sm:text-[13px] leading-relaxed custom-scrollbar bg-zinc-950 text-emerald-300">
                  <pre className="whitespace-pre overflow-x-auto selection:bg-emerald-500/30">
                    <code>{currentCode}</code>
                  </pre>
                </div>

                {/* Footer Code Bar */}
                <div className="px-4 py-2.5 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-400 font-sans">
                  <span>Language: <strong className="text-zinc-200">{LANGUAGE_BADGES[activeCodeLang]?.label || activeCodeLang}</strong></span>
                  <span>Available in <strong>{Object.keys(selectedAlgo.codeSnippets || {}).length}</strong> languages</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
