"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  LogOut,
  Edit3,
  Award,
  Globe,
  Shield,
  Settings,
  Sparkles,
  Zap,
  Check,
  GitBranch,
  Trash2,
  ExternalLink,
  ChevronRight,
  Layers,
  Target,
} from "lucide-react";
import ProfileSkeleton from "../skeletons/ProfileSkeleton";
import PersonalizedRoadmapModal from "../roadmap/PersonalizedRoadmapModal";
import { personalizedRoadmapsClient } from "@/services/personalizedRoadmaps.service";

function Github(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function Linkedin(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 5.8a1.63 1.63 0 0 0-1.63 1.63c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63z" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function ProfileView({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [activeModalRoadmapId, setActiveModalRoadmapId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        throw new Error("Failed to load profile details.");
      }
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err?.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleDeleteRoadmap = async (e, rId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this personalized roadmap?")) return;
    setDeletingId(rId);
    try {
      await personalizedRoadmapsClient.deleteRoadmap(rId);
      await loadProfile();
    } catch (err) {
      alert("Failed to delete roadmap: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const switchModal = (target) => {
    const url = new URL(window.location.href);
    url.searchParams.set("modal", target);
    window.history.replaceState(null, "", url.toString());
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    onClose();
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-red-400">
          {error || "Please sign in to view your profile."}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/10 text-xs font-medium text-zinc-300 hover:bg-white/20 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    );
  }

  const initials = (profile.displayName || profile.name || profile.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const hasAvatar = (profile.avatarUrl || profile.image) && !avatarError;

  return (
    <div className="space-y-5">
      {/* Header Banner & Avatar */}
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {hasAvatar ? (
            <img
              src={profile.avatarUrl || profile.image}
              alt={profile.displayName || profile.name}
              onError={() => setAvatarError(true)}
              className="w-16 h-16 rounded-2xl object-cover border border-primary/30 shadow-lg shadow-primary/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-400/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xl shadow-lg shadow-primary/10">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-zinc-900" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-zinc-100 truncate">
              {profile.displayName || profile.name || "flowCTRL Member"}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary border border-primary/20">
              {profile.role || "USER"}
            </span>
          </div>

          <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-0.5 truncate">
            <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {profile.email}
          </p>

          {profile.headline && (
            <p className="text-xs text-zinc-200 flex items-center gap-1.5 mt-1.5 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {profile.headline}
            </p>
          )}
        </div>
      </div>

      {/* Bio / Summary */}
      {profile.bio && (
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-200 leading-relaxed">
          {profile.bio}
        </div>
      )}

      {/* Meta details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
        {profile.location && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{profile.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Joined {joinedDate}</span>
        </div>
      </div>

      {/* Portfolio & Social Presence */}
      {(profile.websiteUrl ||
        profile.githubUrl ||
        profile.linkedinUrl ||
        profile.twitterUrl) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-primary border border-white/10 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-blue-400 border border-white/10 transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {profile.twitterUrl && (
            <a
              href={profile.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-400 border border-white/10 transition-colors"
            >
              <TwitterIcon className="w-3.5 h-3.5" /> Twitter
            </a>
          )}
        </div>
      )}

      {/* Membership & Subscription Tier Card */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          profile.isPremium
            ? "bg-gradient-to-r from-zinc-950 via-zinc-900 to-orange-950/30 border-orange-500/40 shadow-lg shadow-orange-950/20"
            : "bg-white/5 border-white/10"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                profile.isPremium
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "bg-white/10 text-zinc-300"
              }`}
            >
              {profile.isPremium ? (
                <Sparkles className="w-4 h-4 text-orange-400" />
              ) : (
                <Shield className="w-4 h-4 text-zinc-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>
                  {profile.membership?.planName ||
                    (profile.isPremium ? "flowCTRL Premium" : "Community Explorer (Free)")}
                </span>
                {profile.isPremium ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500 text-black">
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-zinc-400">
                    FREE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {profile.isPremium
                  ? `Active • ${
                      profile.membership?.expiresAt
                        ? `Valid until ${new Date(profile.membership.expiresAt).toLocaleDateString()}`
                        : "Unlimited Access"
                    }`
                  : "Standard community roadmap access"}
              </div>
            </div>
          </div>

          {!profile.isPremium ? (
            <button
              type="button"
              onClick={() => switchModal("upgrade")}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              Upgrade
            </button>
          ) : (
            <div className="text-right shrink-0">
              <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> All Unlocked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Acquired Skills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Verified & Selected Skills
          </h4>
          <span className="text-[11px] text-zinc-400">
            {profile.skills?.length || 0} skills
          </span>
        </div>

        {profile.skills && profile.skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {profile.skills.map((skill) => (
              <div
                key={skill.id || skill.name}
                className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-medium text-zinc-200 truncate">
                    {skill.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    ({skill.category})
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-1.5 h-1.5 rounded-full ${
                        skill.proficiency >= lvl ? "bg-primary" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic py-2">
            No skills highlighted yet. Click Edit Profile to add skills.
          </p>
        )}
      </div>

      {/* My Personalized Roadmaps Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            My Personalized Roadmaps
          </h4>
          <span className="text-[11px] font-mono text-zinc-400">
            {profile.personalizedRoadmaps?.length || 0} roadmaps
          </span>
        </div>

        {profile.personalizedRoadmaps && profile.personalizedRoadmaps.length > 0 ? (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {profile.personalizedRoadmaps.map((rm) => {
              const genDate = rm.createdAt
                ? new Date(rm.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recently";

              return (
                <div
                  key={rm.id}
                  onClick={() => setActiveModalRoadmapId(rm.id)}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer group shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {rm.title}
                        </h5>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
                          RAG
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-1 truncate">
                        <Target className="w-3 h-3 text-orange-400 shrink-0" />
                        <span className="truncate">Goal: {rm.careerGoal || "Software Engineering"}</span>
                      </p>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 mt-2 flex-wrap">
                        <span>Generated: {genDate}</span>
                        <span>•</span>
                        <span>{rm.totalLevels || 0} levels</span>
                        <span>•</span>
                        <span>{rm.totalNodes || 0} nodes</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleDeleteRoadmap(e, rm.id)}
                          title="Delete Roadmap"
                          disabled={deletingId === rm.id}
                          className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {rm.progressPercent || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Completion Progress Bar */}
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2.5">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
                      style={{ width: `${rm.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
            <p className="text-xs text-zinc-400">
              You haven&apos;t generated any personalized roadmaps yet.
            </p>
            <a
              href="/ecosystem"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-amber-300 border border-orange-500/30 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Generate Roadmap via RAG</span>
            </a>
          </div>
        )}
      </div>

      {/* Navigation Quick Actions */}
      <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
        <button
          onClick={() => switchModal("edit-profile")}
          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
          Edit
        </button>

        <button
          onClick={() => switchModal("security")}
          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          Security
        </button>

        <button
          onClick={() => switchModal("settings")}
          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-zinc-400" />
          Settings
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-1 flex justify-end">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer py-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out of flowCTRL
        </button>
      </div>

      {/* Interactive Personalized Roadmap Graph Modal */}
      {activeModalRoadmapId && (
        <PersonalizedRoadmapModal
          roadmapId={activeModalRoadmapId}
          isOpen={Boolean(activeModalRoadmapId)}
          onClose={() => setActiveModalRoadmapId(null)}
          onProgressUpdated={() => loadProfile()}
        />
      )}
    </div>
  );
}
