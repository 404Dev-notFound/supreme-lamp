"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Eye,
  Sun,
  Moon,
  Monitor,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function SettingsModal({ onClose }) {
  const [theme, setTheme] = useState("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState("PUBLIC");
  const [careerGoalVisibility, setCareerGoalVisibility] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setTheme(data.theme || "dark");
          setEmailNotifications(data.emailNotifications ?? true);
          setWeeklyDigest(data.weeklyDigest ?? true);
          setJobAlerts(data.jobAlerts ?? true);
          setProfileVisibility(data.profileVisibility || "PUBLIC");
          setCareerGoalVisibility(data.careerGoalVisibility ?? true);
        }
      } catch (err) {
        setError("Failed to load user preferences.");
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          emailNotifications,
          weeklyDigest,
          jobAlerts,
          profileVisibility,
          careerGoalVisibility,
        }),
      });

      if (!res.ok) throw new Error("Failed to update preferences.");

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-zinc-200">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      {/* Section 1: Appearance & Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Appearance & Interface Theme
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: "dark", label: "Dark (Default)", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "system", label: "System Auto", icon: Monitor },
          ].map((item) => {
            const IconComp = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTheme(item.id)}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/10 border-white/30 text-white shadow-lg shadow-white/5"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Notifications */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Notification Settings
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div>
              <p className="font-semibold text-zinc-200">Email Notifications</p>
              <p className="text-[11px] text-zinc-400">Receive important career and roadmap updates</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div>
              <p className="font-semibold text-zinc-200">Weekly Skill Progress Digest</p>
              <p className="text-[11px] text-zinc-400">Summary of weekly milestones and roadmap progress</p>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div>
              <p className="font-semibold text-zinc-200">Job Match Alerts</p>
              <p className="text-[11px] text-zinc-400">Notified when high-affinity job matches appear</p>
            </div>
            <input
              type="checkbox"
              checked={jobAlerts}
              onChange={(e) => setJobAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Section 3: Privacy & Data Visibility */}
      <div className="pt-3 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Privacy & Profile Visibility
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
              Public Profile Status
            </label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="PUBLIC">Public — Visible to developers and employers</option>
              <option value="RECRUITERS_ONLY">Recruiters Only — Hidden from search engines</option>
              <option value="PRIVATE">Private — Visible only to you</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
            <div>
              <p className="font-semibold text-zinc-200">Display Career Goals on Public Profile</p>
              <p className="text-[11px] text-zinc-400">Show your target role and active roadmap completion %</p>
            </div>
            <input
              type="checkbox"
              checked={careerGoalVisibility}
              onChange={(e) => setCareerGoalVisibility(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 text-primary focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Preferences
        </button>
      </div>
    </form>
  );
}
