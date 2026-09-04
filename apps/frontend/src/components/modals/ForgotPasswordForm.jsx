"use client";

import React, { useState } from "react";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordForm({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate safe processing (avoids email enumeration)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const switchModal = (target) => {
    const url = new URL(window.location.href);
    url.searchParams.set("modal", target);
    window.history.replaceState(null, "", url.toString());
  };

  if (submitted) {
    return (
      <div className="py-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 border border-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-zinc-100">
            Check your inbox
          </h4>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            If an account is associated with{" "}
            <span className="text-zinc-200">{email}</span>, password reset
            instructions have been sent.
          </p>
        </div>
        <button
          type="button"
          onClick={() => switchModal("signin")}
          className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-zinc-400 leading-relaxed">
        Enter the email address associated with your flowCTRL account and we
        will send you a link to reset your credentials.
      </p>

      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => (onClose ? onClose() : switchModal("signin"))}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
