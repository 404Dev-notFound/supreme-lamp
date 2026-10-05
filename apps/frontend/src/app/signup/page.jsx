"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SignUpForm from "@/components/modals/SignUpForm";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative text-zinc-100 font-sans selection:bg-primary/30">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Header / Home Return */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-xs text-primary-foreground tracking-tighter">
              fC
            </span>
          </div>
          <span className="font-semibold text-base tracking-tight">flowCTRL</span>
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-8 shadow-2xl relative z-10 bg-zinc-950/80 backdrop-blur-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Create your account
          </h1>
          <p className="text-xs text-zinc-400">
            Join flowCTRL to map your skills, follow interactive dev tracks, and land top roles.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-zinc-500 animate-pulse">Loading form...</div>}>
          <SignUpForm onClose={() => router.push("/")} />
        </Suspense>
      </div>

      {/* Security Note */}
      <p className="mt-8 text-center text-[11px] text-zinc-500 relative z-10">
        By registering, you agree to the flowCTRL Terms and Security Guidelines.
      </p>
    </div>
  );
}
