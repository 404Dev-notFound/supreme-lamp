"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import BrandWordmark from "@/components/BrandWordmark";
import {
  GraduationCap,
  Search,
  Filter,
  Clock,
  BookOpen,
  Users,
  Star,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PlayCircle,
  Code,
  FileCode,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import NavProfile from "@/components/NavProfile";
import Footer from "@/components/Footer";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [enrolledMap, setEnrolledMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Load enrollment from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("flowctrl_courses_enrolled");
      if (saved) setEnrolledMap(JSON.parse(saved));
    } catch {}
  }, []);

  // Fetch courses from backend API
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${apiUrl}/api/courses`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.data && Array.isArray(data.data)) {
          setCourses(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Could not load courses from backend:", err);
        setLoading(false);
      });
  }, []);

  const toggleEnroll = (id) => {
    const next = { ...enrolledMap, [id]: !enrolledMap[id] };
    setEnrolledMap(next);
    try {
      localStorage.setItem("flowctrl_courses_enrolled", JSON.stringify(next));
    } catch {}
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "all" ||
        c.category.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesLevel =
        selectedLevel === "all" ||
        c.level.toLowerCase().includes(selectedLevel.toLowerCase());

      return matchesSearch && matchesCat && matchesLevel;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const categories = ["all", "Architecture & Infrastructure", "Full Stack & Web", "Artificial Intelligence", "Backend & Systems"];

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30 flex flex-col justify-between">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            aria-label="Back to Home"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-bold text-primary-foreground tracking-tighter">fC</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">
              <BrandWordmark className="text-lg" />{" "}<span className="text-orange-400 font-normal">/ Premium Courses</span>
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <Link href="/roadmaps" className="hover:text-amber-300 transition-colors">Roadmaps</Link>
          <Link href="/dsa" className="hover:text-amber-300 transition-colors">Problem-Solving & DSA</Link>
          <Link href="/project-tutorials" className="hover:text-amber-300 transition-colors">Project Tutorials</Link>
          <Link href="/resources" className="hover:text-amber-300 transition-colors">Resources</Link>
          <Link href="/assistant" className="hover:text-amber-300 transition-colors">Career Assistant</Link>
        </div>

        <div className="flex items-center gap-3">
          <NavProfile />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto w-full flex-1">
        {/* Banner */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5" />
            Structured Engineering Curriculums
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Master Production Engineering
          </h1>
          <p className="text-zinc-400 max-w-3xl text-sm sm:text-base">
            In-depth multi-week courses taught by staff engineers and infrastructure leads, complete with architecture diagrams, interactive labs, and capstone code deliverables.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="glass p-4 rounded-xl border border-white/10 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search masterclasses, topics, instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All Domains</option>
              {categories.slice(1).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All Experience Levels</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledMap[course.id];

            return (
              <div
                key={course.id}
                className="glass rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1 group"
              >
                {/* Course Header / Thumbnail */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow">
                      {course.badge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-900/90 text-zinc-300 border border-white/10 text-xs font-semibold">
                      {course.level}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900/90 border border-white/10 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{course.rating}</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs text-orange-400 font-semibold mb-1 uppercase tracking-wider">
                      {course.category}
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </div>
                </div>

                {/* Course Details Body */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                      {course.description}
                    </p>

                    <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-4">
                      <span className="text-zinc-500">Instructor:</span>
                      <span className="text-zinc-200 font-medium">{course.instructor}</span>
                    </div>

                    {/* Stats strip */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-center">
                      <div>
                        <div className="text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                          <Clock className="w-3.5 h-3.5 text-orange-400" /> Hours
                        </div>
                        <div className="font-bold text-zinc-100">{course.durationHours} hrs</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Lessons
                        </div>
                        <div className="font-bold text-zinc-100">{course.lessonsCount} units</div>
                      </div>
                      <div>
                        <div className="text-zinc-400 flex items-center justify-center gap-1 mb-0.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" /> Students
                        </div>
                        <div className="font-bold text-zinc-100">{course.enrolledCount.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Modules Accordion Preview */}
                  {course.modules && course.modules.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Syllabus Highlights:
                      </div>
                      <div className="space-y-1.5">
                        {course.modules.map((m, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                            <div className="font-semibold text-zinc-200 mb-1">{m.title}</div>
                            <div className="text-zinc-400 text-[11px] space-y-0.5">
                              {m.lessons.slice(0, 2).map((l, lIdx) => (
                                <div key={lIdx} className="flex items-center justify-between">
                                  <span className="truncate">• {l.title}</span>
                                  <span className="text-zinc-500 text-[10px] shrink-0">{l.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => toggleEnroll(course.id)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        isEnrolled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isEnrolled ? "Enrolled • Continue Learning" : "Start Learning"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

