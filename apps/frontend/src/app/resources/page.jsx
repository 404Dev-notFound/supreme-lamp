"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import {
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Bookmark,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Layers,
  GraduationCap,
  Globe,
  Download,
  Star,
  Loader2,
  FileCode,
  PlayCircle,
  Headphones,
  Compass,
  Code,
  Hammer,
  BrainCircuit
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import { resourcesService } from "@/services/resources.service";

const CATEGORIES = [
  { id: "all", label: "All Formats" },
  { id: "books", label: "Books" },
  { id: "documentation", label: "Documentation" },
  { id: "courses-tutorials", label: "Courses & Tutorials" },
  { id: "cheatsheets", label: "Cheatsheets" },
  { id: "interactive-practice", label: "Interactive Practice" },
  { id: "system-architecture", label: "System Architecture" },
  { id: "awesome", label: "Curated Awesome" },
  { id: "podcasts", label: "Podcasts & Audio" },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [totalCount, setTotalCount] = useState(5755);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when category or level changes
  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleLevelChange = (lvl) => {
    setSelectedLevel(lvl);
    setPage(1);
  };

  // Fetch resources with multi-tier SWR client caching
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    resourcesService
      .fetchResources({
        page,
        limit: 24,
        category: selectedCategory,
        level: selectedLevel,
        search: debouncedSearch,
        onBackgroundUpdate: (freshData) => {
          if (!isMounted || !freshData) return;
          if (freshData.resources && Array.isArray(freshData.resources)) {
            setResources(freshData.resources);
            setTotalCount(freshData.total || freshData.count || freshData.resources.length);
            setTotalPages(freshData.totalPages || Math.ceil((freshData.total || freshData.resources.length) / 24) || 1);
          }
        },
      })
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.resources && Array.isArray(data.resources)) {
          setResources(data.resources);
          setTotalCount(data.total || data.count || data.resources.length);
          setTotalPages(data.totalPages || Math.ceil((data.total || data.resources.length) / 24) || 1);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Resources cache/fetch error:", err.message);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, debouncedSearch, selectedCategory, selectedLevel]);

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
              <BrandWordmark className="text-lg" />{" "}<span className="text-orange-400 font-normal">/ Engineering Resources</span>
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
          <Link href="/resources" className="text-amber-400 font-semibold flex items-center gap-1.5">
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

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Curated Learning Library • 5,755+ Verified Resources
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Spend Less Time Searching. More Time Learning.
          </h1>
          <p className="text-zinc-300 max-w-3xl text-sm sm:text-base leading-relaxed">
            A handpicked collection of free engineering books, official documentation, cheat sheets, and practical guides across every programming language and domain — all organized in one place.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass p-4 rounded-xl border border-white/10 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search books, docs, cheat sheets, frameworks (e.g. React, SQL, Python)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryChange(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === c.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-zinc-900/60 border border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Level filter */}
            <select
              value={selectedLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-6">
          <div>
            Showing <span className="text-zinc-200 font-semibold">{resources.length}</span> of{" "}
            <span className="text-orange-400 font-semibold">{totalCount.toLocaleString()}</span> resources
            {debouncedSearch && <span> matching &quot;{debouncedSearch}&quot;</span>}
          </div>
          <div>
            Page <span className="text-zinc-200 font-semibold">{page}</span> of{" "}
            <span className="text-zinc-200 font-semibold">{totalPages}</span>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-3" />
            <p className="text-sm">Querying verified engineering resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="py-20 text-center glass rounded-2xl border border-white/10 p-8">
            <BookOpen className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-200 mb-1">No matching resources found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
              Try adjusting your search terms or selecting &quot;All Formats&quot; to browse the full catalog.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedLevel("all");
              }}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => {
              const resUrl = res.url || res.externalUrl || "#";
              const authorName = res.author || "Community Curated";
              const tagList = Array.isArray(res.tags) ? res.tags : [];
              const formatBadge = res.format || (res.type === "BOOK" ? "BOOK" : "WEB");

              return (
                <div
                  key={res.id || res.slug}
                  className="glass p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-orange-400 font-semibold text-[10px] uppercase tracking-wider">
                          {res.badge || res.type || "RESOURCE"}
                        </span>
                        {formatBadge && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium text-[10px] border border-white/5">
                            {formatBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{res.rating || 4.8}</span>
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-zinc-100 group-hover:text-primary transition-colors mb-1 line-clamp-2">
                      {res.title}
                    </h3>
                    <div className="text-xs text-zinc-400 mb-3 truncate">By {authorName}</div>

                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                      {res.description}
                    </p>

                    {/* Tags */}
                    {tagList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {tagList.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[11px] border border-white/5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">
                      Level: <span className="text-zinc-200 font-semibold">{res.level || "Intermediate"}</span>
                    </span>

                    <a
                      href={resUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Access Resource
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 glass p-4 rounded-xl border border-white/10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/10 text-xs font-semibold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400">Page</span>
              <span className="px-2.5 py-1 rounded bg-primary/20 text-primary border border-primary/30 text-xs font-bold">
                {page}
              </span>
              <span className="text-xs text-zinc-400">of {totalPages}</span>
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/10 text-xs font-semibold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 flex items-center gap-1.5"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
