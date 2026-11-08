"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart,
  Compass,
  Hammer,
  Cpu,
  Users,
  Code,
  BookOpen,
  Target,
  FileText,
  FileCheck,
  BrainCircuit,
  HeartPulse,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import ResumeScreenerModal from "../components/modals/ResumeScreenerModal";
import MentalHealthScoreModal from "../components/modals/MentalHealthScoreModal";
import NavProfile from "../components/NavProfile";
import CompanyMarquee from "../components/CompanyMarquee";
import DevRoadmapButton from "../components/roadmap/DevRoadmapButton";
import HomeNotificationsSection from "../components/home/HomeNotificationsSection";
import Footer from "../components/Footer";

export default function LandingPage() {
  const [isResumeScreenerOpen, setResumeScreenerOpen] = useState(false);
  const [isMentalHealthScoreOpen, setMentalHealthScoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const { data: nextSession } = useSession();
  const currentUser = authUser || nextSession?.user;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ordered navigation items
  const navItems = [
    {
      name: "Roadmaps",
      href: "/roadmaps",
      icon: Compass,
      iconColor: "text-orange-400",
      iconHoverAnim: "group-hover:rotate-12",
    },
    {
      name: "DSA",
      href: "/dsa",
      icon: Code,
      iconColor: "text-emerald-400",
      iconHoverAnim: "group-hover:scale-110",
    },
    {
      name: "Tutorials",
      href: "/project-tutorials",
      icon: Hammer,
      iconColor: "text-amber-400",
      iconHoverAnim: "group-hover:-rotate-12",
    },
    {
      name: "Resources",
      href: "/resources",
      icon: FileText,
      iconColor: "text-blue-400",
      iconHoverAnim: "group-hover:-translate-y-0.5",
    },
    {
      name: "AI Assistant",
      href: "/assistant",
      icon: BrainCircuit,
      iconColor: "text-pink-400",
      iconHoverAnim: "group-hover:scale-110",
    },
    {
      name: "Ecosystem",
      href: "/ecosystem",
      icon: Cpu,
      iconColor: "text-cyan-400",
      iconHoverAnim: "group-hover:rotate-45",
    },
  ];

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/85 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/40 py-3 px-6"
            : "glass border-b border-white/10 py-4 px-6"
        }`}
      >
        <div className="w-full grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Logo */}
          <div className="flex items-center justify-start">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-85 transition-opacity group select-none"
              aria-label="flowCTRL Home"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <span className="font-bold text-primary-foreground tracking-tighter">
                  fC
                </span>
              </div>
              <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
            </Link>
          </div>

          {/* Center: Navigation Links (Mathematically Centered horizontally via 1fr-auto-1fr grid) */}
          <div className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium text-zinc-300">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative px-2.5 xl:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ease-out hover:text-white hover:bg-white/[0.04] ${
                    isActive ? "text-orange-400 font-semibold" : "text-zinc-300"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${item.iconColor} transition-transform duration-200 ease-out ${item.iconHoverAnim}`}
                  />
                  <span>{item.name}</span>

                  {/* Active indicator or subtle orange accent glow/underline on hover */}
                  {isActive ? (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  ) : (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-orange-400/0 via-orange-400 to-amber-400/0 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-200 origin-center shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                  )}
                </Link>
              );
            })}

            {/* 7. Mental Health */}
            <button
              type="button"
              onClick={() => setMentalHealthScoreOpen(true)}
              className="group relative px-2.5 xl:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ease-out hover:text-white hover:bg-white/[0.04] text-zinc-300 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-rose-400 transition-transform duration-200 ease-out group-hover:scale-110" />
              <span>Mental Health</span>
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-orange-400/0 via-orange-400 to-amber-400/0 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-200 origin-center shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
            </button>

            {/* 8. Resume */}
            <button
              type="button"
              onClick={() => setResumeScreenerOpen(true)}
              className="group relative px-2.5 xl:px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 ease-out hover:text-white hover:bg-white/[0.04] text-zinc-300 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-400 transition-transform duration-200 ease-out group-hover:scale-110" />
              <span>Resume</span>
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gradient-to-r from-orange-400/0 via-orange-400 to-amber-400/0 opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-200 origin-center shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
            </button>
          </div>

          {/* Right: Profile & Mobile Menu Toggle */}
          <div className="flex items-center justify-end gap-2.5">
            <NavProfile />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive ? "text-orange-400 bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setMentalHealthScoreOpen(true);
              }}
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 text-left"
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Mental Health</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setResumeScreenerOpen(true);
              }}
              className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 text-left"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Resume</span>
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 glass">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          From Confusion to Clarity • From Learning to Building
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl leading-[1.1]">
          Your Career. Your Roadmap. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            Your Next Move.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 max-w-3xl mb-10 leading-relaxed font-normal">
          Learning to build a career in technology can feel overwhelming. There are countless tutorials, programming languages, and roadmaps — but knowing what to learn next is often the hardest part. flowCTRL brings everything together: structured learning paths, DSA practice, hands-on project tutorials, curated resources, and personal progress tracking — all in one place.
        </p>

        {/* Hero CTA Button Cluster: Primary actions kept active, shortcuts temporarily commented out */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <DevRoadmapButton size="md" variant="glow" />
          {currentUser ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-all text-sm shadow-sm"
              aria-label="Navigate to your Dashboard"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="?modal=signup"
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-zinc-200 transition-all text-sm shadow-sm"
              aria-label="Start your journey"
            >
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Temporarily commented out existing hero shortcuts per user request */}
          {/* <Link
            href="/project-tutorials"
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <Hammer className="w-4 h-4 text-orange-400" />
            Project Tutorials
          </Link> */}
          {/* <button
            type="button"
            onClick={() => setResumeScreenerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Resume Review
          </button> */}
          {/* <button
            type="button"
            onClick={() => setMentalHealthScoreOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            Wellbeing Check-In
          </button> */}
        </div>
      </section>

      {/* Core Features */}
      <section
        id="features"
        className="py-24 px-6 border-t border-white/10 relative"
      >
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white shadow-sm">
              Everything you need to plan, learn, and build.
            </h2>
            <p className="text-zinc-300 text-lg max-w-2xl">
              Stop guessing what to learn next. Follow structured learning paths, practice consistently, build real software, and keep making steady progress.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1: Structured Learning Paths */}
            <Link
              href="/roadmaps"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-orange-500/20 hover:border-orange-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-orange-500/20">
                <Compass className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-amber-300">
                  Career Roadmaps
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  101 Tracks
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Know what to learn next. Follow structured paths from fundamental programming concepts to production-grade system architectures.
              </p>
              <span className="text-xs font-semibold text-orange-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Roadmaps <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 2: Problem-Solving & DSA */}
            <Link
              href="/dsa"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-500/20">
                <Code className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-emerald-300">
                  Problem-Solving &amp; DSA
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  24 Languages
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Build stronger problem-solving skills, practice coding patterns, and prepare for technical interviews one problem at a time.
              </p>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Start Practicing <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 3: Project-Building Tutorials */}
            <Link
              href="/project-tutorials"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-amber-500/20 hover:border-amber-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-amber-500/20">
                <Hammer className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-amber-300">
                  Project Tutorials
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  1,274 Guides
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Go beyond watching tutorials. Build real software — including databases, operating systems, compilers, and web servers — step by step.
              </p>
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore Projects <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 4: Engineering Resources & Books */}
            <Link
              href="/resources"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-blue-500/20 hover:border-blue-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-300">
                  Curated Resources
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  5,700+ Library
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Spend less time searching and more time learning. Find verified engineering books, official documentation, and cheat sheets in one place.
              </p>
              <span className="text-xs font-semibold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Find Learning Resources <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Feature 5: Career Assistant */}
            <Link
              href="/assistant"
              className="p-6 rounded-2xl glass-card hover:bg-card/70 border border-pink-500/20 hover:border-pink-500/40 transition-all group relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-pink-500/20">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-pink-300">
                  Career Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Personalized
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-sm mb-4">
                Stuck on what to learn next? Tell us your goals and background. We&apos;ll help you map out a clear roadmap and discover projects to practice.
              </p>
              <span className="text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Plan Your Path <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Companies Marquee */}
      <CompanyMarquee />

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 backdrop-blur-md" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 glass-card p-12 rounded-3xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
            From Confusion to Clarity. <br />
            From Learning to Building.
          </h2>
          <p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed">
            Join thousands of students and developers who are taking control of their career journey with structured roadmaps and real projects.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="?modal=signup"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform text-sm shadow-sm"
            >
              Start Your Free Journey
            </Link>
            <DevRoadmapButton variant="glow" size="lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <HomeNotificationsSection />
      <Footer />

      <ResumeScreenerModal
        isOpen={isResumeScreenerOpen}
        onClose={() => setResumeScreenerOpen(false)}
      />
      <MentalHealthScoreModal
        isOpen={isMentalHealthScoreOpen}
        onClose={() => setMentalHealthScoreOpen(false)}
      />
    </div>
  );
}
