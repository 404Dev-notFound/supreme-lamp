"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Database,
  RefreshCw,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  Search,
  Server,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  HardDrive,
  Check,
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { adminService } from "@/services/admin.service";
import OverviewGraphs from "./AdminCharts";

function formatAuditTimestamp(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, status: authStatus } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "rag" | "users" | "audit"

  // Platform & System Health States (Real Backend Data)
  const [stats, setStats] = useState(null);
  const [ragHealth, setRagHealth] = useState(null);
  const [systemReadiness, setSystemReadiness] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [platformAnalyticsLoading, setPlatformAnalyticsLoading] = useState(false);
  const [platformAnalyticsError, setPlatformAnalyticsError] = useState(null);
  const [analyticsEventPage, setAnalyticsEventPage] = useState(1);

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  // Action-specific UI State
  const [actionInProgress, setActionInProgress] = useState({}); // { [userId]: 'role' | 'status' }
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, confirmText, isDanger }

  // RAG Reindex State
  const [adminKey, setAdminKey] = useState("");
  const [reindexLimit, setReindexLimit] = useState("");
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState(null);
  const [reindexError, setReindexError] = useState(null);

  // Search debounce ref & request sequence tracking to prevent stale responses from overwriting newer search results
  const searchTimeoutRef = useRef(null);
  const userRequestIdRef = useRef(0);
  const userAbortControllerRef = useRef(null);

  // -------------------------------------------------------------
  // Data Fetching Functions
  // -------------------------------------------------------------

  const loadHealthAndMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);

    const [statsRes, ragRes, readyRes, healthRes] = await Promise.allSettled([
      adminService.fetchStats(),
      adminService.fetchRagHealth(),
      adminService.fetchSystemReadiness(),
      adminService.fetchBackendHealth(),
    ]);

    let errors = [];

    if (statsRes.status === "fulfilled") {
      setStats(statsRes.value);
    } else {
      errors.push(`Platform stats: ${statsRes.reason?.message || "Unavailable"}`);
    }

    if (ragRes.status === "fulfilled") {
      setRagHealth(ragRes.value);
    } else {
      setRagHealth({ status: "unavailable", error: ragRes.reason?.message || "RAG health check failed" });
      errors.push(`RAG health: ${ragRes.reason?.message || "Unavailable"}`);
    }

    if (readyRes.status === "fulfilled") {
      setSystemReadiness(readyRes.value);
    } else {
      setSystemReadiness({ status: "unavailable", database: "unavailable", redis: "unavailable" });
      errors.push(`Readiness: ${readyRes.reason?.message || "Unavailable"}`);
    }

    if (healthRes.status === "fulfilled") {
      setBackendHealth(healthRes.value);
    } else {
      setBackendHealth({ status: "unavailable" });
      errors.push(`Core health: ${healthRes.reason?.message || "Unavailable"}`);
    }

    if (errors.length > 0 && statsRes.status === "rejected") {
      setMetricsError(errors.join(" | "));
    }

    setMetricsLoading(false);
  }, []);

  const loadPlatformAnalytics = useCallback(async (page = analyticsEventPage) => {
    setPlatformAnalyticsLoading(true);
    setPlatformAnalyticsError(null);
    try {
      setPlatformAnalytics(await adminService.fetchPlatformAnalytics(page));
    } catch (err) {
      setPlatformAnalyticsError(err.message || "Unable to load usage analytics");
    } finally {
      setPlatformAnalyticsLoading(false);
    }
  }, [analyticsEventPage]);

  const loadUsers = useCallback(async (page = 1, search = "", role = "", status = "") => {
    const requestId = ++userRequestIdRef.current;

    // Abort previous in-flight user moderation request if one is still running
    if (userAbortControllerRef.current) {
      userAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    userAbortControllerRef.current = controller;

    setUsersLoading(true);
    setUsersError(null);

    try {
      const data = await adminService.fetchUsers(
        {
          page,
          limit: 15,
          search,
          role,
          status,
        },
        controller.signal
      );

      // Only apply state update if this response corresponds to the latest requested query
      if (requestId === userRequestIdRef.current) {
        setUsersList(data.users);
        setUsersPagination(data.pagination);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        // Silently ignore superseded aborted requests
        return;
      }
      if (requestId === userRequestIdRef.current) {
        console.error("Failed to load users:", err);
        setUsersError(err.message || "Failed to load platform users");
      }
    } finally {
      if (requestId === userRequestIdRef.current) {
        setUsersLoading(false);
      }
    }
  }, []);

  const loadAuditLogs = useCallback(async (page = 1, action = auditActionFilter) => {
    setAuditLoading(true);
    setAuditError(null);

    try {
      const data = await adminService.fetchAuditLogs({
        page,
        limit: 20,
        action,
      });

      setAuditLogs(data.logs);
      setAuditPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setAuditError(err.message || "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter]);

  // Initial load once authenticated as ADMIN
  useEffect(() => {
    if (authStatus === "authenticated" && user?.role === "ADMIN") {
      loadHealthAndMetrics();
      loadUsers(1, "", "", "");
      loadAuditLogs(1);
    }
  }, [authStatus, user?.role, loadHealthAndMetrics, loadUsers, loadAuditLogs]);

  useEffect(() => {
    if (authStatus === "authenticated" && user?.role === "ADMIN" && activeTab === "analytics") {
      loadPlatformAnalytics();
    }
  }, [authStatus, user?.role, activeTab, loadPlatformAnalytics]);

  // Handle Search Input with 350ms Debounce and Request Tracking
  const handleSearchChange = (value) => {
    setUserSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(1, value, userRoleFilter, userStatusFilter);
    }, 350);
  };

  const handleClearSearch = () => {
    setUserSearch("");
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    loadUsers(1, "", userRoleFilter, userStatusFilter);
  };

  const handleRoleFilterChange = (newRole) => {
    setUserRoleFilter(newRole);
    loadUsers(1, userSearch, newRole, userStatusFilter);
  };

  const handleStatusFilterChange = (newStatus) => {
    setUserStatusFilter(newStatus);
    loadUsers(1, userSearch, userRoleFilter, newStatus);
  };

  const handlePageChange = (newPage) => {
    loadUsers(newPage, userSearch, userRoleFilter, userStatusFilter);
  };

  const handleRetryUsers = () => {
    loadUsers(usersPagination.page, userSearch, userRoleFilter, userStatusFilter);
  };

  // -------------------------------------------------------------
  // User Management Actions
  // -------------------------------------------------------------

  const handleRoleToggle = (targetUser) => {
    // Identity verification: cannot modify self
    const isSelf = targetUser.id === user?.id || targetUser.email?.toLowerCase() === user?.email?.toLowerCase();
    if (isSelf) {
      setFeedback({ type: "error", text: "Security policy: Administrators cannot modify their own role." });
      return;
    }

    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    const isDemotion = newRole === "USER";

    setConfirmDialog({
      title: isDemotion ? "Confirm Administrator Demotion" : "Confirm Administrator Promotion",
      message: isDemotion
        ? `Are you sure you want to demote ${targetUser.email} from ADMIN to USER? They will immediately lose access to all administrative APIs and controls.`
        : `Are you sure you want to grant ADMIN privileges to ${targetUser.email}? They will gain full governance access over platform users, security logs, and RAG reindexing.`,
      confirmText: isDemotion ? "Demote to USER" : "Promote to ADMIN",
      isDanger: isDemotion,
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionInProgress((prev) => ({ ...prev, [targetUser.id]: "role" }));
        setFeedback(null);

        try {
          const res = await adminService.updateUserRole(targetUser.id, newRole);
          setFeedback({
            type: "success",
            text: res.message || `Successfully updated ${targetUser.email}'s role to ${newRole}.`,
          });
          // Refresh affected lists
          await Promise.all([
            loadUsers(usersPagination.page, userSearch, userRoleFilter, userStatusFilter),
            loadAuditLogs(1),
            loadHealthAndMetrics(),
          ]);
        } catch (err) {
          setFeedback({ type: "error", text: `Role update failed: ${err.message}` });
        } finally {
          setActionInProgress((prev) => {
            const next = { ...prev };
            delete next[targetUser.id];
            return next;
          });
        }
      },
    });
  };

  const handleStatusToggle = (targetUser) => {
    // Identity verification: cannot suspend self
    const isSelf = targetUser.id === user?.id || targetUser.email?.toLowerCase() === user?.email?.toLowerCase();
    if (isSelf) {
      setFeedback({ type: "error", text: "Security policy: Administrators cannot suspend their own account." });
      return;
    }

    const isCurrentlyActive = targetUser.status === "ACTIVE";
    const newStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE";

    setConfirmDialog({
      title: isCurrentlyActive ? "Confirm Account Suspension" : "Confirm Account Reactivation",
      message: isCurrentlyActive
        ? `Are you sure you want to suspend ${targetUser.email}? Their active sessions will be invalidated and they will be barred from signing in.`
        : `Are you sure you want to reactivate ${targetUser.email}? Their account status will be restored to ACTIVE.`,
      confirmText: isCurrentlyActive ? "Suspend Account" : "Reactivate Account",
      isDanger: isCurrentlyActive,
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionInProgress((prev) => ({ ...prev, [targetUser.id]: "status" }));
        setFeedback(null);

        try {
          const reason = isCurrentlyActive ? "Administrative security review" : "Administrative reactivation";
          const res = await adminService.updateUserStatus(targetUser.id, newStatus, reason);
          setFeedback({
            type: "success",
            text: res.message || `Successfully set ${targetUser.email}'s account status to ${newStatus}.`,
          });
          // Refresh affected lists
          await Promise.all([
            loadUsers(usersPagination.page, userSearch, userRoleFilter, userStatusFilter),
            loadAuditLogs(1),
            loadHealthAndMetrics(),
          ]);
        } catch (err) {
          setFeedback({ type: "error", text: `Status update failed: ${err.message}` });
        } finally {
          setActionInProgress((prev) => {
            const next = { ...prev };
            delete next[targetUser.id];
            return next;
          });
        }
      },
    });
  };

  // -------------------------------------------------------------
  // RAG Reindex Action
  // -------------------------------------------------------------

  const handleTriggerReindex = async (e) => {
    e.preventDefault();
    setReindexing(true);
    setReindexResult(null);
    setReindexError(null);

    try {
      const limitVal = reindexLimit.trim() ? parseInt(reindexLimit.trim(), 10) : null;
      const res = await adminService.triggerRagReindex(adminKey, limitVal);
      setReindexResult(res);
      // Refresh live health
      const h = await adminService.fetchRagHealth();
      setRagHealth(h);
    } catch (err) {
      setReindexError(err.message || "Failed to trigger RAG reindex");
    } finally {
      setReindexing(false);
    }
  };

  // -------------------------------------------------------------
  // Access Guards (Auth & Role Check)
  // -------------------------------------------------------------

  // 1. Loading state
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight text-white">
            flow<span className="text-orange-500">CTRL</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-400 mx-auto" />
            <p className="text-zinc-400 text-sm">Verifying administrative credentials...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Unauthenticated (Guest) state -> 401
  if (authStatus === "unauthenticated" || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight text-white">
            flow<span className="text-orange-500">CTRL</span>
          </Link>
          <NavProfile />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden" id="admin-unauthorized-view">
            <div className="absolute inset-0 bg-red-500/5 backdrop-blur-xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">401 — Authentication Required</h1>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  The FlowCTRL Admin Control Center requires verified identity and server-side authentication.
                  Please sign in with your administrative account to continue.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => router.push("/?modal=signin")}
                  className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer"
                >
                  Sign In with Credentials
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-semibold text-xs hover:bg-white/10 transition-colors"
                >
                  Back to Homepage
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Authenticated as USER (Forbidden) state -> 403
  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight text-white">
            flow<span className="text-orange-500">CTRL</span>
          </Link>
          <NavProfile />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-950 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden" id="admin-forbidden-view">
            <div className="absolute inset-0 bg-amber-500/5 backdrop-blur-xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">403 — Access Denied</h1>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Your signed-in account (<span className="text-zinc-200 font-mono">{user.email}</span>) holds the standard <span className="text-orange-400 font-semibold">USER</span> role.
                  Administrative operations, user governance, and platform telemetry require the <span className="text-amber-400 font-semibold">ADMIN</span> role.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-orange-500 text-white font-semibold text-xs hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
                >
                  Go to Personal Dashboard
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-semibold text-xs hover:bg-white/10 transition-colors flex items-center justify-center"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. Authenticated ADMIN -> Full Control Center
  // -------------------------------------------------------------

  // Real Infrastructure Values
  const expressStatus = backendHealth?.status === "healthy" ? "Online" : backendHealth?.status ? "Degraded" : "Unknown";
  const expressUptimeSec = backendHealth?.uptime;
  const expressUptimeStr = expressUptimeSec !== undefined ? `${Math.floor(expressUptimeSec / 60)}m ${expressUptimeSec % 60}s` : "Unknown";

  const postgresStatus = systemReadiness?.database === "connected" ? "Connected" : systemReadiness?.database === "disconnected" ? "Disconnected" : "Unknown";
  const redisStatus = systemReadiness?.redis === "connected" ? "Connected" : systemReadiness?.redis === "degraded_fallback" ? "Fallback (In-Memory)" : "Unknown";

  const pyRagObj = ragHealth?.pythonRAG;
  const pyRagStatus = pyRagObj?.ready ? "Ready" : pyRagObj?.status === "offline" ? "Offline" : pyRagObj?.status || "Unknown";
  const pyRagIndexedDocs = pyRagObj?.indexedDocuments !== undefined ? pyRagObj.indexedDocuments : "Unknown";
  const pyRagTimestamp = pyRagObj?.timestamp ? new Date(pyRagObj.timestamp).toLocaleTimeString() : "Unknown";

  const qdrantHealthy = pyRagObj?.vectorDatabase?.healthy;
  const qdrantStatus = qdrantHealthy === true ? "Connected" : qdrantHealthy === false ? "Unhealthy" : "Unknown";
  const qdrantCollection = pyRagObj?.vectorDatabase?.collection || "Unknown";
  const qdrantDimension = pyRagObj?.vectorDatabase?.dimension || "Unknown";
  const embeddingModelName = pyRagObj?.embeddingModel?.name || "Unknown";
  const totalPlatformUsers = Number(stats?.users?.total);
  const activePlatformUsers = Number(stats?.users?.active);
  const userCoverage = Number.isFinite(totalPlatformUsers) && totalPlatformUsers > 0 && Number.isFinite(activePlatformUsers)
    ? Math.min(100, Math.max(0, Math.round((activePlatformUsers / totalPlatformUsers) * 100)))
    : null;
  const userAdminEvents = auditLogs
    .filter((log) => log.targetType === "User" || log.action?.startsWith("ADMIN_"))
    .slice(0, 5);
  const usage = platformAnalytics?.usage;
  const dailyUsage = usage?.dailyActivity || [];
  const dailyUsageMax = Math.max(1, ...dailyUsage.map((point) => point.count));
  const dailyUsagePoints = dailyUsage.map((point, index) => {
    const x = dailyUsage.length > 1 ? 24 + (index / (dailyUsage.length - 1)) * 552 : 300;
    const y = 150 - (point.count / dailyUsageMax) * 126;
    return `${x},${y}`;
  }).join(" ");
  const topInteractions = usage?.topInteractions || [];
  const topInteractionMax = Math.max(1, ...topInteractions.map((item) => item.count));
  const eventTypeBreakdown = [...(platformAnalytics?.featureEngagement30d || [])]
    .sort((first, second) => second.count - first.count);
  const eventTypeMax = Math.max(1, ...eventTypeBreakdown.map((item) => item.count));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between" id="admin-dashboard-view">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-black text-xl tracking-tight text-white">
            flow<span className="text-orange-500">CTRL</span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
            Admin Control Center
          </span>
        </div>
        <div className="flex items-center gap-4">
          <NavProfile />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-950 border border-white/10 shadow-xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Platform Administration</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Authenticated Administrator: <span className="text-zinc-200 font-mono font-semibold">{user.email}</span> (Role: <span className="text-orange-400 font-semibold">ADMIN</span>)
            </p>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => {
                loadHealthAndMetrics();
                loadUsers(usersPagination.page);
                loadAuditLogs(auditPagination.page);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? "animate-spin text-orange-400" : ""}`} />
              Refresh All Data
            </button>
          </div>
        </div>

        {/* Global Action Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Diagnostics", icon: Activity },
            { id: "rag", label: "RAG & Knowledge Base", icon: Database },
            { id: "users", label: `User Moderation (${usersPagination.total || stats?.users?.total || 0})`, icon: Users },
            { id: "analytics", label: "Usage Analytics", icon: Activity },
            { id: "audit", label: `Security & Audit Logs (${auditPagination.total || 0})`, icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & REAL SYSTEM DIAGNOSTICS */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {metricsError && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center justify-between">
                <span>Some diagnostic metrics could not be loaded: {metricsError}</span>
                <button onClick={loadHealthAndMetrics} className="underline ml-2 cursor-pointer">Retry</button>
              </div>
            )}

            {/* Real KPI Cards from /api/admin/stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Registered Users</span>
                <p className="text-2xl font-bold text-white">{stats?.users?.total !== undefined ? stats.users.total : "—"}</p>
                <div className="text-[11px] text-zinc-500">
                  {stats?.users?.active !== undefined ? `${stats.users.active} active accounts` : "Database count pending"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active Job Postings</span>
                <p className="text-2xl font-bold text-white">{stats?.jobs?.active !== undefined ? stats.jobs.active : "—"}</p>
                <div className="text-[11px] text-zinc-500">
                  {stats?.jobs?.total !== undefined ? `${stats.jobs.total} total job listings` : "Database count pending"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Community Projects</span>
                <p className="text-2xl font-bold text-white">{stats?.projects?.total !== undefined ? stats.projects.total : "—"}</p>
                <div className="text-[11px] text-zinc-500">
                  {stats?.applications?.total !== undefined ? `${stats.applications.total} job applications tracked` : "Database count pending"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">RAG Retrieval Pipeline</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      ragHealth?.status === "healthy"
                        ? "bg-emerald-400 animate-pulse"
                        : ragHealth?.status === "degraded"
                        ? "bg-amber-400"
                        : "bg-red-500"
                    }`}
                  />
                  <p className="text-xl font-bold capitalize text-white">
                    {ragHealth?.status || "Unavailable"}
                  </p>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Pipeline: <span className="text-zinc-300 font-mono">{ragHealth?.primaryPipeline || "Unknown"}</span>
                </div>
              </div>
            </div>

            {/* Visual Overview & Diagnostic Graphs (Real Server Data) */}
            <OverviewGraphs
              stats={stats}
              ragHealth={ragHealth}
              backendHealth={backendHealth}
              systemReadiness={systemReadiness}
            />

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Infrastructure Status - Actual Probe Data */}
              <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Backend Infrastructure Probes</h3>
                  </div>
                  <span className="text-[11px] text-zinc-500">Live Server Telemetry</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Express API Gateway */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-zinc-300 font-medium block">Express API Gateway</span>
                      <span className="text-[11px] text-zinc-500">Port 5000 • Uptime: {expressUptimeStr}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        expressStatus === "Online"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : expressStatus === "Degraded"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {expressStatus}
                    </span>
                  </div>

                  {/* PostgreSQL Database */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-zinc-300 font-medium block">PostgreSQL Database</span>
                      <span className="text-[11px] text-zinc-500">Port 5432 • Container: flowctrl-postgres-1</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        postgresStatus === "Connected"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {postgresStatus}
                    </span>
                  </div>

                  {/* Redis Distributed Cache */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-zinc-300 font-medium block">Redis Distributed Cache</span>
                      <span className="text-[11px] text-zinc-500">Port 6379 • Container: flowctrl-redis-1</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        redisStatus === "Connected"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : redisStatus.includes("Fallback")
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {redisStatus}
                    </span>
                  </div>

                  {/* Python RAG Microservice */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <span className="text-zinc-300 font-medium block">Python LangChain Microservice</span>
                      <span className="text-[11px] text-zinc-500">
                        Port 8001 • {pyRagObj?.error ? pyRagObj.error : `Probe roundtrip: ${ragHealth?.timingMs || 0}ms`}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        pyRagStatus === "Ready"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {pyRagStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* RAG Diagnostics - Actual Vector DB Parameters */}
              <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white">Qdrant Vector DB & RAG Telemetry</h3>
                  </div>
                  <span className="text-[11px] text-zinc-500">Live Vector Probe</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Vector Store Backend</span>
                    <span className="text-zinc-200 font-mono font-medium flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                      {pyRagObj?.vectorDatabase?.backend || "Unknown"} ({qdrantStatus})
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Indexed Knowledge Documents</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {typeof pyRagIndexedDocs === "number" ? pyRagIndexedDocs.toLocaleString() : pyRagIndexedDocs} docs
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Embedding Model & Dimension</span>
                    <span className="text-zinc-200 font-mono truncate max-w-xs text-right">
                      {embeddingModelName} ({qdrantDimension}-d)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Qdrant Collection Name</span>
                    <span className="text-zinc-200 font-mono">{qdrantCollection}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-zinc-400">Last Verified Vector Probe</span>
                    <span className="text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {pyRagTimestamp}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RAG & KNOWLEDGE BASE MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "rag" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-white/10 space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-400" />
                  Knowledge Base Reindexing Control
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                  Trigger an on-demand re-ingestion and vector indexing pipeline. Documents from the curated knowledge base will be chunked, embedded via MiniLM (384-d), and indexed into persistent Qdrant storage.
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300">
                  Current Index Status: <strong className="text-white font-mono">{pyRagIndexedDocs}</strong> documents indexed in collection <strong className="text-orange-400 font-mono">{qdrantCollection}</strong>.
                </span>
              </div>

              <form onSubmit={handleTriggerReindex} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Document Limit (Optional — for rapid test verification)
                  </label>
                  <input
                    type="number"
                    value={reindexLimit}
                    onChange={(e) => setReindexLimit(e.target.value)}
                    placeholder="Leave empty to index entire corpus (1,300+ docs)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Tip: Enter <code className="text-orange-400">5</code> or <code className="text-orange-400">10</code> for rapid end-to-end verification under 1 second.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Administrative Service Key (Optional override)
                  </label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Leave empty to use authenticated server session"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Express validates your authenticated <span className="text-orange-400 font-semibold">ADMIN</span> session and handles the internal service secret securely.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={reindexing}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? "animate-spin" : ""}`} />
                  {reindexing ? "Reindexing Knowledge Base..." : "Execute Reindex Now"}
                </button>
              </form>

              {/* Reindex Feedback */}
              {reindexError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Reindexing Failed
                  </div>
                  <p className="font-mono">{reindexError}</p>
                </div>
              )}

              {reindexResult && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Knowledge Base Reindexed Successfully
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                    <pre>{JSON.stringify(reindexResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-400">Platform usage</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Interaction analytics</h2>
                <p className="mt-1 text-xs text-zinc-500">Page views, clicks, field changes, and submitted form data</p>
              </div>
              <button
                type="button"
                onClick={loadPlatformAnalytics}
                disabled={platformAnalyticsLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${platformAnalyticsLoading ? "animate-spin" : ""}`} />Refresh
              </button>
            </div>

            {platformAnalyticsError && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                <span>{platformAnalyticsError}</span>
                <button type="button" onClick={loadPlatformAnalytics} className="underline cursor-pointer">Retry</button>
              </div>
            )}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: "Tracked events · 30 days", value: usage?.eventsLast30d },
                { label: "Signed-in events · 30 days", value: usage?.signedInEventsLast30d },
                { label: "Without-signin events · 30 days", value: usage?.guestEventsLast30d },
                { label: "Events stored · all time", value: usage?.totalTrackedEvents },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{platformAnalyticsLoading && metric.value === undefined ? "…" : (metric.value ?? "—").toLocaleString?.("en-IN") ?? metric.value ?? "—"}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5" aria-labelledby="usage-trend-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id="usage-trend-title" className="text-sm font-semibold text-white">Daily event volume</h3>
                    <p className="mt-1 text-[11px] text-zinc-500">Vector chart · last 30 days</p>
                  </div>
                  <span className="text-xs font-mono text-orange-300">{usage?.eventsLast30d?.toLocaleString?.("en-IN") ?? "—"} events</span>
                </div>
                {dailyUsage.length ? (
                  <svg viewBox="0 0 600 180" className="mt-4 h-48 w-full" role="img" aria-label="Daily tracked event volume over the last 30 days">
                    {[24, 66, 108, 150].map((y) => <line key={y} x1="24" x2="576" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />)}
                    <polyline points={dailyUsagePoints} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {dailyUsage.map((point, index) => {
                      const x = dailyUsage.length > 1 ? 24 + (index / (dailyUsage.length - 1)) * 552 : 300;
                      const y = 150 - (point.count / dailyUsageMax) * 126;
                      return <circle key={point.day} cx={x} cy={y} r="3.5" fill="#fb923c"><title>{point.day}: {point.count} events</title></circle>;
                    })}
                    <text x="24" y="174" fill="#71717a" fontSize="10">{dailyUsage[0]?.day}</text>
                    <text x="576" y="174" fill="#71717a" fontSize="10" textAnchor="end">{dailyUsage[dailyUsage.length - 1]?.day}</text>
                  </svg>
                ) : (
                  <p className="py-16 text-center text-xs text-zinc-500">{platformAnalyticsLoading ? "Loading usage data…" : "No tracked events in this period."}</p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5" aria-labelledby="top-interactions-title">
                <h3 id="top-interactions-title" className="text-sm font-semibold text-white">Most-used pages and controls</h3>
                <p className="mt-1 text-[11px] text-zinc-500">Top interaction targets · last 30 days</p>
                <div className="mt-5 space-y-3">
                  {topInteractions.length ? topInteractions.map((item) => (
                    <div key={`${item.entityType}:${item.entityId}`}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
                        <span className="min-w-0 truncate text-zinc-300" title={`${item.entityType} · ${item.entityId}`}>{item.entityType} · {item.entityId}</span>
                        <strong className="shrink-0 font-mono text-white">{item.count.toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(2, (item.count / topInteractionMax) * 100)}%` }} />
                      </div>
                    </div>
                  )) : <p className="py-12 text-center text-xs text-zinc-500">{platformAnalyticsLoading ? "Loading usage data…" : "No interaction totals yet."}</p>}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5" aria-labelledby="event-breakdown-title">
              <h3 id="event-breakdown-title" className="text-sm font-semibold text-white">Event type breakdown</h3>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {eventTypeBreakdown.map((item) => (
                  <div key={item.eventType} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <p className="truncate text-[10px] uppercase tracking-wider text-zinc-500">{item.eventType}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{item.count.toLocaleString("en-IN")}</p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full bg-emerald-500" style={{ width: `${Math.max(3, (item.count / eventTypeMax) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                {!eventTypeBreakdown.length && <p className="col-span-full py-6 text-center text-xs text-zinc-500">{platformAnalyticsLoading ? "Loading event breakdown…" : "No event types recorded yet."}</p>}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950" aria-labelledby="recent-event-ledger-title">
              <div className="border-b border-white/10 p-5">
                <h3 id="recent-event-ledger-title" className="text-sm font-semibold text-white">Recent event ledger</h3>
                <p className="mt-1 text-[11px] text-zinc-500">All stored events, including submitted form fields</p>
              </div>
              <div className="divide-y divide-white/5">
                {(usage?.recentEvents || []).map((event) => (
                  <details key={event.id} className="group px-5 py-3">
                    <summary className="grid cursor-pointer list-none grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
                      <span className="truncate text-xs font-medium text-zinc-200">{event.eventType} · {event.entityType} · {event.entityId}</span>
                      <span className="truncate text-[10px] text-zinc-500">{event.userId ? `User ${event.userId}` : event.visitorId || "without_signin"}</span>
                      <time className="text-[10px] text-zinc-500" dateTime={event.createdAt}>{formatAuditTimestamp(event.createdAt)}</time>
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-400">{JSON.stringify(event.metadata, null, 2) || "No event details"}</pre>
                  </details>
                ))}
                {!usage?.recentEvents?.length && <p className="p-8 text-center text-xs text-zinc-500">{platformAnalyticsLoading ? "Loading event records…" : "No event records available."}</p>}
              </div>
              {(usage?.totalEventPages || 1) > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 p-4 text-xs text-zinc-400">
                  <span>Page <strong className="text-white">{usage.eventPage}</strong> of <strong className="text-white">{usage.totalEventPages}</strong> · {usage.totalTrackedEvents.toLocaleString("en-IN")} events</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={analyticsEventPage <= 1 || platformAnalyticsLoading} onClick={() => setAnalyticsEventPage((page) => page - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40 cursor-pointer">Previous</button>
                    <button type="button" disabled={analyticsEventPage >= usage.totalEventPages || platformAnalyticsLoading} onClick={() => setAnalyticsEventPage((page) => page + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40 cursor-pointer">Next</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: USER MODERATION & ROLE ASSIGNMENT */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Account coverage and recent real admin activity */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)] gap-4">
              <section className="rounded-2xl bg-zinc-950 border border-white/10 p-5 flex flex-col justify-between gap-5" aria-labelledby="user-coverage-title">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-400">Account coverage</p>
                  <h2 id="user-coverage-title" className="mt-1 text-base font-semibold text-white">Active user coverage</h2>
                  <p className="mt-1 text-xs text-zinc-500">Share of registered accounts currently active</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-28 shrink-0" role="img" aria-label={userCoverage === null ? "User coverage data unavailable" : `${userCoverage}% of user accounts are active`}>
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={userCoverage === null ? 2 * Math.PI * 42 : 2 * Math.PI * 42 * (1 - userCoverage / 100)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">{userCoverage === null ? "—" : `${userCoverage}%`}</span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500">active</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="text-zinc-400">Active accounts <strong className="ml-1 text-white">{Number.isFinite(activePlatformUsers) ? activePlatformUsers.toLocaleString("en-IN") : "—"}</strong></div>
                    <div className="text-zinc-400">Registered users <strong className="ml-1 text-white">{Number.isFinite(totalPlatformUsers) ? totalPlatformUsers.toLocaleString("en-IN") : "—"}</strong></div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-zinc-950 border border-white/10 p-5" aria-labelledby="user-automation-ledger-title">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-400">Automation ledger</p>
                    <h2 id="user-automation-ledger-title" className="mt-1 text-base font-semibold text-white">Recent user administration</h2>
                    <p className="mt-1 text-xs text-zinc-500">Latest user-related events from the audit log</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("audit")}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Full ledger <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-4 divide-y divide-white/5">
                  {auditLoading && auditLogs.length === 0 ? (
                    <p className="py-4 text-xs text-zinc-500">Loading audit events…</p>
                  ) : userAdminEvents.length === 0 ? (
                    <p className="py-4 text-xs text-zinc-500">No user administration events recorded yet.</p>
                  ) : userAdminEvents.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-200">{String(log.action || "User event").replaceAll("_", " ")}</p>
                        <p className="mt-1 truncate text-[10px] text-zinc-500">
                          {log.targetType || "User"}{log.targetId ? ` · ${log.targetId}` : ""} · {log.user?.email || log.userId || "System"}
                        </p>
                      </div>
                      <time className="shrink-0 text-[10px] text-zinc-500" dateTime={log.createdAt || undefined}>
                        {formatAuditTimestamp(log.createdAt)}
                      </time>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-white/10">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by name or email (server-side)..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                  {userSearch && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50 cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">All Roles</option>
                    <option value="USER" className="bg-zinc-900">USER</option>
                    <option value="ADMIN" className="bg-zinc-900">ADMIN</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={userStatusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50 cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">All Statuses</option>
                    <option value="ACTIVE" className="bg-zinc-900">ACTIVE</option>
                    <option value="SUSPENDED" className="bg-zinc-900">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {/* Counts Badge */}
              <div className="text-xs text-zinc-400 self-center whitespace-nowrap">
                {userSearch || userRoleFilter || userStatusFilter ? (
                  <span>
                    Matching: <strong className="text-white">{usersPagination.total}</strong> of {stats?.users?.total || usersPagination.total} total
                  </span>
                ) : (
                  <span>
                    Total Users: <strong className="text-white">{usersPagination.total}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Error Banner with Retry */}
            {usersError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
                <span>Error loading users: {usersError}</span>
                <button
                  onClick={handleRetryUsers}
                  className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Users Table Container */}
            <div className="rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">User Identity</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Created Date</th>
                      <th className="px-6 py-3.5 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {/* 1. Loading State Skeleton */}
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skel-u-${i}`} className="animate-pulse">
                          <td className="px-6 py-4">
                            <div className="h-4 w-32 bg-white/10 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-44 bg-white/5 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-14 bg-white/10 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-14 bg-white/10 rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="h-4 w-20 bg-white/5 rounded" />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="h-6 w-24 bg-white/10 rounded ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : usersError ? (
                      /* 2. Error State Inside Table (Do not convert to 0 users empty state!) */
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-red-400 space-y-3">
                          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-white">Failed to load platform users</p>
                            <p className="text-xs text-red-400/90 font-mono">{usersError}</p>
                          </div>
                          <button
                            onClick={handleRetryUsers}
                            className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-semibold border border-red-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry Request
                          </button>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      /* 3. Genuine Empty State (Only when server successfully returned 0 records) */
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 space-y-2">
                          <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                          <p className="text-sm font-medium text-zinc-400">
                            {userSearch || userRoleFilter || userStatusFilter
                              ? "No user records found matching the active search or filters."
                              : "No platform users found."}
                          </p>
                          {(userSearch || userRoleFilter || userStatusFilter) && (
                            <button
                              onClick={() => {
                                setUserSearch("");
                                setUserRoleFilter("");
                                setUserStatusFilter("");
                                loadUsers(1, "", "", "");
                              }}
                              className="text-xs text-orange-400 hover:underline cursor-pointer"
                            >
                              Reset search and filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      /* 4. Real Users List */
                      usersList.map((u) => {
                        const isSelf = u.id === user?.id || u.email?.toLowerCase() === user?.email?.toLowerCase();
                        const isBusy = actionInProgress[u.id];

                        return (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-orange-400">
                                {(u.name || u.email || "U")[0].toUpperCase()}
                              </div>
                              <span className="truncate max-w-[150px]">{u.name || u.profile?.displayName || "—"}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-[11px] text-zinc-400">{u.email}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === "ADMIN"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                    : "bg-white/5 text-zinc-400 border border-white/10"
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  u.status === "ACTIVE"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isSelf ? (
                                <span className="text-[11px] text-zinc-500 italic">Self-modification locked</span>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  {/* Role Toggle Button */}
                                  <button
                                    onClick={() => handleRoleToggle(u)}
                                    disabled={Boolean(isBusy)}
                                    title={u.role === "ADMIN" ? "Demote administrator to regular USER" : "Promote user to ADMIN"}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                                      u.role === "ADMIN"
                                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                        : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"
                                    }`}
                                  >
                                    {isBusy === "role" ? (
                                      <RefreshCw className="w-3 h-3 animate-spin inline" />
                                    ) : u.role === "ADMIN" ? (
                                      "Demote to USER"
                                    ) : (
                                      "Make ADMIN"
                                    )}
                                  </button>

                                  {/* Account Status Toggle Button */}
                                  <button
                                    onClick={() => handleStatusToggle(u)}
                                    disabled={Boolean(isBusy)}
                                    title={u.status === "ACTIVE" ? "Suspend user account" : "Reactivate suspended account"}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40 ${
                                      u.status === "ACTIVE"
                                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    }`}
                                  >
                                    {isBusy === "status" ? (
                                      <RefreshCw className="w-3 h-3 animate-spin inline" />
                                    ) : u.status === "ACTIVE" ? (
                                      "Suspend"
                                    ) : (
                                      "Reactivate"
                                    )}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {usersPagination.totalPages > 1 && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Page <strong className="text-white">{usersPagination.page}</strong> of <strong className="text-white">{usersPagination.totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(usersPagination.page - 1)}
                      disabled={usersPagination.page <= 1 || usersLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(usersPagination.page + 1)}
                      disabled={usersPagination.page >= usersPagination.totalPages || usersLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 flex items-center gap-1 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SECURITY & IMMUTABLE AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            {/* Filter and Overview Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950 border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Platform Security & Audit Trail
                </span>
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    loadAuditLogs(1, e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/50 cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">All Security Actions</option>
                  <option value="ADMIN_ROLE_UPDATED" className="bg-zinc-900">ADMIN_ROLE_UPDATED</option>
                  <option value="ADMIN_USER_STATUS_UPDATED" className="bg-zinc-900">ADMIN_USER_STATUS_UPDATED</option>
                  <option value="COMPANY_CREATED" className="bg-zinc-900">COMPANY_CREATED</option>
                  <option value="JOB_CREATED" className="bg-zinc-900">JOB_CREATED</option>
                  <option value="JOB_UPDATED" className="bg-zinc-900">JOB_UPDATED</option>
                  <option value="SIGN_IN" className="bg-zinc-900">SIGN_IN</option>
                </select>
              </div>

              <div className="text-xs text-zinc-400">
                Total Audit Records: <strong className="text-white">{auditPagination.total}</strong>
              </div>
            </div>

            {/* Error Banner with Retry */}
            {auditError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
                <span>Error loading audit records: {auditError}</span>
                <button
                  onClick={() => loadAuditLogs(auditPagination.page)}
                  className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="rounded-3xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 border-b border-white/10 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Event Action</th>
                      <th className="px-6 py-3.5">Target Entity</th>
                      <th className="px-6 py-3.5">Acting User / IP</th>
                      <th className="px-6 py-3.5">Security Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {/* Loading Skeleton */}
                    {auditLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skel-a-${i}`} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-4 w-32 bg-white/10 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-28 bg-white/5 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-24 bg-white/5 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-36 bg-white/10 rounded" /></td>
                          <td className="px-6 py-4"><div className="h-4 w-44 bg-white/5 rounded" /></td>
                        </tr>
                      ))
                    ) : auditLogs.length === 0 ? (
                      /* Empty State */
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 space-y-2">
                          <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                          <p className="text-sm font-medium text-zinc-400">
                            {auditActionFilter
                              ? `No audit logs matching action "${auditActionFilter}".`
                              : "No audit records found in database."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      /* Real Audit Logs */
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 font-mono font-semibold text-white">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-[11px]">
                            {log.targetType ? `${log.targetType}:${log.targetId || ""}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-zinc-300">
                            <div className="font-mono text-[11px]">{log.user?.email || log.userId || "System"}</div>
                            {log.ipAddress && (
                              <div className="text-[10px] text-zinc-500 font-mono">{log.ipAddress}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-zinc-400 max-w-sm truncate">
                            {log.details ? JSON.stringify(log.details) : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Audit Pagination */}
              {auditPagination.totalPages > 1 && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Page <strong className="text-white">{auditPagination.page}</strong> of <strong className="text-white">{auditPagination.totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadAuditLogs(auditPagination.page - 1)}
                      disabled={auditPagination.page <= 1 || auditLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </button>
                    <button
                      onClick={() => loadAuditLogs(auditPagination.page + 1)}
                      disabled={auditPagination.page >= auditPagination.totalPages || auditLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 flex items-center gap-1 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmDialog.isDanger ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-zinc-400">Confirmation required for sensitive action</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer shadow-lg ${
                  confirmDialog.isDanger
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                    : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
