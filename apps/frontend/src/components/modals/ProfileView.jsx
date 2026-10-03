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
} from "lucide-react";
import ProfileSkeleton from "../skeletons/ProfileSkeleton";

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
              {profile.displayName || profile.name || "FlowCTRL Engineer"}
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
    </div>
  );
}
