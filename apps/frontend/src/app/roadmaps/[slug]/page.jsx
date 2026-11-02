"use client";

import React, { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  CheckCircle2,
  BookOpen,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import DevRoadmapGraph from "../../../components/roadmap/DevRoadmapGraph";
import DevRoadmapTopicDrawer from "../../../components/roadmap/DevRoadmapTopicDrawer";
import ResumeScreenerModal from "../../../components/modals/ResumeScreenerModal";
import UpgradeMembershipModal from "../../../components/modals/UpgradeMembershipModal";
import NavProfile from "../../../components/NavProfile";
import Footer from "../../../components/Footer";
import { getRoadmapBySlug } from "@flowctrl/roadmap-data";
import { membershipService } from "../../../services/membership.service";
import { useAuth } from "@/hooks/useAuth";

export default function RoadmapDetailPage({ params }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();

  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;

  const staticRoadmap = useMemo(() => {
    return slug ? getRoadmapBySlug(slug) : null;
  }, [slug]);

  const [roadmap, setRoadmap] = useState(staticRoadmap);
  const [isLoading, setIsLoading] = useState(!staticRoadmap);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Fetch dynamic/premium roadmap details from API
  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${apiUrl}/api/roadmaps/${encodeURIComponent(slug)}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.data) {
          setRoadmap(data.data);
          setIsLocked(Boolean(data.data.isLocked));
        } else if (staticRoadmap) {
          setRoadmap(staticRoadmap);
          setIsLocked(false);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch remote roadmap data:", err.message);
        if (staticRoadmap) {
          setRoadmap(staticRoadmap);
          setIsLocked(false);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, staticRoadmap]);

  const [completedTopics, setCompletedTopics] = useState(() => {
    if (typeof window !== "undefined" && slug) {
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

  const handleToggleComplete = (topicId) => {
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

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setIsDrawerOpen(true);
  };

  const handleOpenAuth = () => {
    const p = new URLSearchParams(searchParams?.toString() || "");
    p.set("modal", "signin");
    router.replace(`${pathname}?${p.toString()}`);
  };

  const handleUpgradeSuccess = () => {
    // Reload page to refresh entitlements
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <Compass className="w-12 h-12 text-orange-400 mb-4 animate-spin" />
        <p className="text-sm text-zinc-400">Loading curriculum...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <Compass className="w-16 h-16 text-orange-400 mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Roadmap Not Found
        </h1>
        <p className="text-sm text-zinc-300 mb-6 max-w-sm">
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

  const isPremiumTrack =
    roadmap.isPremium ||
    roadmap.accessLevel === "PREMIUM" ||
    roadmap.badge === "PREMIUM";

  const totalTopicsCount =
    roadmap.nodes?.length ||
    roadmap.topicCount ||
    Object.keys(roadmap.topics || {}).length ||
    1;
  const completedCount = completedTopics.size;
  const progressPercent = Math.round((completedCount / totalTopicsCount) * 100);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-24">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/roadmaps"
            aria-label="Back to Roadmaps"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="flowCTRL Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white hidden sm:inline">
              flowCTRL
            </span>
          </Link>
          <span className="text-zinc-400 mx-1">/</span>
          <span className="font-semibold text-lg tracking-tight text-white truncate max-w-[200px] sm:max-w-md">
            {roadmap.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setResumeScreenerOpen(true)}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden md:inline cursor-pointer"
          >
            Resume Screener
          </button>
          <NavProfile />
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-28">
        {/* Track Overview Header Card */}
        <div
          className={`p-6 md:p-8 rounded-3xl border mb-8 relative overflow-hidden ${
            isPremiumTrack
              ? "bg-gradient-to-b from-zinc-950 via-zinc-900/90 to-orange-950/20 border-orange-500/40 shadow-xl shadow-orange-950/20"
              : "glass-card border-white/15"
          }`}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {isPremiumTrack && (
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Premium Masterclass
                  </span>
                )}
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-200">
                  {roadmap.category || "Advanced"} Track
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-200">
                  {roadmap.level || "Advanced"}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  {totalTopicsCount} Topics
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3">
                {roadmap.title}
              </h1>

              <p className="text-sm md:text-base text-zinc-200 leading-relaxed font-normal">
                {roadmap.description}
              </p>
            </div>

            {/* Progress Tracker Card (shown when unlocked) */}
            {!isLocked && (
              <div className="p-5 rounded-2xl bg-zinc-900/85 border border-white/15 min-w-[280px] shrink-0 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs uppercase font-bold text-zinc-300">
                    Curriculum Progress
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-300 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span>
                    <strong className="text-white">{completedCount}</strong> of{" "}
                    {totalTopicsCount} mastered
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tracked
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LOCKED STATE VIEW */}
        {isLocked ? (
          <div className="relative p-8 md:p-12 rounded-3xl bg-zinc-950/90 border border-orange-500/40 text-center max-w-4xl mx-auto shadow-2xl shadow-orange-500/10 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 mb-6 shadow-lg shadow-orange-500/20">
                <Lock className="w-8 h-8" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                Available with Premium Membership
              </h2>

              <p className="text-sm md:text-base text-zinc-300 max-w-xl mb-8 leading-relaxed font-normal">
                Unlock exclusive learning resources and access premium roadmaps
                with flowCTRL Premium.
              </p>

              {/* Module Outlines Preview */}
              {roadmap.preview?.modules && roadmap.preview.modules.length > 0 && (
                <div className="w-full text-left mb-8 p-5 rounded-2xl bg-zinc-900/80 border border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Curriculum Modules Preview:
                  </div>
                  <div className="space-y-2">
                    {roadmap.preview.modules.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {idx + 1}. {m.title}
                          </div>
                          {m.description && (
                            <div className="text-xs text-zinc-400 mt-0.5">
                              {m.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-orange-400/80 font-medium shrink-0 ml-4">
                          <Lock className="w-3 h-3" />
                          <span>{m.topicCount || 0} topics</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {authUser ? (
                  <button
                    type="button"
                    onClick={() => setUpgradeModalOpen(true)}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to flowCTRL Premium
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenAuth}
                      className="py-3 px-6 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Sign In to flowCTRL
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpgradeModalOpen(true)}
                      className="py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/15 transition-all cursor-pointer"
                    >
                      View Premium Plans
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* UNLOCKED GRAPH & TOPICS */
          <DevRoadmapGraph
            roadmap={roadmap}
            onSelectTopic={handleSelectTopic}
            completedTopics={completedTopics}
          />
        )}
      </main>

      <Footer />

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

      {/* Upgrade Membership Modal */}
      <UpgradeMembershipModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />

      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
    </div>
  );
}
