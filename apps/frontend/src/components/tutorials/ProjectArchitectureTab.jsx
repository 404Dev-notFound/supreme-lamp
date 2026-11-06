"use client";

import React from "react";
import {
  Layers,
  Cpu,
  Workflow,
  Network,
  Database,
  ShieldAlert,
  Server,
  Zap,
  CheckCircle2,
  GitBranch,
  Terminal,
  Activity,
} from "lucide-react";

export default function ProjectArchitectureTab({ project }) {
  // Infer architectural characteristics based on project attributes
  const isDatabase =
    project.categorySlug?.includes("db") ||
    project.title.toLowerCase().includes("database") ||
    project.title.toLowerCase().includes("sqlite");
  const isNetwork =
    project.categorySlug?.includes("network") ||
    project.title.toLowerCase().includes("server") ||
    project.title.toLowerCase().includes("bittorrent") ||
    project.title.toLowerCase().includes("protocol");
  const isCompiler =
    project.categorySlug?.includes("compiler") ||
    project.title.toLowerCase().includes("compiler") ||
    project.title.toLowerCase().includes("parser") ||
    project.title.toLowerCase().includes("interpreter") ||
    project.title.toLowerCase().includes("lisp");
  const isOs =
    project.categorySlug?.includes("os") ||
    project.title.toLowerCase().includes("os") ||
    project.title.toLowerCase().includes("kernel") ||
    project.title.toLowerCase().includes("shell");

  const techStack = project.technologies && project.technologies.length > 0
    ? project.technologies
    : [project.language, "POSIX", "Standard Library", "Data Structures"];

  return (
    <div className="space-y-10">
      {/* 1. Architectural Blueprint Banner */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
          <Cpu className="w-4 h-4" />
          System Design & Architecture
        </div>

        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100 mb-4">
          Architectural Blueprint & Subsystem Anatomy
        </h2>

        <p className="text-zinc-300 text-base leading-relaxed mb-6 max-w-4xl">
          {project.title} is decomposed into modular layers to isolate side effects, ensure memory safety, and maximize execution throughput. Below is the technical breakdown of components, execution workflows, and data pipelines.
        </p>

        {/* Tech Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
          <span className="text-xs text-zinc-400 font-mono">Core Stack:</span>
          {techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
            >
              {tech}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-zinc-300">
            {project.language} Core
          </span>
        </div>
      </section>

      {/* 2. Visual Architecture Pipeline (Interactive Workflow Diagram) */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Workflow className="w-4 h-4" />
            End-to-End Execution Pipeline
          </div>
          <span className="text-xs text-zinc-500 font-mono">Data Flow Visualization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Stage 1 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Stage 01
                </span>
                <Terminal className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1.5">
                {isDatabase ? "Input & REPL Parser" : isCompiler ? "Lexer & Tokenizer" : "Interface / Entrypoint"}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isDatabase
                  ? "Accepts raw queries, performs lexical analysis, parses SQL syntax into an Abstract Syntax Tree (AST)."
                  : isCompiler
                  ? "Converts input character stream into a structured stream of typed semantic tokens."
                  : "Ingests raw CLI arguments, network packets, or user commands with strict invariant validation."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              Input Validation &bull; Sanitization
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Stage 02
                </span>
                <Cpu className="w-4 h-4 text-orange-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1.5">
                {isDatabase ? "Query Planner / VM" : isCompiler ? "Parser & AST Generator" : "Dispatch & Core Engine"}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isDatabase
                  ? "Compiles AST into internal bytecode instructions and optimizes the query execution plan."
                  : isCompiler
                  ? "Constructs an Abstract Syntax Tree verifying grammar rules, scopes, and types."
                  : "Decodes command intents, coordinates worker threads, and evaluates state machines."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              Optimization &bull; Compilation
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Stage 03
                </span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1.5">
                {isDatabase ? "B-Tree & Pager Engine" : isNetwork ? "Socket & Protocol Engine" : "Memory & State Manager"}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isDatabase
                  ? "Navigates B-Tree internal/leaf nodes, writes through the cache pager, and persists raw pages to disk."
                  : isNetwork
                  ? "Manages non-blocking I/O event loops, socket buffers, and network protocol framing."
                  : "Allocates memory structures, resolves references, and executes low-level computations."}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              State Mutation &bull; Buffer Pool
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Stage 04
                </span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1.5">
                Result Serialization & Egress
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Formats computed output rows, machine bytecode, or serialized network payloads back to the caller or standard out.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-zinc-500">
              Clean Exit &bull; Resource Cleanup
            </div>
          </div>
        </div>
      </section>

      {/* 3. Subsystem Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">
            <Layers className="w-4 h-4" />
            Core Components & Interfaces
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Component Architecture</h3>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-orange-400 font-bold text-xs mt-0.5">01</span>
              <div>
                <strong className="text-zinc-100 block text-xs">Command & Interface Parser</strong>
                <span className="text-xs text-zinc-400">
                  Decodes inputs, enforces strict parameter bounds, and translates commands into internal domain objects.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-orange-400 font-bold text-xs mt-0.5">02</span>
              <div>
                <strong className="text-zinc-100 block text-xs">Deterministic Execution Engine</strong>
                <span className="text-xs text-zinc-400">
                  The primary algorithmic state machine running business logic and evaluating invariants.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-orange-400 font-bold text-xs mt-0.5">03</span>
              <div>
                <strong className="text-zinc-100 block text-xs">Persistence & Storage Layer</strong>
                <span className="text-xs text-zinc-400">
                  Manages file descriptors, memory caching, serialize/deserialize cycles, and crash recovery.
                </span>
              </div>
            </li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
            <ShieldAlert className="w-4 h-4" />
            Architectural Trade-offs & Guarantees
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-4">Engineering Constraints</h3>
          <div className="space-y-3 text-sm text-zinc-300">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1">
                <span>Memory Overhead vs Latency</span>
                <span className="text-emerald-400 font-mono text-[10px]">Optimized</span>
              </div>
              <p className="text-xs text-zinc-400">
                Paging and fixed-size chunk allocations eliminate heap fragmentation while providing predictable O(1) buffer lookups.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1">
                <span>Concurrency & State Safety</span>
                <span className="text-cyan-400 font-mono text-[10px]">Thread-Safe</span>
              </div>
              <p className="text-xs text-zinc-400">
                State mutations are gated through explicit ownership models or synchronization primitives to prevent race conditions.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1">
                <span>Crash Resiliency & Recovery</span>
                <span className="text-amber-400 font-mono text-[10px]">Zero-Data-Loss</span>
              </div>
              <p className="text-xs text-zinc-400">
                Atomic flushes and defensive error handling ensure the system fails cleanly without corrupting underlying assets.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

