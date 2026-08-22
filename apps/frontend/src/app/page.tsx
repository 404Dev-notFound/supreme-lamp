"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart, Compass, Users, Code, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import JobMatcherModal from '../components/JobMatcherModal';
import NavProfile from '../components/NavProfile';
import WellbeingEmbed from '../components/WellbeingEmbed';
import CompanyMarquee from '../components/CompanyMarquee';

export default function LandingPage() {
  const [isJobMatcherOpen, setJobMatcherOpen] = useState(false);
  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-primary-foreground tracking-tighter">fC</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">flowCTRL</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/resume-screener" className="hover:text-white transition-colors">Resume Screener</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="?modal=signin" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">Log in</Link>
          <Link href="?modal=signup" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors">Get Started</Link>
          <NavProfile />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 glass">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          flowCTRL 2.0 is now live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl leading-[1.1]">
          Control over your career. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
            From confusion to clarity.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          The first Career Operating System designed to help you identify your skill gaps, generate a personalized learning roadmap, and systematically land your dream job.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/signup" className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-zinc-200 transition-all">
            Start your journey <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/resume-screener" className="flex items-center gap-2 px-6 py-3 rounded-full font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
            Resume Screener
          </Link>
        </div>
      </section>

      {/* Dashboard Preview Placeholder */}
      <section className="px-6 pb-32 max-w-6xl mx-auto relative z-10">
        <div className="aspect-[16/9] w-full glass-card rounded-2xl flex flex-col overflow-hidden">
          {/* Fake Window Header */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 glass shrink-0 relative">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-white/5 border border-white/10 rounded-md px-3 py-1 text-xs text-zinc-400 font-medium tracking-wide w-64 justify-center shadow-inner">
              <span className="opacity-50 mr-1">🔒</span> localhost:3000/wellbeing
            </div>
          </div>
          {/* Embedded Mental Health App */}
          <div className="flex-1 relative overflow-hidden bg-background/50">
            <WellbeingEmbed />
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 px-6 border-t border-white/10 relative">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white shadow-sm">Everything you need to grow.</h2>
            <p className="text-zinc-300 text-lg max-w-2xl">Stop guessing what to learn next. flowCTRL analyzes your skills and provides a systematic path to your dream career.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-orange-500/20">
                <BarChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Skill Gap Analyzer</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Discover exactly what you know and what you're missing compared to top industry requirements.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-amber-500/20">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Roadmap Generator</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Turn your skill gaps into a structured, daily learning plan with milestones and projects.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-rose-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1-on-1 Mentorship</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Connect directly with industry leaders, engineers, and product managers who have been there.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-red-500/20">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio Builder</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Showcase your projects in an interactive, auto-generated portfolio that recruiters love.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400 mb-6 group-hover:scale-110 transition-transform shadow-inner border border-yellow-500/20">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ATS Resume Checker</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Ensure your resume passes automated filters before it even reaches human eyes.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl glass-card hover:bg-card/70 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform shadow-inner border border-primary/20">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Job Matcher</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Get matched with companies looking for your exact skill profile and readiness score.
              </p>
              <button onClick={() => setJobMatcherOpen(true)} className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                Find Jobs
              </button>
            </div>
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to take control?</h2>
          <p className="text-xl text-zinc-400 mb-10">Join thousands of ambitious individuals building their careers systematically with flowCTRL.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:scale-105 transition-transform">
            Create your free account
          </Link>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> No credit card required</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> 14-day premium trial</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 glass relative">
        <div className="absolute inset-0 bg-background/80 pointer-events-none" />
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">fC</div>
              <span className="font-semibold tracking-tight">flowCTRL</span>
            </div>
            <p className="text-zinc-500 text-sm">The Career Operating System.</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white transition-colors">Skill Gap Analyzer</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Roadmap Generator</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Portfolio Builder</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white transition-colors">Mentors</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Events</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Discord</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Legal</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-sm text-zinc-500 flex flex-col md:flex-row justify-between items-center relative z-10">
          <p>© 2026 flowCTRL Inc. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-zinc-300">Twitter</Link>
            <Link href="#" className="hover:text-zinc-300">GitHub</Link>
            <Link href="#" className="hover:text-zinc-300">LinkedIn</Link>
          </div>
        </div>
      </footer>

    <JobMatcherModal isOpen={isJobMatcherOpen} setOpen={setJobMatcherOpen} />
    </div>
  );
}
