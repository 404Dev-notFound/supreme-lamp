"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  X,
  Compass,
  Hammer,
  BarChart3,
  FileText,
  BrainCircuit,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  FolderGit2,
} from "lucide-react";
import ProjectTutorialCard from "@/components/tutorials/ProjectTutorialCard";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import ResumeScreenerModal from "@/components/modals/ResumeScreenerModal";
import WellbeingEmbed from "@/components/WellbeingEmbed";
import { projectTutorialsService } from "@/services/projectTutorials.service";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectTutorialsLandingPage() {
  const { user: authUser } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSort, setSelectedSort] = useState("recommended");
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "active"

  // Data state
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [myProgressList, setMyProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isMentalHealthScoreOpen, setMentalHealthScoreOpen] = useState(false);

  // Load Categories & Languages on initial mount
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      projectTutorialsService.fetchCategories().catch(() => ({ data: [] })),
      projectTutorialsService.fetchLanguages().catch(() => ({ data: [] })),
    ]).then(([catRes, langRes]) => {
      if (isMounted) {
        if (catRes?.data) setCategories(catRes.data);
        if (langRes?.data) setLanguages(langRes.data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Projects based on active filters and pagination
  const loadProjects = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await projectTutorialsService.fetchProjects({
        search: searchQuery,
        category: selectedCategory,
        language: selectedLanguage,
        difficulty: selectedDifficulty,
        sort: selectedSort,
        page,
        limit: 12,
      });

      if (res?.data) {
        setProjects(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load project tutorials:", err);
      setError("Unable to load project tutorials. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLanguage, selectedDifficulty, selectedSort]);

  // Debounced query triggering
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  // Load user progress list when user is authenticated
  useEffect(() => {
    if (authUser) {
      projectTutorialsService
        .fetchMyProgress()
        .then((res) => {
          if (res?.data) setMyProgressList(res.data);
        })
        .catch(() => {});
    } else {
      setMyProgressList([]);
    }
  }, [authUser]);

  // Bookmark handler
  const handleToggleBookmark = async (projectId) => {
    if (!authUser) {
      window.location.href = "?modal=signin";
      return;
    }
    try {
      const res = await projectTutorialsService.toggleBookmark(projectId);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, isBookmarked: res.data.bookmarked } : p))
      );
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSelectedDifficulty("all");
    setSelectedSort("recommended");
  };

  const activeProjectsCount = myProgressList.filter((p) => p.status === "IN_PROGRESS").length;
  const completedProjectsCount = myProgressList.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-orange-500/30 flex flex-col justify-between">
      {/* 1. Global Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">fC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <Link
              href="/project-tutorials"
              className="text-orange-400 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Hammer className="w-4 h-4 text-orange-400" />
              Project Tutorials
            </Link>
            <Link
              href="/roadmaps"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
            >
              <Compass className="w-4 h-4 text-zinc-400" />
              Roadmaps
            </Link>
            <Link
              href="/ecosystem"
              className="hover:text-amber-300 transition-colors flex items-center gap-1.5 text-zinc-300"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              Ecosystem
            </Link>
            <button
              type="button"
              onClick={() => setResumeScreenerOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Resume Screener
            </button>
            <button
              type="button"
              onClick={() => setMentalHealthScoreOpen(true)}
              className="hover:text-white transition-colors cursor-pointer text-sm font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
              Mental Health Score
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto w-full relative z-10 flex-1">
        {/* 2. Hero Header */}
        <section className="relative text-center max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6 glass">
            <Hammer className="w-4 h-4 text-orange-400" />
            First-Principles Engineering Catalog
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.15]">
            Build Your Own Technology. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200">
              Understand What You Create.
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
            Recreate production-grade software from first principles. Master databases,
            operating systems, compilers, web servers, and neural networks through hands-on step-by-step implementation.
          </p>

          {/* Search Bar Input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-5 h-5 text-orange-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, language (C, Go, Rust), technology, or concept..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl glass-card border border-white/10 bg-zinc-950/70 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* 3. Category Discovery Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-orange-500 text-black font-semibold shadow-lg shadow-orange-500/20"
                : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.slug
                  ? "bg-orange-500 text-black font-semibold shadow-lg shadow-orange-500/20"
                  : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat.name}
              <span className="text-[10px] opacity-70">({cat.projectCount})</span>
            </button>
          ))}
        </div>

        {/* 4. Controls Bar: Multi-Filter Selectors & View Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-white/10 bg-zinc-950/60 mb-8">
          {/* Left: View Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === "browse"
                  ? "bg-white/15 text-white border border-white/10"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Browse Catalog ({pagination.total || projects.length})
            </button>
            {authUser && (
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "active"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "text-zinc-400 hover:text-orange-400"
                }`}
              >
                My Projects
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500/20 text-[10px] text-orange-400">
                  {myProgressList.length}
                </span>
              </button>
            )}
          </div>

          {/* Right: Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Language: All</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="all">Difficulty: All</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>

            {/* Sort Filter */}
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
            >
              <option value="recommended">Sort: Recommended</option>
              <option value="newest">Sort: Newest</option>
              <option value="difficulty_asc">Difficulty: Easiest First</option>
              <option value="difficulty_desc">Difficulty: Hardest First</option>
              <option value="duration_asc">Duration: Shortest First</option>
              <option value="duration_desc">Duration: Longest First</option>
            </select>

            {(searchQuery || selectedCategory !== "all" || selectedLanguage !== "all" || selectedDifficulty !== "all" || selectedSort !== "recommended") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 5. Project Grid View */}
        {activeTab === "browse" ? (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-72 rounded-2xl glass-card border border-white/5 bg-zinc-950/40 animate-pulse p-6"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="p-12 text-center rounded-2xl glass-card border border-red-500/20 bg-red-500/5 text-red-300">
                <p className="font-semibold mb-2">{error}</p>
                <button
                  type="button"
                  onClick={() => loadProjects(1)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-16 text-center rounded-2xl glass-card border border-white/10 bg-zinc-950/60 max-w-lg mx-auto">
                <FolderGit2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">No Projects Found</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  No project tutorials match your current search and filter criteria.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                  {projects.map((project) => (
                    <ProjectTutorialCard
                      key={project.id}
                      project={project}
                      onToggleBookmark={handleToggleBookmark}
                      isBookmarked={project.isBookmarked}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-6 border-t border-white/10">
                    <button
                      type="button"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => loadProjects(pagination.page - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <span className="text-xs font-mono text-zinc-400">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={!pagination.hasNextPage}
                      onClick={() => loadProjects(pagination.page + 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Active Projects Tab */
          <div>
            {myProgressList.length === 0 ? (
              <div className="p-16 text-center rounded-2xl glass-card border border-white/10 bg-zinc-950/60 max-w-lg mx-auto">
                <Hammer className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">No Active Projects Yet</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  You haven&apos;t started building any projects yet. Browse the catalog and pick a project to start learning!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("browse")}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
                    <span className="text-xs text-zinc-400">In Progress</span>
                    <div className="text-2xl font-bold text-amber-400 mt-1">{activeProjectsCount}</div>
                  </div>
                  <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
                    <span className="text-xs text-zinc-400">Completed</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{completedProjectsCount}</div>
                  </div>
                  <div className="p-5 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
                    <span className="text-xs text-zinc-400">Total Started</span>
                    <div className="text-2xl font-bold text-zinc-100 mt-1">{myProgressList.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProgressList.map((item) => (
                    <ProjectTutorialCard
                      key={item.id}
                      project={{
                        ...item.project,
                        totalSteps: item.totalStepCount,
                        userProgress: item,
                      }}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <WellbeingEmbed
        isOpen={isMentalHealthScoreOpen}
        onClose={() => setMentalHealthScoreOpen(false)}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
