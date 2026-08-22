"use client";

import React, { useState, use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, CheckCircle2, BookOpen } from "lucide-react";
import DevRoadmapGraph from "../../../components/roadmap/DevRoadmapGraph";
import DevRoadmapTopicDrawer from "../../../components/roadmap/DevRoadmapTopicDrawer";
import NavProfile from "../../../components/NavProfile";
import { getRoadmapBySlug } from "@flowctrl/roadmap-data";
import type { RoadmapTopic } from "@flowctrl/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function RoadmapDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const roadmap = useMemo(() => {
    return getRoadmapBySlug(slug);
  }, [slug]);

  const [selectedTopic, setSelectedTopic] = useState<RoadmapTopic | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [completedTopics, setCompletedTopics] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(
          `flowctrl_roadmap_${slug}_completed`,
        );
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.warn("Could not load roadmap progress from localStorage", e);
      }
    }
    return new Set();
  });

  const handleToggleComplete = (topicId: string) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      try {
        localStorage.setItem(
          `flowctrl_roadmap_${slug}_completed`,
          JSON.stringify(Array.from(next)),
        );
      } catch (e) {
        console.warn("Could not save progress", e);
      }
      return next;
    });
  };

  const handleSelectTopic = (topic: RoadmapTopic) => {
    setSelectedTopic(topic);
    setIsDrawerOpen(true);
  };

  if (!roadmap) {
    return (
      <div className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <Compass className="w-16 h-16 text-zinc-600 mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Roadmap Not Found
        </h1>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">
          The roadmap path &apos;{slug}&apos; could not be located in FlowCTRL
          curriculum.
        </p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const totalTopicsCount =
    roadmap.nodes?.length || Object.keys(roadmap.topics || {}).length || 1;
  const completedCount = completedTopics.size;
  const progressPercent = Math.round((completedCount / totalTopicsCount) * 100);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-24">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/roadmaps"
            aria-label="Back to Roadmaps Catalog"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-white">
              {roadmap.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/resume-screener"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden md:inline"
          >
            Resume Screener
          </Link>
          <NavProfile />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28">
        {/* Track Overview Header Card */}
        <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-amber-300">
                  {roadmap.category} Track
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                  {roadmap.level}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                  {totalTopicsCount} Topics
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
                {roadmap.title}
              </h1>

              <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                {roadmap.description}
              </p>
            </div>

            {/* Progress Tracker Card */}
            <div className="p-5 rounded-2xl glass border border-white/10 min-w-[280px] shrink-0">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs uppercase font-bold text-zinc-400">
                  Curriculum Progress
                </span>
                <span className="text-sm font-bold text-amber-300">
                  {progressPercent}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-300 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  <strong className="text-white">{completedCount}</strong> of{" "}
                  {totalTopicsCount} mastered
                </span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tracked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Graph & Interactive Canvas */}
        <DevRoadmapGraph
          roadmap={roadmap}
          onSelectTopic={handleSelectTopic}
          completedTopics={completedTopics}
        />
      </main>

      {/* Topic Detail Drawer */}
      <DevRoadmapTopicDrawer
        topic={selectedTopic}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isCompleted={
          selectedTopic ? completedTopics.has(selectedTopic.id) : false
        }
        onToggleComplete={handleToggleComplete}
        roadmapSlug={slug}
      />
    </div>
  );
}
