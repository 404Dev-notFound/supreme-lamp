"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  Loader2,
  X,
  Compass,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react";

const SUGGESTIONS = [
  "I want to become a cybersecurity engineer",
  "Create a roadmap for learning AI and machine learning",
  "I want to become a full-stack developer",
  "Teach me Python from beginner to advanced",
  "I want to prepare for backend development",
  "Create a roadmap for data structures and algorithms",
  "I want to learn cloud computing and DevOps",
];

export default function RoadmapSearchBar({
  onGenerate,
  isLoading,
  currentQuery = "",
  error = null,
}) {
  const [query, setQuery] = useState(currentQuery);
  const [validationError, setValidationError] = useState("");
  const [searchStep, setSearchStep] = useState(0);

  // Cycle loading steps for visual feedback during generation
  React.useEffect(() => {
    let interval;
    if (isLoading) {
      setSearchStep(0);
      interval = setInterval(() => {
        setSearchStep((prev) => (prev + 1) % 3);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setValidationError("Please describe what you want to learn or achieve.");
      return;
    }

    if (trimmed.length < 3) {
      setValidationError("Please enter at least 3 characters.");
      return;
    }

    setValidationError("");
    onGenerate(trimmed);
  };

  const handleSuggestionClick = (suggestion) => {
    if (isLoading) return;
    setQuery(suggestion);
    setValidationError("");
    onGenerate(suggestion);
  };

  const handleClear = () => {
    setQuery("");
    setValidationError("");
  };

  const loadingSteps = [
    "Analyzing career objective & searching 92 curated tracks...",
    "Querying LangChain RAG vector embeddings & retrieving verified courses...",
    "Synthesizing prerequisite graph & ordering learning stages...",
  ];

  return (
    <div className="w-full space-y-4">
      {/* Search Input Box */}
      <form
        onSubmit={handleSubmit}
        className="relative group rounded-2xl p-1 bg-gradient-to-r from-orange-500/20 via-amber-500/30 to-purple-500/20 shadow-2xl shadow-orange-500/10 focus-within:from-orange-500/40 focus-within:to-amber-500/40 transition-all duration-300"
      >
        <div className="relative flex items-center bg-zinc-950/90 backdrop-blur-xl rounded-xl border border-white/10 px-4 py-2.5 transition-all focus-within:border-orange-500/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0 mr-3">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (validationError) setValidationError("");
            }}
            placeholder="Describe what you want to learn or become..."
            disabled={isLoading}
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm md:text-base font-medium focus:outline-none disabled:opacity-50"
          />

          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear query"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm tracking-wide bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Generate Roadmap</span>
                <span className="sm:hidden">Go</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Progress Feedback */}
      {isLoading && (
        <div className="rounded-xl p-3.5 bg-orange-950/20 border border-orange-500/30 flex items-center gap-3 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping shrink-0" />
          <span className="text-xs md:text-sm font-mono text-orange-200">
            {loadingSteps[searchStep]}
          </span>
        </div>
      )}

      {/* Validation or API Error Display */}
      {(validationError || error) && !isLoading && (
        <div className="rounded-xl p-3 bg-rose-950/30 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs md:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError || error}</span>
        </div>
      )}

      {/* Quick Suggestion Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
          <Compass className="w-3 h-3 text-orange-400" />
          Suggested:
        </span>
        {SUGGESTIONS.map((suggestion, index) => {
          const shortLabel = suggestion
            .replace("I want to become a ", "")
            .replace("Create a roadmap for learning ", "")
            .replace("I want to become a ", "")
            .replace("Teach me ", "")
            .replace("I want to prepare for ", "")
            .replace("Create a roadmap for ", "")
            .replace("I want to learn ", "");

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-orange-500/10 hover:border-orange-500/40 text-zinc-300 hover:text-orange-300 border border-white/5 transition-all cursor-pointer truncate max-w-xs"
            >
              {shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
