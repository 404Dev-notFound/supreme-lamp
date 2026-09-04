"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Next.js route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="p-8 rounded-3xl glass-card border border-red-500/20 max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-lg shadow-red-500/5">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {error?.message ||
            "We encountered an unexpected error while loading this page."}
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
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
