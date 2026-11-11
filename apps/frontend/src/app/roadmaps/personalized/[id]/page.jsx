"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  Sparkles,
  Target,
  Layers,
  RotateCcw,
  CheckCircle2,
  Share2,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import PersonalizedRoadmapGraph from "@/components/roadmap/PersonalizedRoadmapGraph";
import { personalizedRoadmapsClient } from "@/services/personalizedRoadmaps.service";
import { useAuth } from "@/hooks/useAuth";

export default function PersonalizedRoadmapPage({ params }) {
  const router = useRouter();
  const { user: authUser, status: authStatus } = useAuth();

  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoadmap = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await personalizedRoadmapsClient.getRoadmapById(id);
      if (data) {
        setRoadmap(data);
      } else {
        setError("Personalized roadmap not found or access denied.");
      }
    } catch (err) {
      setError(err.message || "Failed to load personalized roadmap graph.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [id]);

  const handleUpdateStepStatus = async (stepId, status) => {
    if (!id) return;

    // Optimistically update status
    setRoadmap((prev) => {
      if (!prev) return prev;
      const updatedSteps = (prev.steps || prev.nodes || []).map((s) =>
        s.id === stepId ? { ...s, status } : s
      );
      const total = updatedSteps.length;
      const done = updatedSteps.filter((s) => s.status === "completed").length;
      const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        ...prev,
        steps: updatedSteps,
        nodes: updatedSteps,
        progressPercent,
        completedNodes: done,
      };
    });

    try {
      await personalizedRoadmapsClient.updateTopicProgress(id, stepId, status);
    } catch (err) {
      console.warn("Could not sync progress to database:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-orange-500/30 font-sans">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="font-bold text-black tracking-tighter">fC</span>
            </div>
            <BrandWordmark className="text-lg" />
          </Link>

          <Link
            href="/ecosystem"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Explorer</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-14 h-14 rounded-3xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center animate-spin">
              <RotateCcw className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Loading Personalized Career Graph...
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Constructing individual nodes, multi-level prerequisites, and directional connections from PostgreSQL.
            </p>
          </div>
        ) : error ? (
          <div className="py-24 text-center space-y-4 max-w-md mx-auto">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-medium">
              {error}
            </div>
            <Link
              href="/ecosystem"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
            >
              <Compass className="w-4 h-4 text-orange-400" />
              <span>Generate a New Roadmap</span>
            </Link>
          </div>
        ) : roadmap ? (
          <div className="flex flex-col gap-6">
            {/* Roadmap Header HUD Banner */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  RAG-Generated Personalized Roadmap
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  {roadmap.roadmapTitle}
                </h1>
                <p className="text-xs md:text-sm text-zinc-300 max-w-3xl leading-relaxed">
                  {roadmap.summary || roadmap.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Target className="w-3.5 h-3.5 text-orange-400" />
                    Goal: {roadmap.userGoal}
                  </span>
                  <span>•</span>
                  <span>{roadmap.stages?.length || 0} Levels</span>
                  <span>•</span>
                  <span>{roadmap.steps?.length || 0} Individual Nodes</span>
                  <span>•</span>
                  <span>{roadmap.edges?.length || 0} Directed Edges</span>
                </div>
              </div>

              {/* Progress & Quick Stats Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 shrink-0 w-full md:w-auto justify-between md:justify-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Curriculum Progress
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-amber-300 font-mono">
                      {roadmap.progressPercent || 0}%
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      ({roadmap.completedNodes || 0}/{roadmap.totalNodes || roadmap.steps?.length || 0} topics)
                    </span>
                  </div>
                  <div className="w-36 bg-zinc-800 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
                      style={{ width: `${roadmap.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={loadRoadmap}
                  title="Reload Graph"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Graph Component */}
            <PersonalizedRoadmapGraph
              roadmap={roadmap}
              onUpdateStepStatus={handleUpdateStepStatus}
              onRefresh={loadRoadmap}
            />
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

