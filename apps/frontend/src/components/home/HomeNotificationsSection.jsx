"use client";

import React, { useState, useEffect } from "react";
import { announcementsService } from "@/services/announcements.service";
import Link from "next/link";
import {
  Bell,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Flame,
  Trophy,
  Users,
  Briefcase,
  Compass,
  Code2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function HomeNotificationsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;

    announcementsService
      .fetchAnnouncements({
        category: "all",
        onBackgroundUpdate: (freshData) => {
          if (isMounted && Array.isArray(freshData)) {
            setAnnouncements(freshData);
          }
        },
      })
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setAnnouncements(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load announcements from cache/backend:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "INTERVIEW":
        return Flame;
      case "HACKATHON":
        return Trophy;
      case "COMMUNITY":
        return Users;
      case "CAREER":
        return Briefcase;
      case "ECOSYSTEM_UPDATE":
        return Code2;
      case "PLATFORM":
      default:
        return Bell;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/15 border-red-500/30 text-red-300";
      case "HIGH":
        return "bg-orange-500/15 border-orange-500/30 text-orange-300";
      case "NORMAL":
      default:
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
    }
  };

  const featuredInterview = announcements.find(
    (a) => a.category === "INTERVIEW" || a.isFeatured
  );

  const filteredItems = announcements.filter((a) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "interview") return a.category === "INTERVIEW";
    if (selectedFilter === "hackathon") return a.category === "HACKATHON";
    if (selectedFilter === "community") return a.category === "COMMUNITY";
    if (selectedFilter === "career") return a.category === "CAREER";
    if (selectedFilter === "updates")
      return a.category === "PLATFORM" || a.category === "ECOSYSTEM_UPDATE";
    return true;
  });

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto w-full">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/5 blur-[120px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4 glass">
          <Bell className="w-3.5 h-3.5 text-orange-400" />
          Community &amp; Opportunity Updates
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
          Updates, Opportunities &amp; Events
        </h2>
        <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
          Stay up to date with upcoming technical interview sessions, student hackathons, community meetups, and newly released learning tracks.
        </p>
      </div>

      {/* 1. Prominent Upcoming Interview Highlight */}
      {featuredInterview && (
        <div className="mb-12 p-8 md:p-10 rounded-3xl glass-card border-2 border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-zinc-950/80 to-zinc-950/90 relative overflow-hidden shadow-2xl shadow-orange-500/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/15 rounded-full blur-[90px] pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-300 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  {featuredInterview.badge || "Upcoming Interview"}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-zinc-300">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  {formatDateTime(featuredInterview.dateTime)}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {featuredInterview.status}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {featuredInterview.title}
              </h3>

              <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                {featuredInterview.description}
              </p>
            </div>

            {/* CTA Button */}
            {featuredInterview.actionUrl && (
              <div className="shrink-0">
                <Link
                  href={featuredInterview.actionUrl}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-bold text-sm transition-all shadow-xl shadow-orange-500/25 hover:scale-[1.02]"
                >
                  <Compass className="w-4 h-4 fill-black" />
                  {featuredInterview.actionLabel || "Review Blueprint"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {[
          { id: "all", label: `All Notices (${announcements.length})` },
          { id: "interview", label: "Interviews" },
          { id: "hackathon", label: "Hackathons" },
          { id: "community", label: "Community Guild" },
          { id: "career", label: "Career & Internships" },
          { id: "updates", label: "Ecosystem Updates" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFilter === tab.id
                ? "bg-white text-black shadow-md shadow-white/10"
                : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Announcements Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-3xl bg-white/5 border border-white/5"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-card border border-white/10 text-zinc-400 text-sm">
          No announcements found for this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const Icon = getCategoryIcon(item.category);
            const isExternal = item.actionUrl?.startsWith("http");

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between p-6 rounded-3xl glass-card border border-white/10 bg-zinc-950/60 hover:border-orange-500/40 hover:bg-zinc-950/80 transition-all duration-300 shadow-lg relative overflow-hidden"
              >
                <div>
                  {/* Card Header: Category & Priority */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-zinc-300">
                      <Icon className="w-3.5 h-3.5 text-orange-400" />
                      {item.badge || item.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityBadgeClass(
                        item.priority
                      )}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-zinc-100 group-hover:text-orange-300 transition-colors mb-2 leading-snug">
                    {item.title}
                  </h4>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4 font-normal">
                    {item.description}
                  </p>
                </div>

                <div>
                  {/* Timestamp & Status */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-white/5 mb-3 font-mono">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {formatDateTime(item.dateTime)}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold ${
                        item.status === "LIVE"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Action Link / Button */}
                  {item.actionUrl && (
                    isExternal ? (
                      <a
                        href={item.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-orange-500/10 text-zinc-300 hover:text-orange-300 border border-white/10 hover:border-orange-500/30 text-xs font-semibold transition-all"
                      >
                        <span>{item.actionLabel || "Learn More"}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <Link
                        href={item.actionUrl}
                        className="inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-orange-500/10 text-zinc-300 hover:text-orange-300 border border-white/10 hover:border-orange-500/30 text-xs font-semibold transition-all"
                      >
                        <span>{item.actionLabel || "Learn More"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

