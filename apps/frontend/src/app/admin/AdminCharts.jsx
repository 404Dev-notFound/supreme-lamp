"use client";

import React, { useState } from "react";
import {
  Users,
  Briefcase,
  FolderGit2,
  Building2,
  FileSpreadsheet,
  FileCheck,
  Activity,
  Cpu,
  Clock,
  HardDrive,
  Info,
  CheckCircle2,
} from "lucide-react";

/**
 * Interactive SVG Donut Chart for Distribution Data
 */
function DonutChart({
  title,
  subtitle,
  icon: Icon,
  data = [],
  total = 0,
  centerLabel = "Total",
  centerValue = null,
  emptyMessage = "No distribution data available",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.761

  const validTotal = Number(total) > 0 ? Number(total) : data.reduce((acc, d) => acc + (Number(d.value) || 0), 0);
  const hasData = validTotal > 0 && data.some((d) => (Number(d.value) || 0) > 0);

  // Calculate cumulative offsets
  let accumulatedPercent = 0;
  const slices = data.map((item, idx) => {
    const val = Number(item.value) || 0;
    const percent = validTotal > 0 ? (val / validTotal) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += percent;

    return {
      ...item,
      val,
      percent: percent.toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      index: idx,
    };
  });

  return (
    <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-orange-400" />}
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">{title}</h4>
            {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {validTotal} total
        </span>
      </div>

      {/* Chart Visual */}
      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-4">
          <Info className="w-6 h-6 text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full -rotate-90 transform overflow-visible"
              aria-label={title}
            >
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="11"
              />

              {/* Data Slices */}
              {slices.map((slice) => {
                if (slice.val === 0) return null;
                const isHovered = hoveredIndex === slice.index;
                return (
                  <circle
                    key={slice.label}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 13 : 11}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              {hoveredIndex !== null && slices[hoveredIndex] ? (
                <>
                  <span className="text-base font-black text-white leading-none">
                    {slices[hoveredIndex].val}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[80px]">
                    {slices[hoveredIndex].label}
                  </span>
                  <span className="text-[9px] text-orange-400 font-mono">
                    {slices[hoveredIndex].percent}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base font-black text-white leading-none">
                    {centerValue !== null ? centerValue : validTotal}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                    {centerLabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="space-y-2 w-full max-w-[200px]">
            {slices.map((slice) => {
              const isHovered = hoveredIndex === slice.index;
              return (
                <div
                  key={slice.label}
                  onMouseEnter={() => setHoveredIndex(slice.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isHovered ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-zinc-300 truncate text-[11px] font-medium">
                      {slice.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                    <span className="text-white font-bold">{slice.val}</span>
                    <span className="text-zinc-500 text-[10px]">({slice.percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Interactive Horizontal Bar Comparison Chart
 */
function ComparisonBarChart({ title, subtitle, icon: Icon, items = [], emptyMessage = "No resource metrics available" }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  const validItems = items.filter((it) => typeof it.value === "number");
  const maxValue = Math.max(1, ...validItems.map((it) => it.value));
  const hasData = validItems.length > 0;

  return (
    <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-orange-400" />}
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">{title}</h4>
            {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
          {validItems.length} metrics
        </span>
      </div>

      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-center p-4">
          <Info className="w-6 h-6 text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {validItems.map((item, idx) => {
            const ItemIcon = item.icon;
            const pct = Math.max(8, Math.round((item.value / maxValue) * 100));
            const isHovered = hoveredItem === idx;

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredItem(idx)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isHovered ? "bg-white/[0.08]" : "bg-white/[0.02] hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    {ItemIcon && (
                      <ItemIcon
                        className="w-3.5 h-3.5"
                        style={{ color: item.color || "#f97316" }}
                      />
                    )}
                    <span className="text-zinc-200 font-medium text-[11px]">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 font-mono border border-white/5">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-white font-bold text-xs">{item.value.toLocaleString()}</span>
                    <span className="text-[10px] text-zinc-500">
                      ({Math.round((item.value / maxValue) * 100)}% max)
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: item.color || "#f97316",
                      boxShadow: isHovered ? `0 0 10px ${item.color || "#f97316"}` : "none",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Diagnostics & Telemetry Gauges Component
 */
function DiagnosticsTelemetryCard({ ragHealth, systemReadiness }) {
  const pyRag = ragHealth?.pythonRAG;
  const timingMs = ragHealth?.timingMs;
  const indexedDocs = pyRag?.indexedDocuments;
  const dimension = pyRag?.vectorDatabase?.dimension;
  const dbConnected = systemReadiness?.database === "connected";
  const redisConnected = systemReadiness?.redis === "connected";

  // Latency benchmark (<250ms = Optimal, 250-600ms = Good, >600ms = Degraded)
  const latencyRating =
    typeof timingMs === "number"
      ? timingMs < 250
        ? { text: "Optimal", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" }
        : timingMs < 600
        ? { text: "Normal", color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30" }
        : { text: "High", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30" }
      : { text: "Unknown", color: "text-zinc-500", bg: "bg-white/5", border: "border-white/10" };

  return (
    <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-400" />
          <div>
            <h4 className="text-xs font-bold text-white tracking-tight">RAG Knowledge Base & Latency Telemetry</h4>
            <p className="text-[10px] text-zinc-500">Live Express ➔ Python RAG ➔ Qdrant roundtrip probes</p>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${latencyRating.bg} ${latencyRating.color} ${latencyRating.border}`}>
          {latencyRating.text}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Metric 1: Roundtrip Probe Latency */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Roundtrip Latency
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white font-mono">
              {typeof timingMs === "number" ? timingMs : "—"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">ms</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                typeof timingMs === "number" && timingMs < 300
                  ? "bg-emerald-400"
                  : typeof timingMs === "number" && timingMs < 700
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{
                width: typeof timingMs === "number" ? `${Math.min(100, Math.max(10, (timingMs / 600) * 100))}%` : "0%",
              }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 block">Baseline target: &lt; 250ms</span>
        </div>

        {/* Metric 2: Indexed Documents */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              Indexed Documents
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {typeof indexedDocs === "number" ? indexedDocs.toLocaleString() : indexedDocs || "—"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">docs</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{
                width: typeof indexedDocs === "number" ? `${Math.min(100, Math.max(15, (indexedDocs / 1500) * 100))}%` : "0%",
              }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 block">Qdrant persistent collection</span>
        </div>

        {/* Metric 3: Vector Dimension */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              Dense Embeddings
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white font-mono">
              {dimension || "—"}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">dimensions</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full bg-orange-500" style={{ width: "100%" }} />
          </div>
          <span className="text-[9px] text-zinc-500 block truncate">all-MiniLM-L6-v2 dense vectors</span>
        </div>

        {/* Metric 4: Database & Cache Probes */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              Core Infrastructure
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-bold font-mono ${dbConnected ? "text-emerald-400" : "text-red-400"}`}>
              {dbConnected ? "PostgreSQL OK" : "DB Disconnected"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${dbConnected && redisConnected ? "bg-emerald-400" : "bg-amber-400"}`}
              style={{ width: dbConnected ? "100%" : "30%" }}
            />
          </div>
          <span className="text-[9px] text-zinc-500 block truncate">
            Redis: {redisConnected ? "Connected" : systemReadiness?.redis || "Degraded fallback"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Historical Trends Status Card (Data Integrity Compliant)
 * Strictly does not invent fake chart points when server does not maintain time-series retention.
 */
function HistoricalTrendsNoticeCard({ backendHealth }) {
  const uptime = backendHealth?.uptime;
  const uptimeStr = typeof uptime === "number" ? `${Math.floor(uptime / 60)}m ${uptime % 60}s` : "Unknown";

  return (
    <div className="p-5 rounded-3xl bg-zinc-950 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-400" />
          <h4 className="text-xs font-bold text-white tracking-tight">Historical Performance Telemetry</h4>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
          Real-time Probes Active
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <p className="text-zinc-300 font-medium">
            Time-Series Retention Status: <span className="text-amber-400">Snapshot Logging Inactive</span>
          </p>
          <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xl">
            FlowCTRL reports instantaneous live system probes. Historical multi-day trend logging requires configuring time-series rollups. Line chart graphs will activate once historical snapshot series are persisted.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Gateway Uptime</span>
            <span className="text-xs font-mono font-bold text-white">{uptimeStr}</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Gateway Online" />
        </div>
      </div>
    </div>
  );
}

/**
 * Main Overview Graphs Container
 */
export default function OverviewGraphs({ stats, ragHealth, backendHealth, systemReadiness }) {
  // 1. Role Distribution Data
  const userTotal = stats?.users?.total ?? 0;
  const userRoleData = [
    {
      label: "USER",
      value: stats?.users?.byRole?.USER ?? (userTotal > 0 ? userTotal - (stats?.users?.byRole?.ADMIN || 0) : 0),
      color: "#f97316", // flowCTRL Orange
    },
    {
      label: "ADMIN",
      value: stats?.users?.byRole?.ADMIN ?? 0,
      color: "#f59e0b", // Amber
    },
  ];

  // 2. Account Status Distribution Data
  const activeCount =
    typeof stats?.users?.byStatus?.ACTIVE === "number"
      ? stats.users.byStatus.ACTIVE
      : typeof stats?.users?.active === "number"
      ? stats.users.active
      : userTotal;

  const suspendedCount =
    typeof stats?.users?.byStatus?.SUSPENDED === "number"
      ? stats.users.byStatus.SUSPENDED
      : Math.max(0, userTotal - activeCount);

  const userStatusData = [
    {
      label: "ACTIVE",
      value: activeCount,
      color: "#10b981", // Emerald
    },
    {
      label: "SUSPENDED",
      value: suspendedCount,
      color: "#ef4444", // Red
    },
  ];

  // 3. Platform Ecosystem Comparison Data
  const platformEcosystemItems = [
    {
      label: "Registered Users",
      value: stats?.users?.total ?? 0,
      icon: Users,
      color: "#f97316",
      badge: `${activeCount} Active`,
    },
    {
      label: "Job Listings",
      value: stats?.jobs?.total ?? 0,
      icon: Briefcase,
      color: "#3b82f6",
      badge: `${stats?.jobs?.active ?? 0} Active`,
    },
    {
      label: "Partner Companies",
      value: stats?.companies?.total ?? 0,
      icon: Building2,
      color: "#10b981",
    },
    {
      label: "Community Projects",
      value: stats?.projects?.total ?? 0,
      icon: FolderGit2,
      color: "#8b5cf6",
    },
    {
      label: "Job Applications",
      value: stats?.applications?.total ?? 0,
      icon: FileCheck,
      color: "#ec4899",
    },
    {
      label: "Resumes Analyzed",
      value: stats?.resumes?.total ?? 0,
      icon: FileSpreadsheet,
      color: "#06b6d4",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Distribution Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Distribution by Role */}
        <DonutChart
          title="User Role Distribution"
          subtitle="Breakdown of USER vs ADMIN privileges"
          icon={Users}
          data={userRoleData}
          total={userTotal}
          centerLabel="Users"
          centerValue={userTotal}
          emptyMessage="No user accounts detected"
        />

        {/* User Account Status Distribution */}
        <DonutChart
          title="Account Status Distribution"
          subtitle="Breakdown of ACTIVE vs SUSPENDED access"
          icon={CheckCircle2}
          data={userStatusData}
          total={userTotal}
          centerLabel="Active"
          centerValue={userTotal > 0 ? `${Math.round((activeCount / userTotal) * 100)}%` : "—"}
          emptyMessage="No user account status records"
        />
      </div>

      {/* Platform Resource Comparison Bar Chart */}
      <ComparisonBarChart
        title="Platform Resource & Ecosystem Distribution"
        subtitle="Live server-reported inventory across database entities"
        icon={HardDrive}
        items={platformEcosystemItems}
        emptyMessage="Platform statistics currently unavailable"
      />

      {/* Diagnostics Gauges */}
      <DiagnosticsTelemetryCard
        ragHealth={ragHealth}
        systemReadiness={systemReadiness}
      />

      {/* Historical Telemetry Integrity Notice */}
      <HistoricalTrendsNoticeCard backendHealth={backendHealth} />
    </div>
  );
}

