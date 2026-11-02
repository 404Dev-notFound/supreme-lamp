"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Compass, Search, Sparkles, ArrowLeft, Lock } from "lucide-react";
import DevRoadmapCard from "../../components/roadmap/DevRoadmapCard";
import PremiumAccessPopup from "../../components/roadmap/PremiumAccessPopup";
import UpgradeMembershipModal from "../../components/modals/UpgradeMembershipModal";
import ResumeScreenerModal from "../../components/modals/ResumeScreenerModal";
import NavProfile from "../../components/NavProfile";
import Footer from "../../components/Footer";
import { getAllRoadmaps } from "@flowctrl/roadmap-data";
import { membershipService } from "../../services/membership.service";
import { useAuth } from "@/hooks/useAuth";

export default function RoadmapsCatalogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Locked popup state
  const [lockedPopup, setLockedPopup] = useState({
    isOpen: false,
    target: null,
    anchorRect: null,
  });

  // Membership state
  const [isPremiumMember, setIsPremiumMember] = useState(false);
  const [membershipLoaded, setMembershipLoaded] = useState(false);

  // Dynamic roadmaps loaded from backend (with static fallback)
  const [roadmapsList, setRoadmapsList] = useState(() => {
    return getAllRoadmaps().map((r) => ({
      ...r,
      accessLevel: "FREE",
      isPremium: false,
      isLocked: false,
    }));
  });

  // Fetch verified membership status
  useEffect(() => {
    let isMounted = true;
    membershipService.fetchMyStatus().then((res) => {
      if (isMounted) {
        setIsPremiumMember(Boolean(res.isPremium));
        setMembershipLoaded(true);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // Fetch full roadmaps catalog from backend API (includes DB premium tracks)
  useEffect(() => {
    let isMounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${apiUrl}/api/roadmaps`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.data && Array.isArray(data.data)) {
          setRoadmapsList(data.data);
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic roadmaps catalog:", err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [isPremiumMember]);

  // Adjust locked status according to current user membership
  const processedRoadmaps = useMemo(() => {
    return roadmapsList.map((r) => {
      const isPremiumTrack =
        r.isPremium || r.accessLevel === "PREMIUM" || r.badge === "PREMIUM";
      const isLocked = isPremiumTrack && !isPremiumMember;
      return {
        ...r,
        isPremium: isPremiumTrack,
        isLocked,
      };
    });
  }, [roadmapsList, isPremiumMember]);

  const filteredRoadmaps = useMemo(() => {
    return processedRoadmaps.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.slug.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "premium" && r.isPremium) ||
        (selectedCategory === "role" && r.category === "role") ||
        (selectedCategory === "skill" && r.category === "skill") ||
        (selectedCategory === "ai" &&
          (r.slug.includes("ai") ||
            r.slug.includes("prompt") ||
            r.slug.includes("machine-learning") ||
            r.categorySlug === "ai-intelligence")) ||
        (selectedCategory === "devops" &&
          (r.slug.includes("devops") ||
            r.slug.includes("docker") ||
            r.slug.includes("kubernetes") ||
            r.slug.includes("aws") ||
            r.slug.includes("terraform") ||
            r.categorySlug === "devops-cloud"));

      return matchesSearch && matchesCategory;
    });
  }, [processedRoadmaps, searchQuery, selectedCategory]);

  const categories = [
    { id: "all", label: `All Tracks (${processedRoadmaps.length})` },
    {
      id: "premium",
      label: "★ Premium Tracks",
      isHighlight: true,
    },
    { id: "role", label: "Career Roles" },
    { id: "ai", label: "AI & Intelligence" },
    { id: "skill", label: "Skills & Frameworks" },
    { id: "devops", label: "DevOps & Cloud" },
  ];

  const handleLockedClick = (roadmap, rect) => {
    setLockedPopup({
      isOpen: true,
      target: roadmap,
      anchorRect: rect,
    });
  };

  const handleOpenAuth = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("modal", "signin");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleOpenUpgrade = () => {
    setUpgradeModalOpen(true);
  };

  const handleUpgradeSuccess = () => {
    setIsPremiumMember(true);
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 pb-24">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to Home"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">
                fC
              </span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              flowCTRL{" "}
              <span className="text-orange-400 font-normal">/ Roadmaps</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setResumeScreenerOpen(true)}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden sm:inline cursor-pointer"
          >
            Resume Screener
          </button>
          <NavProfile />
        </div>
      </nav>

      {/* Hero Header */}
      <section className="relative pt-36 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-amber-200 text-xs font-bold mb-6 glass">
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          Structured Career Roadmaps & Learning Guides
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 max-w-3xl leading-tight">
          Master the skills you need. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            Step by step, concept by concept.
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-300 max-w-2xl mb-10 leading-relaxed font-normal">
          Explore interactive curriculum graphs, handpicked community resources,
          and track your progression across modern software engineering and AI
          tracks.
        </p>

        {/* Search & Filter Bar */}
        <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-300 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, framework, skill or keyword (e.g. AI, React, Docker)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900/80 border border-white/15 text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/60 text-sm shadow-xl backdrop-blur-md"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            let pillClasses = "";

            if (cat.isHighlight) {
              pillClasses = isSelected
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold border-orange-400 shadow-md shadow-orange-500/20"
                : "bg-orange-500/15 border-orange-500/40 text-amber-300 hover:bg-orange-500/25";
            } else {
              pillClasses = isSelected
                ? "bg-orange-500/25 text-amber-200 border border-orange-500/40 shadow-md shadow-orange-500/10 font-semibold"
                : "bg-zinc-900/70 border border-white/15 text-zinc-300 hover:text-white hover:border-orange-500/40 hover:bg-zinc-800/80";
            }

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${pillClasses}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Roadmaps Grid */}
      <section className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Available Learning Paths ({filteredRoadmaps.length})
          </h2>
        </div>

        {filteredRoadmaps.length === 0 ? (
          <div className="text-center py-20 glass-card border border-white/10">
            <Compass className="w-12 h-12 text-orange-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-1">
              No matching roadmaps found
            </h3>
            <p className="text-sm text-zinc-300 max-w-sm mx-auto">
              Try searching with different keywords like &quot;Frontend&quot;,
              &quot;AI&quot;, or &quot;Architecture&quot;.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoadmaps.map((roadmap) => (
              <DevRoadmapCard
                key={roadmap.slug}
                roadmap={roadmap}
                onLockedClick={handleLockedClick}
              />
            ))}
          </div>
        )}
      </section>

      <Footer />

      {/* Contextual Premium Side Popup */}
      <PremiumAccessPopup
        isOpen={lockedPopup.isOpen}
        onClose={() => setLockedPopup({ isOpen: false, target: null, anchorRect: null })}
        targetResource={lockedPopup.target}
        anchorRect={lockedPopup.anchorRect}
        isAuthenticated={Boolean(authUser)}
        onOpenAuth={handleOpenAuth}
        onOpenUpgrade={handleOpenUpgrade}
      />

      {/* Upgrade Membership Modal */}
      <UpgradeMembershipModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={handleUpgradeSuccess}
      />

      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
    </div>
  );
}
