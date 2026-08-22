"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Circle,
  Sparkles,
  LayoutGrid,
  Network as NetworkIcon,
  ChevronRight,
} from "lucide-react";
import type { RoadmapDetail, RoadmapNode, RoadmapTopic } from "@flowctrl/types";

interface DevRoadmapGraphProps {
  roadmap: RoadmapDetail;
  onSelectTopic: (topic: RoadmapTopic) => void;
  completedTopics: Set<string>;
}

export default function DevRoadmapGraph({
  roadmap,
  onSelectTopic,
  completedTopics,
}: DevRoadmapGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");

  const nodes = useMemo(() => roadmap.nodes || [], [roadmap.nodes]);
  const topicsMap = useMemo(() => roadmap.topics || {}, [roadmap.topics]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase().trim();
    return nodes.filter((n) => {
      const topic = topicsMap[n.topicId];
      return (
        n.label.toLowerCase().includes(q) ||
        (topic && topic.description.toLowerCase().includes(q))
      );
    });
  }, [nodes, topicsMap, searchQuery]);

  const levelGroups = useMemo(() => {
    const groups: Record<number, RoadmapNode[]> = {};
    nodes.forEach((node) => {
      const lvl = node.level || 1;
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(node);
    });
    return groups;
  }, [nodes]);

  const levelNames: Record<number, string> = {
    1: "Phase 1: Fundamentals & Prerequisites",
    2: "Phase 2: Core Engineering & Frameworks",
    3: "Phase 3: Advanced Architecture & Scaling",
    4: "Phase 4: Tooling, Security & Best Practices",
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="w-full rounded-2xl glass-card border border-white/10 overflow-hidden flex flex-col">
      {/* Graph Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 glass bg-zinc-950/40">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts in this roadmap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("graph")}
              aria-label="Interactive Graph View"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "graph"
                  ? "bg-orange-500/20 text-amber-300 border border-orange-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <NetworkIcon className="w-3.5 h-3.5" />
              Graph View
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-label="List Curriculum View"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-orange-500/20 text-amber-300 border border-orange-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          {/* Zoom Controls (Graph mode only) */}
          {viewMode === "graph" && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-zinc-400">
              <button
                onClick={handleZoomIn}
                aria-label="Zoom In"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                aria-label="Zoom Out"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                aria-label="Reset Zoom"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      {viewMode === "graph" ? (
        <div className="relative w-full min-h-[600px] overflow-auto bg-zinc-950/60 p-8 flex flex-col items-center">
          {/* Subtle Canvas Dot Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #f97316 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />

          <div
            className="transition-transform duration-200 origin-top flex flex-col items-center gap-12 w-full max-w-5xl relative z-10"
            style={{ transform: `scale(${zoom})` }}
          >
            {Object.keys(levelGroups).map((lvlKey) => {
              const lvl = Number(lvlKey);
              const groupNodes = levelGroups[lvl];
              return (
                <div
                  key={lvl}
                  className="w-full flex flex-col items-center gap-4 relative"
                >
                  {/* Phase Header Tag */}
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase shadow-lg shadow-orange-500/5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    {levelNames[lvl] || `Phase ${lvl}`}
                  </div>

                  {/* Grid of Nodes in this phase */}
                  <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                    {groupNodes.map((node) => {
                      const topic = topicsMap[node.topicId];
                      const isCompleted = completedTopics.has(node.topicId);
                      const isMatched =
                        !searchQuery.trim() ||
                        node.label
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase().trim());

                      return (
                        <button
                          key={node.id}
                          onClick={() => topic && onSelectTopic(topic)}
                          className={`group relative flex items-center justify-between gap-3 p-4 rounded-xl text-left transition-all duration-200 cursor-pointer w-64 ${
                            isCompleted
                              ? "bg-emerald-950/40 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/5"
                              : isMatched
                                ? "glass-card border-white/10 hover:border-orange-500/50 hover:bg-white/10 text-zinc-200 hover:text-white hover:scale-[1.02]"
                                : "opacity-40 glass border-white/5 text-zinc-500"
                          } border`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate group-hover:text-amber-300">
                                {node.label}
                              </p>
                              <span className="text-[10px] text-zinc-500 block">
                                {topic?.resources?.length || 0} resources
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Phase Connecting Line */}
                  {lvl < Object.keys(levelGroups).length && (
                    <div className="w-0.5 h-8 bg-gradient-to-b from-orange-500/40 to-transparent my-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Detailed List / Curriculum View */
        <div className="p-6 md:p-8 space-y-4 max-h-[800px] overflow-y-auto">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No matching topics found for &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredNodes.map((node, index) => {
              const topic = topicsMap[node.topicId];
              const isCompleted = completedTopics.has(node.topicId);
              return (
                <div
                  key={node.id}
                  onClick={() => topic && onSelectTopic(topic)}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl glass border border-white/10 hover:border-orange-500/40 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-white/20 text-[10px] font-bold text-zinc-400">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {node.label}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {topic?.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5 text-xs text-orange-400 font-medium group-hover:text-amber-300">
                    <span className="hidden sm:inline">
                      {topic?.resources?.length || 0} links
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
