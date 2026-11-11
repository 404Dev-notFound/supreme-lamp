"use client";

import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  Sparkles,
  GitBranch,
  Target,
  Layers,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import PersonalizedRoadmapGraph from "./PersonalizedRoadmapGraph";
import { personalizedRoadmapsClient } from "@/services/personalizedRoadmaps.service";

export default function PersonalizedRoadmapModal({
  roadmapId,
  initialRoadmap = null,
  isOpen,
  onClose,
  onProgressUpdated,
}) {
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [loading, setLoading] = useState(!initialRoadmap && Boolean(roadmapId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialRoadmap) {
      setRoadmap(initialRoadmap);
      setLoading(false);
      return;
    }

    if (!roadmapId || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    personalizedRoadmapsClient
      .getRoadmapById(roadmapId)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setRoadmap(data);
          } else {
            setError("Could not load personalized roadmap graph.");
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load roadmap.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [roadmapId, initialRoadmap, isOpen]);

  // Handle status update of a node
  const handleUpdateStepStatus = async (stepId, status) => {
    if (!roadmap?.id) return;

    // Optimistically update status in local state
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
      const res = await personalizedRoadmapsClient.updateTopicProgress(
        roadmap.id,
        stepId,
        status
      );
      if (res && onProgressUpdated) {
        onProgressUpdated(res);
      }
    } catch (err) {
      console.warn("Could not synchronize step progress to PostgreSQL:", err);
    }
  };

  const handleRefresh = async () => {
    if (!roadmap?.id) return;
    setLoading(true);
    try {
      const data = await personalizedRoadmapsClient.getRoadmapById(roadmap.id);
      if (data) setRoadmap(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 md:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/90 transition-all text-left flex flex-col max-h-[92vh]">
                {/* Modal Header */}
                <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 bg-zinc-900/60">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Dialog.Title
                          as="h3"
                          className="text-base sm:text-lg font-bold text-white tracking-tight truncate"
                        >
                          {roadmap?.roadmapTitle || "Personalized Career Roadmap"}
                        </Dialog.Title>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                          RAG Personalized
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                        <Target className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span>Goal: {roadmap?.userGoal || "Software Engineering"}</span>
                        {roadmap?.stages && (
                          <span>• {roadmap.stages.length} Levels</span>
                        )}
                        {roadmap?.steps && (
                          <span>• {roadmap.steps.length} Nodes</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Header Progress & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {roadmap && (
                      <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-24 bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
                            style={{ width: `${roadmap.progressPercent || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {roadmap.progressPercent || 0}%
                        </span>
                      </div>
                    )}

                    {roadmap?.id && (
                      <Link
                        href={`/roadmaps/personalized/${roadmap.id}`}
                        target="_blank"
                        title="Open in dedicated page"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Full Page</span>
                      </Link>
                    )}

                    <button
                      onClick={handleRefresh}
                      title="Refresh Graph"
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body: Graph or Skeleton */}
                <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-zinc-950 flex flex-col">
                  {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center animate-spin">
                        <RotateCcw className="w-6 h-6 text-orange-400" />
                      </div>
                      <p className="text-sm font-medium text-zinc-300">
                        Retrieving personalized graph nodes and edges...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="py-16 text-center space-y-4">
                      <p className="text-sm text-red-400">{error}</p>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/20 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  ) : roadmap ? (
                    <PersonalizedRoadmapGraph
                      roadmap={roadmap}
                      onUpdateStepStatus={handleUpdateStepStatus}
                      onRefresh={handleRefresh}
                    />
                  ) : null}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

