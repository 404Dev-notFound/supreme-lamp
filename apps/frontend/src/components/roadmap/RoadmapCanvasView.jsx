"use client";

import React, { useMemo } from "react";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Layers,
  Compass,
} from "lucide-react";

export default function RoadmapCanvasView({
  roadmapData,
  activeStepId,
  onSelectStep,
  stepProgress = {},
  onSwitchToEcosystem,
}) {
  // If no roadmap data loaded yet, show the futuristic RAG welcome state
  if (!roadmapData || !roadmapData.stages || roadmapData.stages.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-auto">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shadow-2xl shadow-orange-500/20">
            <Sparkles className="w-12 h-12 text-orange-400 animate-pulse" />
          </div>
          <div className="absolute -inset-4 rounded-full border border-orange-500/10 animate-ping pointer-events-none" />
        </div>

        <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight mb-2">
          Interactive Career Roadmap Canvas
        </h3>
        <p className="text-sm text-zinc-400 max-w-lg mb-6 leading-relaxed">
          Search for any career goal, tech stack, or skill above to generate a
          personalized, stage-ordered roadmap grounded in our collection of 101
          structured curricula.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSwitchToEcosystem}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-orange-400" />
            <span>Switch to flowCTRL Ecosystem</span>
          </button>
        </div>
      </div>
    );
  }

  // Pre-calculate geometric positions for stages, steps, and edges
  const { stageLayouts, stepMap, nodePositions, edges } = useMemo(() => {
    const stages = roadmapData.stages || [];
    const allSteps = roadmapData.steps || [];
    const rawEdges = roadmapData.edges || [];

    const stepMap = {};
    allSteps.forEach((s) => {
      stepMap[s.id] = s;
    });

    const positions = {};
    const colWidth = 260;
    const colGap = 40;
    const startX = 60;
    const startY = 90;
    const headerHeight = 55;
    const cardWidth = 240;
    const cardHeight = 92;
    const cardGap = 20;

    const stageLayouts = stages.map((stg, stageIdx) => {
      const colX = startX + stageIdx * (colWidth + colGap);
      const stageSteps = allSteps.filter((s) => s.stageIndex === stageIdx);

      stageSteps.forEach((step, stepIdx) => {
        const nodeY = startY + headerHeight + stepIdx * (cardHeight + cardGap);
        positions[step.id] = {
          x: colX,
          y: nodeY,
          width: cardWidth,
          height: cardHeight,
          step,
        };
      });

      return {
        stageIndex: stageIdx,
        stageName: stg.stageName || `Stage ${stageIdx + 1}`,
        description: stg.stageDescription || "",
        x: colX,
        y: startY,
        width: cardWidth,
        steps: stageSteps,
      };
    });

    return {
      stageLayouts,
      stepMap,
      nodePositions: positions,
      edges: rawEdges,
    };
  }, [roadmapData]);

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "advanced":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "intermediate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Roadmap Header HUD overlay */}
      <div className="absolute top-4 left-6 z-20 pointer-events-auto flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-orange-500/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs md:text-sm font-bold text-white tracking-tight">
            {roadmapData.roadmapTitle}
          </span>
          <span className="text-[11px] font-mono text-orange-400 px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
            {roadmapData.steps?.length || 0} Steps
          </span>
          {roadmapData.provenance?.totalResourcesGrounded && (
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              • {roadmapData.provenance.totalResourcesGrounded} Grounded Tracks
            </span>
          )}
        </div>
      </div>

      {/* SVG Dependency Lines Layer */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
        style={{ minWidth: "1600px", minHeight: "1200px" }}
      >
        <defs>
          <linearGradient id="roadmapLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
          </linearGradient>

          <filter id="glowPath" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker
            id="roadmapArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#f97316" />
          </marker>
        </defs>

        {edges.map((edge, idx) => {
          const p1 = nodePositions[edge.source];
          const p2 = nodePositions[edge.target];
          if (!p1 || !p2) return null;

          const isConnectedToActive =
            activeStepId === edge.source || activeStepId === edge.target;

          let pathD = "";
          if (p1.x < p2.x) {
            // Forward connection between stages
            const x1 = p1.x + p1.width;
            const y1 = p1.y + p1.height / 2;
            const x2 = p2.x;
            const y2 = p2.y + p2.height / 2;
            const deltaX = (x2 - x1) * 0.5;
            pathD = `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
          } else {
            // Sequential same-stage or vertical connection
            const x1 = p1.x + p1.width / 2;
            const y1 = p1.y + p1.height;
            const x2 = p2.x + p2.width / 2;
            const y2 = p2.y;
            pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
          }

          return (
            <g key={idx}>
              <path
                d={pathD}
                fill="none"
                stroke={isConnectedToActive ? "#f97316" : "rgba(249, 115, 22, 0.35)"}
                strokeWidth={isConnectedToActive ? "2.5" : "1.8"}
                strokeDasharray={isConnectedToActive ? "none" : "5,4"}
                markerEnd="url(#roadmapArrow)"
                filter={isConnectedToActive ? "url(#glowPath)" : "none"}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* HTML Rendered Stages & Step Nodes */}
      <div className="absolute inset-0 pointer-events-auto">
        {stageLayouts.map((stg) => (
          <div
            key={stg.stageIndex}
            style={{
              position: "absolute",
              left: `${stg.x}px`,
              top: `${stg.y}px`,
              width: `${stg.width}px`,
            }}
            className="flex flex-col select-none"
          >
            {/* Stage Column Header */}
            <div className="mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                  STAGE 0{stg.stageIndex + 1}
                </span>
                <h4 className="text-xs md:text-sm font-bold text-white tracking-tight truncate max-w-[190px]">
                  {stg.stageName}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {stg.steps.length}
              </span>
            </div>

            {/* Step Nodes inside this stage */}
            <div className="space-y-5">
              {stg.steps.map((step) => {
                const isSelected = activeStepId === step.id;
                const currentStatus =
                  stepProgress[step.id] || step.status || "not_started";
                const courseCount = step.recommendedCourses?.length || 0;

                return (
                  <div
                    key={step.id}
                    onClick={() => onSelectStep(step)}
                    style={{
                      width: "240px",
                      height: "92px",
                      borderColor: isSelected
                        ? "#f97316"
                        : "rgba(255, 255, 255, 0.12)",
                      boxShadow: isSelected
                        ? "0 0 25px rgba(249, 115, 22, 0.45)"
                        : "none",
                    }}
                    className={`rounded-2xl p-3 bg-zinc-950/90 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:border-orange-500/50 hover:bg-zinc-900/90 relative ${
                      isSelected ? "ring-2 ring-orange-500/40" : ""
                    }`}
                  >
                    {/* Top Row: Status Icon & Difficulty Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {currentStatus === "completed" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </div>
                        )}
                        {currentStatus === "in_progress" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Doing</span>
                          </div>
                        )}
                        {currentStatus === "not_started" && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                            <Circle className="w-3.5 h-3.5" />
                            <span>To-Do</span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${getDifficultyBadge(
                          step.difficulty
                        )}`}
                      >
                        {step.difficulty || "Beginner"}
                      </span>
                    </div>

                    {/* Middle Row: Step Topic Title */}
                    <h5 className="text-xs md:text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {step.topic}
                    </h5>

                    {/* Bottom Row: Course indicator & View Details */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/5 pt-1">
                      <span className="flex items-center gap-1 text-zinc-400 group-hover:text-orange-400 transition-colors">
                        <GraduationCap className="w-3 h-3 text-orange-400" />
                        {courseCount} {courseCount === 1 ? "course" : "courses"}
                      </span>
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        Inspect →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
