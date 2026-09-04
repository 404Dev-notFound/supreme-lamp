import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="p-10 rounded-3xl glass-card border border-white/10 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-6 shadow-lg shadow-orange-500/5">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-orange-400 px-3 py-1 rounded-full bg-orange-500/10 mb-3">
          404 Error
        </span>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          The page or track you are looking for does not exist or has been
          moved.
        </p>

        <div className="flex items-center gap-3 w-full">
          <Link
            href="/roadmaps"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Compass className="w-4 h-4" />
            Roadmaps
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl glass hover:bg-white/10 text-white font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
