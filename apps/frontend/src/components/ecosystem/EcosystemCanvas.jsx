"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Cpu,
  GitBranch,
  Terminal,
  FileCheck,
  HeartPulse,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Compass,
  Layers,
} from "lucide-react";
import {
  ECOSYSTEM_PROJECTS,
  ECOSYSTEM_CONNECTIONS,
} from "../../lib/ecosystemData";
import RoadmapCanvasView from "../roadmap/RoadmapCanvasView";

const PROJECT_ICONS = {
  flowctrl: Cpu,
  codecollab: GitBranch,
  judgex: Terminal,
  "mental-health": HeartPulse,
  "resume-screener": FileCheck,
};

export default function EcosystemCanvas({
  activeProjectId,
  onSelectProject,
  viewMode = "roadmap",
  onViewModeChange,
  roadmapData = null,
  activeStepId = null,
  onSelectStep = () => {},
  stepProgress = {},
}) {
  const containerRef = useRef(null);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [hoveredConnId, setHoveredConnId] = useState(null);

  // Auto-center canvas on mount or view mode change
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (viewMode === "roadmap") {
        setScale(0.85);
        setPan({ x: 30, y: 30 });
      } else {
        // Virtual canvas coordinates: width 1100, height 760. Center is (550, 380).
        const initialScale = Math.min(
          Math.max(clientWidth / 1200, 0.65),
          1.05
        );
        setScale(initialScale);
        setPan({
          x: (clientWidth - 1100 * initialScale) / 2,
          y: (clientHeight - 760 * initialScale) / 2,
        });
      }
    }
  }, [viewMode, roadmapData?.id]);

  // Quick lookup map
  const projectMap = useMemo(() => {
    const map = {};
    ECOSYSTEM_PROJECTS.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, []);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
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
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.15, 1.6));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.15, 0.55));
  const handleResetZoom = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (viewMode === "roadmap") {
        setScale(0.85);
        setPan({ x: 30, y: 30 });
      } else {
        const initialScale = Math.min(
          Math.max(clientWidth / 1200, 0.65),
          1.05
        );
        setScale(initialScale);
        setPan({
          x: (clientWidth - 1100 * initialScale) / 2,
          y: (clientHeight - 760 * initialScale) / 2,
        });
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.55), 1.6));
  };

  const centerNode = projectMap["flowctrl"];

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-[620px] sm:h-[680px] lg:h-[720px] bg-zinc-950 rounded-2xl md:rounded-3xl border border-white/15 overflow-hidden select-none cursor-${
        isDragging ? "grabbing" : "grab"
      } shadow-2xl shadow-black/90`}
    >
      {/* Background Engineering Atmosphere: Grid + Radial Reactor Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central Core Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-orange-500/10 rounded-full blur-[140px]" />
        {/* Subtle satellite color accents */}
        <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/6 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-rose-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/6 -translate-y-1/2 w-[250px] h-[350px] bg-purple-500/10 rounded-full blur-[110px]" />
        <div className="absolute top-1/2 right-1/6 -translate-y-1/2 w-[250px] h-[350px] bg-cyan-500/10 rounded-full blur-[110px]" />

        {/* Micro-dot circuit grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-zinc-600 hidden md:block">
          [DRAG TO PAN] • [SCROLL TO ZOOM] • [CLICK NODE TO FOCUS]
        </div>
      </div>

      {/* Top HUD Bar with Mode Switcher & Subsystem Tag */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left Subsystem Tag */}
        <div className="font-mono text-[10px] text-zinc-400 flex items-center gap-2 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md pointer-events-auto shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {viewMode === "roadmap"
              ? "FLOWCTRL_RAG: INTERACTIVE_CAREER_ROADMAP"
              : "FLOWCTRL_ECOSYSTEM: 5_NODES_SYMMETRICAL"}
          </span>
        </div>

        {/* Right Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950/90 border border-white/15 backdrop-blur-md shadow-2xl pointer-events-auto">
          <button
            type="button"
            onClick={() => onViewModeChange && onViewModeChange("roadmap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "roadmap"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>AI Roadmap</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange && onViewModeChange("ecosystem")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "ecosystem"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>5-Project Ecosystem</span>
          </button>
        </div>
      </div>

      {/* Pannable & Scalable Canvas Layer */}
      <div
        className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        {viewMode === "roadmap" ? (
          <RoadmapCanvasView
            roadmapData={roadmapData}
            activeStepId={activeStepId}
            onSelectStep={onSelectStep}
            stepProgress={stepProgress}
            onSwitchToEcosystem={() =>
              onViewModeChange && onViewModeChange("ecosystem")
            }
          />
        ) : (
          <>
            {/* SVG Animated Connections Layer */}
            <svg
              className="absolute inset-0 w-[1100px] h-[760px] pointer-events-none overflow-visible"
              viewBox="0 0 1100 760"
            >
          <defs>
            {/* Glowing filter */}
            <filter id="neon-trace-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Central Rotating Robotic Rings Keyframes */}
            <style>
              {`
                @keyframes cyberSpinClockwise {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes cyberSpinCounter {
                  from { transform: rotate(360deg); }
                  to { transform: rotate(0deg); }
                }
                @keyframes pulsePacket {
                  to { stroke-dashoffset: -40; }
                }
                .cyber-ring-outer {
                  transform-origin: 550px 380px;
                  animation: cyberSpinClockwise 36s linear infinite;
                }
                .cyber-ring-inner {
                  transform-origin: 550px 380px;
                  animation: cyberSpinCounter 24s linear infinite;
                }
                .animated-packet {
                  animation: pulsePacket 1.8s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                  .cyber-ring-outer, .cyber-ring-inner, .animated-packet {
                    animation: none !important;
                  }
                }
              `}
            </style>
          </defs>

          {/* Central Reactor Decorative Cybernetic Rings around FlowCTRL */}
          <g className="cyber-ring-outer opacity-35 pointer-events-none">
            <circle
              cx="550"
              cy="380"
              r="175"
              fill="none"
              stroke="#f97316"
              strokeWidth="1.2"
              strokeDasharray="8 14"
            />
            <circle
              cx="550"
              cy="380"
              r="225"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="0.8"
              strokeDasharray="4 20"
            />
          </g>

          <g className="cyber-ring-inner opacity-30 pointer-events-none">
            <circle
              cx="550"
              cy="380"
              r="135"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="14 18 4 18"
            />
          </g>

          {/* Symmetrical Connections from Center to Surrounding 4 Projects */}
          {ECOSYSTEM_CONNECTIONS.map((conn) => {
            const src = projectMap[conn.source];
            const dst = projectMap[conn.target];
            if (!src || !dst) return null;

            const isHighlighted =
              activeProjectId === dst.id ||
              hoveredProjectId === dst.id ||
              hoveredConnId === conn.id;

            const isDimmed =
              (activeProjectId && activeProjectId !== dst.id && activeProjectId !== "flowctrl") ||
              (hoveredProjectId && hoveredProjectId !== dst.id && hoveredProjectId !== "flowctrl");

            // Direct line from center (550, 380) to satellite
            const pathData = `M ${src.coordinates.x} ${src.coordinates.y} L ${dst.coordinates.x} ${dst.coordinates.y}`;

            // Midpoint coordinates
            const midX = (src.coordinates.x + dst.coordinates.x) / 2;
            const midY = (src.coordinates.y + dst.coordinates.y) / 2;

            return (
              <g
                key={conn.id}
                className={`transition-opacity duration-300 ${
                  isDimmed ? "opacity-25" : "opacity-95"
                }`}
                style={{ pointerEvents: "auto" }}
                onMouseEnter={() => setHoveredConnId(conn.id)}
                onMouseLeave={() => setHoveredConnId(null)}
              >
                {/* Invisible wide line for hover accessibility */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="32"
                  className="cursor-pointer"
                />

                {/* Main Neon Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth={isHighlighted ? "3.5" : "2"}
                  filter="url(#neon-trace-glow)"
                  opacity={isHighlighted ? 1 : 0.75}
                  className="transition-all duration-200"
                />

                {/* Animated Light Packet Trail */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={isHighlighted ? "4" : "2.5"}
                  strokeDasharray="8 32"
                  strokeLinecap="round"
                  className="animated-packet"
                  opacity={isHighlighted ? 1 : 0.7}
                />

                {/* Midpoint Circuit Diode Chip with Short Label */}
                <g
                  transform={`translate(${midX}, ${midY})`}
                  className="cursor-pointer"
                  onClick={() => onSelectProject(dst.id)}
                >
                  <rect
                    x="-65"
                    y="-12"
                    width="130"
                    height="24"
                    rx="12"
                    fill="#09090b"
                    stroke={conn.color}
                    strokeWidth={isHighlighted ? "2" : "1"}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx="-52"
                    cy="0"
                    r="3.5"
                    fill={conn.color}
                    className="animate-pulse"
                  />
                  <text
                    x="2"
                    y="3.5"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {conn.shortLabel}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Project Nodes Layer */}
        {ECOSYSTEM_PROJECTS.map((project) => {
          const isCenter = project.isCenter;
          const isSelected = activeProjectId === project.id;
          const isHovered = hoveredProjectId === project.id;
          const isDimmed =
            activeProjectId && activeProjectId !== project.id && !isCenter;

          const Icon = PROJECT_ICONS[project.id] || Cpu;

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              onMouseEnter={() => setHoveredProjectId(project.id)}
              onMouseLeave={() => setHoveredProjectId(null)}
              style={{
                left: `${project.coordinates.x}px`,
                top: `${project.coordinates.y}px`,
                transform: `translate(-50%, -50%) scale(${
                  isSelected ? 1.08 : isHovered ? 1.05 : 1
                })`,
              }}
              className={`absolute cursor-pointer transition-all duration-200 z-20 ${
                isDimmed ? "opacity-35" : "opacity-100"
              }`}
            >
              {isCenter ? (
                /* FlowCTRL Robotic Core (Dominant Centerpiece) */
                <div
                  className={`relative w-76 sm:w-84 rounded-2xl p-5 sm:p-6 bg-zinc-950/95 backdrop-blur-2xl border-2 ${
                    isSelected
                      ? "border-orange-400 shadow-[0_0_60px_rgba(249,115,22,0.7)] ring-2 ring-orange-400/50"
                      : "border-orange-500/80 hover:border-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                  }`}
                >
                  {/* High-tech corner bracket calipers */}
                  <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-orange-400 pointer-events-none" />
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-orange-400 pointer-events-none" />
                  <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-orange-400 pointer-events-none" />
                  <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-orange-400 pointer-events-none" />

                  {/* Header Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      CORE_REACTOR_HUB
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-400/40">
                      CENTRAL HUB
                    </span>
                  </div>

                  {/* Icon & Name */}
                  <div className="flex items-center gap-3.5 mb-2.5">
                    <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/10 border border-orange-400/50 flex items-center justify-center text-orange-400 shrink-0 shadow-lg shadow-orange-500/20">
                      <Icon className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        {project.name}
                      </h3>
                      <p className="text-xs text-orange-300 font-medium italic">
                        {project.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Core Statement */}
                  <p className="text-xs text-zinc-300 leading-relaxed border-l-2 border-orange-500/60 pl-2.5 py-0.5 mb-3">
                    {project.coreStatement}
                  </p>

                  {/* Robotic Telemetry Status Strip */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      4 SATELLITES SYNCHRONIZED
                    </span>
                    <span className="text-zinc-500">NEXT_STEP_OS</span>
                  </div>
                </div>
              ) : (
                /* Surrounding Symmetrical Project Node */
                <div
                  style={{
                    borderColor: isSelected
                      ? project.accentColor
                      : `${project.accentColor}99`,
                    boxShadow: isSelected
                      ? `0 0 45px ${project.accentGlow}`
                      : isHovered
                      ? `0 0 30px ${project.accentGlow}`
                      : "none",
                  }}
                  className={`relative w-60 sm:w-68 rounded-xl p-4 bg-zinc-950/90 backdrop-blur-xl border ${
                    isSelected ? "ring-2 ring-white/40 scale-105" : "hover:border-white/50"
                  }`}
                >
                  {/* Subtle technical corner notches */}
                  <div
                    style={{ borderColor: project.accentColor }}
                    className="absolute top-1 left-1 w-2 h-2 border-t border-l pointer-events-none"
                  />
                  <div
                    style={{ borderColor: project.accentColor }}
                    className="absolute bottom-1 right-1 w-2 h-2 border-b border-r pointer-events-none"
                  />

                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{ color: project.accentColor }}
                      className="font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <span
                        style={{ backgroundColor: project.accentColor }}
                        className="w-1.5 h-1.5 rounded-full"
                      />
                      {project.badge}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      {project.position} NODE
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      style={{
                        backgroundColor: `${project.accentColor}25`,
                        borderColor: `${project.accentColor}50`,
                        color: project.accentColor,
                      }}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white tracking-tight truncate">
                        {project.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {project.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Short Role Summary */}
                  <p className="text-[11px] text-zinc-300 leading-tight line-clamp-2">
                    {project.shortDescription}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        </>
      )}
    </div>

      {/* Minimal Unobtrusive Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 p-1 rounded-xl bg-zinc-950/80 border border-white/10 glass shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="Reset Zoom"
          aria-label="Reset View"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
