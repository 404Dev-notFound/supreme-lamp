"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  Lock,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Layers,
  Compass,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Network as NetworkIcon,
  LayoutGrid,
  ListOrdered,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  GitBranch,
  ShieldAlert,
} from "lucide-react";
import RoadmapStepDrawer from "./RoadmapStepDrawer";

export default function PersonalizedRoadmapGraph({
  roadmap,
  onUpdateStepStatus,
  onRefresh,
}) {
  const containerRef = useRef(null);

  // View mode: 'many-to-many' | 'state-tree' | 'curriculum'
  const [viewMode, setViewMode] = useState("many-to-many");

  // Pan & Zoom state
  const [scale, setScale] = useState(0.85);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");

  // Selection & Details Drawer
  const [activeNodeKey, setActiveNodeKey] = useState(null);
  const [hoveredNodeKey, setHoveredNodeKey] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Collapsible phases (for state tree view)
  const [collapsedStages, setCollapsedStages] = useState(new Set());

  // Fullscreen toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Normalize stages, steps, and edges from roadmap
  const stages = useMemo(() => roadmap?.stages || [], [roadmap?.stages]);
  const steps = useMemo(() => roadmap?.steps || roadmap?.nodes || [], [roadmap?.steps, roadmap?.nodes]);
  const rawEdges = useMemo(() => roadmap?.edges || [], [roadmap?.edges]);

  // Map of stepKey -> step object
  const stepMap = useMemo(() => {
    const map = new Map();
    steps.forEach((s) => {
      map.set(s.id, s);
    });
    return map;
  }, [steps]);

  // Determine active step object for drawer
  const activeStep = useMemo(() => {
    if (!activeNodeKey) return null;
    return stepMap.get(activeNodeKey) || null;
  }, [activeNodeKey, stepMap]);

  // Identify connected nodes for active or hovered node
  const connectedKeys = useMemo(() => {
    const targetKey = hoveredNodeKey || activeNodeKey;
    if (!targetKey) return new Set();

    const set = new Set([targetKey]);
    rawEdges.forEach((e) => {
      if (e.source === targetKey) set.add(e.target);
      if (e.target === targetKey) set.add(e.source);
    });
    return set;
  }, [hoveredNodeKey, activeNodeKey, rawEdges]);

  // Compute locked/unlocked states based on prerequisites
  const completedKeys = useMemo(() => {
    const set = new Set();
    steps.forEach((s) => {
      if (s.status === "completed") {
        set.add(s.id);
        set.add(s.topic.toLowerCase().trim());
      }
    });
    return set;
  }, [steps]);

  const nodeStatusMap = useMemo(() => {
    const map = new Map();
    steps.forEach((s) => {
      let status = s.status || "not_started";
      // If not completed and has prerequisites, check if prerequisites are satisfied
      if (status !== "completed" && Array.isArray(s.prerequisites) && s.prerequisites.length > 0) {
        const hasUnmetPrereq = s.prerequisites.some((p) => {
          if (!p) return false;
          const clean = p.toLowerCase().trim();
          return !completedKeys.has(clean) && !completedKeys.has(p);
        });
        if (hasUnmetPrereq && status === "not_started") {
          status = "locked";
        }
      }
      map.set(s.id, status);
    });
    return map;
  }, [steps, completedKeys]);

  // Layout calculation for Many-to-Many Dynamic Canvas
  const { stageLayouts, nodePositions, dynamicEdges, canvasDimensions } = useMemo(() => {
    const positions = {};
    const colWidth = 270;
    const colGap = 60;
    const startX = 60;
    const startY = 80;
    const headerHeight = 60;
    const cardWidth = 250;
    const cardHeight = 100;
    const cardGap = 24;

    let maxColumnHeight = 0;

    const layouts = stages.map((stg, stageIdx) => {
      const colX = startX + stageIdx * (colWidth + colGap);
      const stageSteps = steps.filter((s) => s.stageIndex === stageIdx);

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

      const columnTotalHeight =
        startY + headerHeight + stageSteps.length * (cardHeight + cardGap);
      if (columnTotalHeight > maxColumnHeight) {
        maxColumnHeight = columnTotalHeight;
      }

      return {
        stageIndex: stageIdx,
        stageName: stg.stageName || `Phase ${stageIdx + 1}`,
        description: stg.stageDescription || "",
        x: colX,
        y: startY,
        width: cardWidth,
        steps: stageSteps,
      };
    });

    const totalWidth = Math.max(
      startX + stages.length * (colWidth + colGap) + 100,
      1400
    );
    const totalHeight = Math.max(maxColumnHeight + 120, 900);

    return {
      stageLayouts: layouts,
      nodePositions: positions,
      dynamicEdges: rawEdges,
      canvasDimensions: { width: totalWidth, height: totalHeight },
    };
  }, [stages, steps, rawEdges]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    // Don't drag if clicking buttons or inputs
    if (e.target.closest("button") || e.target.closest("input")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 1.8));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.45));
  const handleResetZoom = () => {
    setScale(0.85);
    setPan({ x: 40, y: 40 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.45), 1.8));
  };

  // Node click handler
  const handleSelectNode = (step) => {
    setActiveNodeKey(step.id);
    setIsDrawerOpen(true);
  };

  // Toggle stage collapse for State Tree view
  const toggleCollapseStage = (stageIdx) => {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageIdx)) {
        next.delete(stageIdx);
      } else {
        next.add(stageIdx);
      }
      return next;
    });
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "advanced":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "intermediate":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
  };

  const filteredSteps = useMemo(() => {
    if (!searchQuery.trim()) return steps;
    const q = searchQuery.toLowerCase().trim();
    return steps.filter(
      (s) =>
        s.topic.toLowerCase().includes(q) ||
        (s.whyItMatters && s.whyItMatters.toLowerCase().includes(q)) ||
        (s.stageName && s.stageName.toLowerCase().includes(q))
    );
  }, [steps, searchQuery]);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-2xl md:rounded-3xl glass-card border border-white/10 overflow-hidden flex flex-col bg-zinc-950 shadow-2xl relative select-none ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-none" : "min-h-[720px]"
      }`}
    >
      {/* 1. Header Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 glass bg-zinc-950/80 z-20">
        {/* Left: Search input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter topics, skills, prerequisites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-900/80 border border-white/15 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
          </div>
          {searchQuery && (
            <span className="text-[11px] font-mono text-orange-400 whitespace-nowrap">
              {filteredSteps.length} matches
            </span>
          )}
        </div>

        {/* Right: Controls & View toggles */}
        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode("many-to-many")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "many-to-many"
                  ? "bg-orange-500/25 text-amber-200 border border-orange-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Graph View</span>
            </button>
            <button
              onClick={() => setViewMode("state-tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "state-tree"
                  ? "bg-orange-500/25 text-amber-200 border border-orange-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tree View</span>
            </button>
            <button
              onClick={() => setViewMode("curriculum")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "curriculum"
                  ? "bg-orange-500/25 text-amber-200 border border-orange-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Zoom & Fullscreen Controls */}
          {viewMode === "many-to-many" && (
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-zinc-300">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset View"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 text-orange-400" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Canvas Views */}
      {viewMode === "many-to-many" && (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`relative w-full flex-1 min-h-[620px] overflow-hidden cursor-${
            isDragging ? "grabbing" : "grab"
          }`}
        >
          {/* Canvas Dot Grid Background */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #f97316 1px, transparent 1px)`,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Ambient Glow Atmosphere */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />

          {/* Canvas Viewport with Pan & Scale */}
          <div
            className="absolute origin-top-left transition-transform duration-75 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
            }}
          >
            {/* SVG Dependency Lines Layer */}
            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-10"
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
              }}
            >
              <defs>
                <linearGradient id="ragLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
                </linearGradient>

                <filter id="ragGlowPath" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                <marker
                  id="ragArrow"
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

              {dynamicEdges.map((edge, idx) => {
                const p1 = nodePositions[edge.source];
                const p2 = nodePositions[edge.target];
                if (!p1 || !p2) return null;

                const isConnected =
                  activeNodeKey === edge.source ||
                  activeNodeKey === edge.target ||
                  hoveredNodeKey === edge.source ||
                  hoveredNodeKey === edge.target;

                let pathD = "";
                if (p1.x < p2.x) {
                  // Forward cross-stage connection (cubic bezier curve)
                  const x1 = p1.x + p1.width;
                  const y1 = p1.y + p1.height / 2;
                  const x2 = p2.x;
                  const y2 = p2.y + p2.height / 2;
                  const deltaX = (x2 - x1) * 0.5;
                  pathD = `M ${x1} ${y1} C ${x1 + deltaX} ${y1}, ${x2 - deltaX} ${y2}, ${x2} ${y2}`;
                } else {
                  // Same-stage or reverse connection
                  const x1 = p1.x + p1.width / 2;
                  const y1 = p1.y + p1.height;
                  const x2 = p2.x + p2.width / 2;
                  const y2 = p2.y;
                  pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
                }

                return (
                  <path
                    key={idx}
                    d={pathD}
                    fill="none"
                    stroke={
                      isConnected ? "#f97316" : "rgba(249, 115, 22, 0.35)"
                    }
                    strokeWidth={isConnected ? "2.6" : "1.8"}
                    strokeDasharray={isConnected ? "none" : "5,4"}
                    markerEnd="url(#ragArrow)"
                    filter={isConnected ? "url(#ragGlowPath)" : "none"}
                    className="transition-all duration-200"
                  />
                );
              })}
            </svg>

            {/* Stages & Individual Node Cards Layer */}
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
                  {/* Stage Header */}
                  <div className="mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-widest block">
                        STAGE 0{stg.stageIndex + 1}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-white tracking-tight truncate max-w-[190px]">
                        {stg.stageName}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      {stg.steps.length} {stg.steps.length === 1 ? "node" : "nodes"}
                    </span>
                  </div>

                  {/* Individual Node Cards */}
                  <div className="space-y-4">
                    {stg.steps.map((step) => {
                      const isSelected = activeNodeKey === step.id;
                      const isConnected = connectedKeys.has(step.id);
                      const currentStatus =
                        nodeStatusMap.get(step.id) || "not_started";
                      const courseCount = step.recommendedCourses?.length || 0;
                      const prereqCount = step.prerequisites?.length || 0;

                      const isMatched =
                        !searchQuery.trim() ||
                        step.topic
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase().trim());

                      return (
                        <div
                          key={step.id}
                          onClick={() => handleSelectNode(step)}
                          onMouseEnter={() => setHoveredNodeKey(step.id)}
                          onMouseLeave={() => setHoveredNodeKey(null)}
                          style={{
                            width: "250px",
                            height: "100px",
                            borderColor: isSelected
                              ? "#f97316"
                              : isConnected
                              ? "rgba(249, 115, 22, 0.6)"
                              : "rgba(255, 255, 255, 0.12)",
                            boxShadow: isSelected
                              ? "0 0 25px rgba(249, 115, 22, 0.45)"
                              : isConnected
                              ? "0 0 15px rgba(249, 115, 22, 0.25)"
                              : "none",
                          }}
                          className={`rounded-2xl p-3 bg-zinc-950/90 backdrop-blur-md border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:border-orange-500/60 hover:bg-zinc-900/90 relative ${
                            isSelected ? "ring-2 ring-orange-500/40" : ""
                          } ${!isMatched ? "opacity-30" : "opacity-100"}`}
                        >
                          {/* Top Row: Status Indicator & Difficulty */}
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
                              {currentStatus === "locked" && (
                                <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Locked</span>
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

                          {/* Middle Row: Topic Name */}
                          <h5 className="text-xs md:text-sm font-bold text-white tracking-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                            {step.topic}
                          </h5>

                          {/* Bottom Row: Prerequisites & Courses indicator */}
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/5 pt-1">
                            <span className="flex items-center gap-1 text-zinc-400 group-hover:text-orange-400 transition-colors">
                              {prereqCount > 0 ? (
                                <span>{prereqCount} prereqs</span>
                              ) : (
                                <span>Foundation</span>
                              )}
                              {courseCount > 0 && ` • ${courseCount} links`}
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
        </div>
      )}

      {/* 3. State Tree View Mode */}
      {viewMode === "state-tree" && (
        <div className="p-6 md:p-8 space-y-8 max-h-[850px] overflow-y-auto bg-zinc-950/75 flex-1">
          {stages.map((stg) => {
            const isCollapsed = collapsedStages.has(stg.stageIndex);
            const stageSteps = steps.filter((s) => s.stageIndex === stg.stageIndex);
            const completedInStage = stageSteps.filter(
              (s) => nodeStatusMap.get(s.id) === "completed"
            ).length;

            return (
              <div
                key={stg.stageIndex}
                className="w-full rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden shadow-lg backdrop-blur-md"
              >
                {/* Phase Header with Collapse Button */}
                <div
                  onClick={() => toggleCollapseStage(stg.stageIndex)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-amber-200 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      {stg.stageName || `Phase ${stg.stageIndex + 1}`}
                    </div>
                    <span className="text-xs text-zinc-400 hidden sm:inline">
                      {stg.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-400">
                      {completedInStage}/{stageSteps.length} done
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {/* Grid of Nodes in Phase */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stageSteps.map((node) => {
                      const currentStatus =
                        nodeStatusMap.get(node.id) || "not_started";
                      const isCompleted = currentStatus === "completed";
                      const isMatched =
                        !searchQuery.trim() ||
                        node.topic
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase().trim());

                      return (
                        <button
                          key={node.id}
                          onClick={() => handleSelectNode(node)}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer border ${
                            isCompleted
                              ? "bg-emerald-950/70 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10"
                              : isMatched
                              ? "bg-zinc-900/90 border-white/15 hover:border-orange-500/50 hover:bg-zinc-800/95 text-zinc-100 hover:text-white"
                              : "opacity-40 bg-zinc-900/50 border-white/10 text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : currentStatus === "in_progress" ? (
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : currentStatus === "locked" ? (
                              <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-400 shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate text-zinc-100">
                                {node.topic}
                              </p>
                              <span className="text-[10px] text-zinc-400 font-mono block">
                                {node.difficulty} • {node.estimatedEffort || "1-2 weeks"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Curriculum / Detailed List View */}
      {viewMode === "curriculum" && (
        <div className="p-6 md:p-8 space-y-4 max-h-[850px] overflow-y-auto bg-zinc-950/75 flex-1">
          {filteredSteps.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-sm font-medium">
              No matching topics found for &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredSteps.map((node, index) => {
              const currentStatus = nodeStatusMap.get(node.id) || "not_started";
              const isCompleted = currentStatus === "completed";

              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectNode(node)}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/95 border border-white/15 hover:border-orange-500/50 backdrop-blur-md transition-all cursor-pointer group shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-white/25 text-[11px] font-bold text-zinc-300 bg-white/5">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
                          {node.stageName}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getDifficultyBadge(
                            node.difficulty
                          )}`}
                        >
                          {node.difficulty}
                        </span>
                      </div>
                      <h4 className="text-sm md:text-base font-bold text-white group-hover:text-amber-300 transition-colors tracking-tight">
                        {node.topic}
                      </h4>
                      <p className="text-xs md:text-sm text-zinc-300 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {node.whyItMatters || node.whatYouWillLearn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5 text-xs text-orange-400 font-semibold group-hover:text-amber-300">
                    <span className="hidden sm:inline">
                      {node.recommendedCourses?.length || 0} links
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. Interactive Topic Details Drawer */}
      <RoadmapStepDrawer
        step={activeStep}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        status={activeStep ? nodeStatusMap.get(activeStep.id) : "not_started"}
        onUpdateStatus={async (stepId, newStatus) => {
          if (onUpdateStepStatus) {
            await onUpdateStepStatus(stepId, newStatus);
          }
        }}
      />
    </div>
  );
}

