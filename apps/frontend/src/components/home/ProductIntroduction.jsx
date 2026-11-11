"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Route,
  CheckCircle2,
  TrendingUp,
  Flag,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ProductIntroduction() {
  const [selectedTrack, setSelectedTrack] = useState("dsa"); // 'dsa' | 'projects' | 'systems' | 'all'
  const [activeNodeId, setActiveNodeId] = useState(5); // default on DSA Practice (Node 5)
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // 13 Expanded States across 6 tiers in a Many-to-Many Tree/DAG formation
  const treeNodes = [
    // Tier 0: Root
    {
      id: 0,
      number: "01",
      title: "START",
      subtitle: "Set Ambition",
      tier: 0,
      feature: "Onboarding",
      route: "/roadmaps",
      x: 350,
      y: 30,
    },
    // Tier 1: Target Role
    {
      id: 1,
      number: "02",
      title: "Career Goal",
      subtitle: "Target Tech Role",
      tier: 1,
      feature: "Role Alignment",
      route: "/roadmaps",
      x: 350,
      y: 80,
    },
    // Tier 2: Foundation (3 Joining States)
    {
      id: 2,
      number: "03",
      title: "Explore Roadmaps",
      subtitle: "101 Tracks",
      tier: 2,
      feature: "Career Roadmaps",
      route: "/roadmaps",
      x: 175,
      y: 150,
    },
    {
      id: 3,
      number: "04",
      title: "Skill Assessment",
      subtitle: "Identify Gaps",
      tier: 2,
      feature: "Skill Assessment",
      route: "/resources",
      x: 350,
      y: 150,
    },
    {
      id: 4,
      number: "05",
      title: "Curated Resources",
      subtitle: "Docs & Books",
      tier: 2,
      feature: "Curated Resources",
      route: "/resources",
      x: 525,
      y: 150,
    },
    // Tier 3: Core Mastery (4 Many-to-Many Practice States)
    {
      id: 5,
      number: "06",
      title: "Practice DSA",
      subtitle: "24 Languages",
      tier: 3,
      feature: "DSA Practice",
      route: "/dsa",
      x: 125,
      y: 235,
    },
    {
      id: 6,
      number: "07",
      title: "Project Tutorials",
      subtitle: "1,274 Build Guides",
      tier: 3,
      feature: "Project Tutorials",
      route: "/project-tutorials",
      x: 275,
      y: 235,
    },
    {
      id: 7,
      number: "08",
      title: "System Design",
      subtitle: "Architecture",
      tier: 3,
      feature: "System Architecture",
      route: "/roadmaps",
      x: 425,
      y: 235,
    },
    {
      id: 8,
      number: "09",
      title: "AI Assistant",
      subtitle: "24/7 Guidance",
      tier: 3,
      feature: "AI Assistant",
      route: "/assistant",
      x: 575,
      y: 235,
    },
    // Tier 4: Validation & Tracking (3 Many-to-Many Verification States)
    {
      id: 9,
      number: "10",
      title: "Track Progress",
      subtitle: "Live Dashboard",
      tier: 4,
      feature: "Mission Control",
      route: "/dashboard",
      x: 180,
      y: 325,
    },
    {
      id: 10,
      number: "11",
      title: "Technical Evaluation",
      subtitle: "Interview Prep",
      tier: 4,
      feature: "Interview Readiness",
      route: "/roadmaps",
      x: 350,
      y: 325,
    },
    {
      id: 11,
      number: "12",
      title: "Resume Screener",
      subtitle: "ATS Match",
      tier: 4,
      feature: "Resume Screener",
      route: "/resume-screener",
      x: 520,
      y: 325,
    },
    // Tier 5: Terminal Milestone
    {
      id: 12,
      number: "13",
      title: "Career Readiness",
      subtitle: "Job Verified",
      tier: 5,
      feature: "Career Readiness",
      route: "/assistant",
      x: 350,
      y: 415,
    },
  ];

  // 24 Many-to-Many Directed Relations across the joining states
  const treeEdges = [
    // Tier 0 -> Tier 1
    { from: 0, to: 1, tracks: ["dsa", "projects", "systems"] },

    // Tier 1 -> Tier 2 (Goal branching to 3 Foundation states)
    { from: 1, to: 2, tracks: ["dsa", "systems"] },
    { from: 1, to: 3, tracks: ["dsa", "projects", "systems"] },
    { from: 1, to: 4, tracks: ["projects", "systems"] },

    // Tier 2 -> Tier 3 (Many-to-Many Joining: 3 Foundation states -> 4 Core Mastery states)
    { from: 2, to: 5, tracks: ["dsa"] },
    { from: 2, to: 6, tracks: ["projects"] },
    { from: 3, to: 5, tracks: ["dsa"] },
    { from: 3, to: 6, tracks: ["projects"] },
    { from: 3, to: 7, tracks: ["systems"] },
    { from: 4, to: 6, tracks: ["projects"] },
    { from: 4, to: 7, tracks: ["systems"] },
    { from: 4, to: 8, tracks: ["systems"] },

    // Tier 3 -> Tier 4 (Many-to-Many Joining: 4 Core Mastery states -> 3 Validation states)
    { from: 5, to: 9, tracks: ["dsa"] },
    { from: 5, to: 10, tracks: ["dsa"] },
    { from: 6, to: 9, tracks: ["projects"] },
    { from: 6, to: 10, tracks: ["projects"] },
    { from: 6, to: 11, tracks: ["projects"] },
    { from: 7, to: 10, tracks: ["systems"] },
    { from: 7, to: 11, tracks: ["systems"] },
    { from: 8, to: 10, tracks: ["systems"] },
    { from: 8, to: 11, tracks: ["systems"] },

    // Tier 4 -> Tier 5 (3 Validation states -> Career Readiness)
    { from: 9, to: 12, tracks: ["dsa", "projects"] },
    { from: 10, to: 12, tracks: ["dsa", "projects", "systems"] },
    { from: 11, to: 12, tracks: ["projects", "systems"] },
  ];

  // Auto-cycle through tracks when user is idle
  useEffect(() => {
    if (isPaused) return;

    const tracks = ["dsa", "projects", "systems", "all"];
    timerRef.current = setInterval(() => {
      setSelectedTrack((prev) => {
        const nextIdx = (tracks.indexOf(prev) + 1) % tracks.length;
        const nextTrack = tracks[nextIdx];
        if (nextTrack === "dsa") setActiveNodeId(5); // DSA
        else if (nextTrack === "projects") setActiveNodeId(6); // Projects
        else if (nextTrack === "systems") setActiveNodeId(7); // System Design
        else setActiveNodeId(12); // Readiness
        return nextTrack;
      });
    }, 3400);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  // Determine if an edge is glowing (active track or directly incident to activeNode)
  const isEdgeGlowing = (edge) => {
    // If user clicked a specific node, highlight all its many-to-many connections
    if (isPaused && (edge.from === activeNodeId || edge.to === activeNodeId)) {
      return true;
    }
    if (selectedTrack === "all") return true;
    return edge.tracks.includes(selectedTrack);
  };

  // Determine if a node is glowing
  const isNodeGlowing = (node) => {
    if (node.id === activeNodeId) return true;
    if (selectedTrack === "all") return true;
    if (node.tier === 0 || node.tier === 1 || node.tier === 5) return true;
    // Check if any glowing edge connects to this node
    return treeEdges.some(
      (e) => (e.from === node.id || e.to === node.id) && e.tracks.includes(selectedTrack)
    );
  };

  const activeNode = treeNodes.find((n) => n.id === activeNodeId) || treeNodes[0];

  // 4 Approved Core Features
  const features = [
    {
      title: "A plan shaped around your goals",
      description:
        "Explore learning paths for tech careers, from software development to AI and more. FlowCTRL organizes skills into a step-by-step roadmap, so you can focus on what matters for your direction.",
      icon: Route,
      badge: "Career Roadmaps",
    },
    {
      title: "See what to learn next",
      description:
        "Review your current skills, identify areas to build, and get recommendations designed to help you move forward at a manageable pace.",
      icon: CheckCircle2,
      badge: "Tutorials & Resources",
    },
    {
      title: "Keep your progress visible",
      description:
        "Track completed topics and see how far you've come. When your goals or skills change, revisit your plan and decide on your next step.",
      icon: TrendingUp,
      badge: "Progress Dashboard",
    },
    {
      title: "Start with what you know",
      description:
        "You don't need a perfect plan before you begin. Bring a career goal—or just an area you're curious about—and use FlowCTRL to turn it into a practical place to start.",
      icon: Flag,
      badge: "Skill Assessment",
    },
  ];

  return (
    <section className="py-16 md:py-20 px-6 sm:px-8 border-t border-b border-white/10 bg-zinc-950/70 text-zinc-100 relative">
      {/* Lightweight CSS keyframes for many-to-many glowing flow animation */}
      <style>{`
        @keyframes treeDashGlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes branchPulseHalo {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .tree-line-glowing {
          stroke-dasharray: 6 4;
          animation: treeDashGlow 1.2s linear infinite;
        }
        .tree-node-glow {
          animation: branchPulseHalo 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .tree-line-glowing, .tree-node-glow {
            animation: none !important;
            stroke-dashoffset: 0 !important;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Top: Section Identifier */}
        <div className="flex items-center gap-2 text-xs font-mono font-medium tracking-widest text-orange-400 uppercase mb-8 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
          <span>UNDERSTANDING FLOWCTRL / YOUR CAREER WORKSPACE</span>
        </div>

        {/* Main 2-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-16">
          {/* Left Column (approx 40%) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mb-4 text-left">
                Build the skills. Find your direction.
              </h2>

              <p className="text-sm sm:text-base font-medium text-orange-400 mb-3 text-left">
                A clearer path from where you are to the tech career you want.
              </p>

              <p className="text-sm text-zinc-300 leading-relaxed font-normal mb-6 text-left">
                Tell FlowCTRL what role you're aiming for and what you already know.
                It helps you spot skills to work on, map out what to learn next,
                and keep track of your progress—all in one place.
              </p>

              {/* Ecosystem Capabilities & Many-to-Many Integration */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 mb-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>INTERCONNECTED STATE MACHINE</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  FlowCTRL acts as an interconnected career state machine: foundational{" "}
                  <strong>Roadmaps</strong>, <strong>Skill Assessments</strong>, and{" "}
                  <strong>Curated Resources</strong> join in many-to-many paths with{" "}
                  <strong>DSA Practice</strong>, <strong>1,274 Project Tutorials</strong>, and{" "}
                  <strong>System Design</strong>. These cross-connect directly into live{" "}
                  <strong>Progress Metrics</strong> and the <strong>Resume Screener</strong> to prove interview readiness.
                </p>

                {/* Interactive Track Filter Buttons */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                    Select a learning track to illuminate connections:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("dsa");
                        setActiveNodeId(5);
                        setIsPaused(true);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        selectedTrack === "dsa"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      DSA Practice Track
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("projects");
                        setActiveNodeId(6);
                        setIsPaused(true);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        selectedTrack === "projects"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      Project Builds Track
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("systems");
                        setActiveNodeId(7);
                        setIsPaused(true);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        selectedTrack === "systems"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      System Architecture Track
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrack("all");
                        setActiveNodeId(12);
                        setIsPaused(true);
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        selectedTrack === "all"
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : "bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700"
                      }`}
                    >
                      Full Many-to-Many Graph
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Short Closing Statement */}
            <div className="pt-6 border-t border-white/10 text-left mt-2">
              <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight mb-1">
                Your next step starts here.
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 italic">
                Choose a goal. Find your path. Keep moving.
              </p>
            </div>
          </div>

          {/* Right Column (approx 60%): Many-to-Many Tree Formation Graph */}
          <div
            className="lg:col-span-7"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 shadow-sm relative overflow-hidden">
              {/* Header with State & Edge Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  STATE TREE & MANY-TO-MANY GRAPH
                </span>
                <span className="text-[11px] text-orange-400 font-sans">
                  Active State: <strong>{activeNode.title}</strong> ({activeNode.number}/13)
                </span>
              </div>

              {/* Scalable SVG Many-to-Many State Tree */}
              <div className="w-full relative flex items-center justify-center">
                <svg
                  viewBox="0 0 700 460"
                  className="w-full h-auto select-none"
                  style={{ maxHeight: "540px" }}
                >
                  <defs>
                    {/* SVG Filter for Glowing Lines */}
                    <filter
                      id="branch-glow-filter"
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="160%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="3"
                        floodColor="#f97316"
                        floodOpacity="0.8"
                      />
                    </filter>
                    {/* SVG Filter for Active Focused State */}
                    <filter
                      id="active-node-filter"
                      x="-40%"
                      y="-40%"
                      width="180%"
                      height="180%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="5"
                        floodColor="#ea580c"
                        floodOpacity="0.9"
                      />
                    </filter>
                  </defs>

                  {/* 1. Many-to-Many Connecting Lines */}
                  {treeEdges.map((edge) => {
                    const fromNode = treeNodes.find((n) => n.id === edge.from);
                    const toNode = treeNodes.find((n) => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    const glowing = isEdgeGlowing(edge);
                    // Smooth curved Bézier line between joining states
                    const pathD = `M ${fromNode.x} ${fromNode.y} C ${fromNode.x} ${(fromNode.y + toNode.y) / 2}, ${toNode.x} ${(fromNode.y + toNode.y) / 2}, ${toNode.x} ${toNode.y}`;

                    return (
                      <g key={`edge-${edge.from}-${edge.to}`}>
                        {/* Background Base Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={
                            glowing
                              ? "rgba(249, 115, 22, 0.2)"
                              : "rgba(255, 255, 255, 0.08)"
                          }
                          strokeWidth={glowing ? "2.5" : "1.2"}
                        />

                        {/* Animated Glowing Overlay Line */}
                        {glowing && (
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="2.5"
                            className="tree-line-glowing"
                            filter="url(#branch-glow-filter)"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* 2. Circular State Nodes */}
                  {treeNodes.map((node) => {
                    const glowing = isNodeGlowing(node);
                    const isDirectlyActive = node.id === activeNodeId;
                    const r = isDirectlyActive ? 17 : 14;

                    return (
                      <g
                        key={`node-${node.id}`}
                        onClick={() => {
                          setActiveNodeId(node.id);
                          setIsPaused(true);
                        }}
                        className="cursor-pointer group"
                      >
                        {/* Outer Glow Halo for Active Focused Node */}
                        {isDirectlyActive && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={r + 5}
                            fill="none"
                            stroke="#ea580c"
                            strokeWidth="2"
                            opacity="0.65"
                            filter="url(#active-node-filter)"
                            className="tree-node-glow"
                          />
                        )}

                        {/* State Circle */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={r}
                          fill={isDirectlyActive ? "#ea580c" : glowing ? "#18181b" : "#09090b"}
                          stroke={
                            isDirectlyActive
                              ? "#fff"
                              : glowing
                                ? "#f97316"
                                : "rgba(255, 255, 255, 0.18)"
                          }
                          strokeWidth={glowing || isDirectlyActive ? "2.2" : "1.2"}
                          filter={glowing ? "url(#branch-glow-filter)" : "none"}
                          className="transition-all duration-300"
                        />

                        {/* Circle Step Number */}
                        <text
                          x={node.x}
                          y={node.y + 3.5}
                          textAnchor="middle"
                          fill={isDirectlyActive ? "#fff" : glowing ? "#f97316" : "#71717a"}
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.number}
                        </text>

                        {/* Node Title Label */}
                        <text
                          x={node.x}
                          y={node.y + r + 11}
                          textAnchor="middle"
                          fill={isDirectlyActive ? "#ffffff" : glowing ? "#f4f4f5" : "#71717a"}
                          fontSize="9.5"
                          fontWeight={glowing ? "600" : "400"}
                          className="transition-colors duration-300"
                        >
                          {node.title}
                        </text>

                        {/* Node Subtitle Label */}
                        <text
                          x={node.x}
                          y={node.y + r + 21}
                          textAnchor="middle"
                          fill={isDirectlyActive ? "#fdba74" : glowing ? "#a1a1aa" : "#52525b"}
                          fontSize="8"
                          fontFamily="sans-serif"
                        >
                          {node.subtitle}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Active State Deep-Dive Footer */}
              <div className="mt-2 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-orange-400 font-mono font-medium">
                    State {activeNode.number}:
                  </span>
                  <span className="font-semibold text-white">{activeNode.title}</span>
                  <span className="text-zinc-400 text-[11px]">— {activeNode.subtitle}</span>
                </div>
                <Link
                  href={activeNode.route}
                  className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors font-medium shrink-0 text-xs"
                >
                  <span>Explore {activeNode.feature}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Feature Presentation: Compact 2x2 Grid (Approved Layout Preserved) */}
        <div className="pt-10 border-t border-white/10">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              KEY WORKSPACE CAPABILITIES
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              INTEGRATED WORKSPACE MODULES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-white/10 bg-zinc-900/40 p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2.5 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-orange-400 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {feature.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-white/10 text-zinc-400 hidden sm:inline-block">
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal pl-9">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
