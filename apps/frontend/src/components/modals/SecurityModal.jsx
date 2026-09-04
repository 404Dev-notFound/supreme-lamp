"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";

export default function SecurityModal({ onClose }) {
  const [sessions, setSessions] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Revoke loading
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/user/security/sessions");
      if (!res.ok) throw new Error("Failed to load active sessions.");
      const data = await res.json();
      setSessions(data.sessions || []);
      setSecurityLogs(data.securityLogs || []);
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    try {
      setRevokingId(sessionId);
      const res = await fetch(`/api/user/security/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revoke session.");
      }
      // Refresh session list
      await fetchSessions();
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to sign out all other devices?")) return;
    try {
      setRevokingAll(true);
      const res = await fetch("/api/user/security/sessions/revoke-all", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to revoke all sessions.");
      await fetchSessions();
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setRevokingAll(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch("/api/user/security/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordSuccess(data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await fetchSessions();
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const getDeviceIcon = (deviceType) => {
    const lower = (deviceType || "").toLowerCase();
    if (lower.includes("mobile")) return <Smartphone className="w-4 h-4 text-orange-400" />;
    if (lower.includes("tablet")) return <Tablet className="w-4 h-4 text-purple-400" />;
    if (lower.includes("desktop")) return <Laptop className="w-4 h-4 text-blue-400" />;
    return <Globe className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-primary/10 to-amber-500/10 border border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-100">Account Security Center</h4>
          <p className="text-xs text-zinc-400">
            Monitor active device sessions, rotate your credentials, and review security audit logs.
          </p>
        </div>
      </div>

      {/* Section 1: Active Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Sessions & Devices
            </h3>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {revokingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LogOut className="w-3 h-3" />
              )}
              Sign Out Everywhere
            </button>
          )}
        </div>

        {sessionError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sessionError}</span>
          </div>
        )}

        {loadingSessions ? (
          <div className="space-y-2">
            <div className="h-14 bg-white/5 rounded-xl animate-pulse border border-white/5" />
            <div className="h-14 bg-white/5 rounded-xl animate-pulse border border-white/5" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">No active sessions tracked.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                    {getDeviceIcon(sess.deviceType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {sess.browser} on {sess.os}
                      </p>
                      {sess.isCurrent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      IP: {sess.maskedIp} · Active {new Date(sess.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.id)}
                    disabled={revokingId === sess.id}
                    title="Revoke session"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
                  >
                    {revokingId === sess.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Change Password Form */}
      <div className="pt-2 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Change Password
          </h3>
        </div>

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                New Password (min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="New password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Confirm password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Recent Security Activity */}
      {securityLogs.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Recent Security Events
            </h4>
          </div>
          <div className="space-y-1.5 text-[11px] text-zinc-400">
            {securityLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white/5"
              >
                <span className="font-mono text-zinc-300">
                  {log.eventType.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="text-zinc-500">
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} · {log.maskedIp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
