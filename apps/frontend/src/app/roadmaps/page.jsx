"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Compass, Search, Sparkles, ArrowLeft } from "lucide-react";
import DevRoadmapCard from "../../components/roadmap/DevRoadmapCard";
import NavProfile from "../../components/NavProfile";
import { getAllRoadmaps } from "@flowctrl/roadmap-data";

export default function RoadmapsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const roadmaps = useMemo(() => {
    return getAllRoadmaps();
  }, []);

  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((r) => {
      const matchesSearch =
        !searchQuery.trim() ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        r.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "role" && r.category === "role") ||
        (selectedCategory === "skill" && r.category === "skill") ||
        (selectedCategory === "ai" &&
          (r.slug.includes("ai") ||
            r.slug.includes("prompt") ||
            r.slug.includes("machine-learning"))) ||
        (selectedCategory === "devops" &&
          (r.slug.includes("devops") ||
            r.slug.includes("docker") ||
            r.slug.includes("kubernetes") ||
            r.slug.includes("aws") ||
            r.slug.includes("terraform")));

      return matchesSearch && matchesCategory;
    });
  }, [roadmaps, searchQuery, selectedCategory]);

  const categories = [
    { id: "all", label: `All Tracks (${roadmaps.length})` },
    { id: "role", label: "Career Roles" },
    { id: "ai", label: "AI & Intelligence" },
    { id: "skill", label: "Skills & Frameworks" },
    { id: "devops", label: "DevOps & Cloud" },
  ];

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-24">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to Home"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              flowCTRL{" "}
              <span className="text-orange-400 font-normal">/ Roadmaps</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/resume-screener"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:inline"
          >
            Resume Screener
          </Link>
          <NavProfile />
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative pt-36 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-amber-300 text-xs font-semibold mb-6 glass">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          Structured Career Roadmaps & Learning Guides
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 max-w-3xl leading-tight">
          Master the skills you need. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            Step by step, concept by concept.
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Explore interactive curriculum graphs, handpicked community resources,
          and track your progression across modern software engineering and AI
          tracks.
        </p>

        {/* Search & Filter Bar */}
        <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, framework, skill or keyword (e.g. AI, React, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl glass-card border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50 text-sm shadow-xl"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-orange-500/20 text-amber-300 border border-orange-500/40 shadow-md shadow-orange-500/10"
                  : "glass border border-white/5 text-zinc-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Roadmaps Grid */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Available Learning Paths ({filteredRoadmaps.length})
          </h2>
        </div>

        {filteredRoadmaps.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-white/10">
            <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-1">
              No matching roadmaps found
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Try searching with different keywords like &quot;Frontend&quot;,
              &quot;AI&quot;, or &quot;Python&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap) => (
              <DevRoadmapCard key={roadmap.slug} roadmap={roadmap} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
