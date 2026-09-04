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
} from "lucide-react";
import ProfileSkeleton from "../skeletons/ProfileSkeleton";

export default function ProfileView({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
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
    }

    loadProfile();
  }, []);

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

  const initials = (profile.name || profile.email || "U")
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

  return (
    <div className="space-y-6">
      {/* Header Banner & Avatar */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-400/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xl shadow-lg shadow-primary/10">
            {initials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-zinc-900" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-zinc-100 truncate">
              {profile.name || "FlowCTRL Engineer"}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary border border-primary/20">
              {profile.role || "USER"}
            </span>
          </div>

          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5 truncate">
            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            {profile.email}
          </p>

          {profile.headline && (
            <p className="text-xs text-zinc-300 flex items-center gap-1.5 mt-1.5 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {profile.headline}
            </p>
          )}
        </div>
      </div>

      {/* Bio / Summary */}
      {profile.bio && (
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-zinc-300 leading-relaxed">
          {profile.bio}
        </div>
      )}

      {/* Meta details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
        {profile.location && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span className="truncate">{profile.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>Joined {joinedDate}</span>
        </div>
      </div>

      {/* Acquired Skills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Verified & Selected Skills
          </h4>
          <span className="text-[11px] text-zinc-500">
            {profile.skills?.length || 0} skills
          </span>
        </div>

        {profile.skills && profile.skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {profile.skills.map((skill) => (
              <div
                key={skill.id || skill.name}
                className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200 truncate">
                    {skill.name}
                  </span>
                  <span className="text-[10px] text-primary font-bold">
                    Level {skill.proficiency}/5
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-amber-300 h-full rounded-full transition-all"
                    style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-zinc-500">
            No skills added yet. Click &quot;Edit Profile&quot; to configure
            your skill stack.
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>

        <button
          type="button"
          onClick={() => switchModal("edit-profile")}
          className="flex items-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit Profile
        </button>
      </div>
    </div>
  );
}
