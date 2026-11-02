"use client";

import React, { useState } from "react";
import { X, Check, Sparkles, Shield, Zap, Lock, CreditCard } from "lucide-react";
import { membershipService } from "../../services/membership.service";

export default function UpgradeMembershipModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [selectedPlan, setSelectedPlan] = useState("PREMIUM_ANNUAL");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await membershipService.upgradePlan({
        planCode: selectedPlan,
        paymentMethod,
        autoRenew: true,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.membership);
          setIsSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Failed to upgrade membership. Please try again.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-zinc-950 border border-orange-500/30 text-white shadow-2xl shadow-orange-500/10 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Welcome to flowCTRL Premium!
            </h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              Your subscription is active. All premium roadmaps, masterclasses,
              and advanced architecture tracks are unlocked.
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                flowCTRL Premium
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Elevate your engineering career.
            </h2>
            <p className="text-sm text-zinc-300 mb-6">
              Access deep-dive masterclasses, planetary-scale distributed systems,
              offensive cybersecurity labs, and verified member credentials.
            </p>

            {error && (
              <div className="p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs">
                {error}
              </div>
            )}

            {/* Plan Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan("PREMIUM_ANNUAL")}
                className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPlan === "PREMIUM_ANNUAL"
                    ? "bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10"
                    : "bg-zinc-900/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-bold">
                  Save 35%
                </div>
                <div className="text-xs font-semibold text-zinc-400 mb-1">
                  Annual Access
                </div>
                <div className="text-2xl font-extrabold text-white mb-0.5">
                  $149
                  <span className="text-xs text-zinc-400 font-normal"> / year</span>
                </div>
                <div className="text-[11px] text-amber-200/90 font-medium">
                  Equivalent to $12.40 / mo
                </div>
              </div>

              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan("PREMIUM_MONTHLY")}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedPlan === "PREMIUM_MONTHLY"
                    ? "bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10"
                    : "bg-zinc-900/60 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-semibold text-zinc-400 mb-1">
                  Monthly Flexible
                </div>
                <div className="text-2xl font-extrabold text-white mb-0.5">
                  $19
                  <span className="text-xs text-zinc-400 font-normal"> / month</span>
                </div>
                <div className="text-[11px] text-zinc-400">Cancel anytime</div>
              </div>
            </div>

            {/* Included Features */}
            <div className="space-y-2 mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Included in flowCTRL Premium:
              </div>
              {[
                "Full access to 6 exclusive curated engineering masterclasses",
                "Advanced architecture blueprints & state machine consensus guides",
                "Offensive security, threat modeling & cryptographic protocols",
                "Zero-fluff deep-dive curriculum with interactive code checkpoints",
                "Verified Senior Architect Member Badge on public profile",
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-200">
                  <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Payment Method Selector */}
            <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-zinc-900/80 border border-white/10 text-xs text-zinc-300">
              <CreditCard className="w-4 h-4 text-orange-400" />
              <span>Simulated Instant Payment (Sandbox Demo)</span>
              <span className="ml-auto text-[10px] text-emerald-400 font-medium">
                SSL Secured
              </span>
            </div>

            {/* Submit CTA */}
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-bold text-sm transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Activating Subscription...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-black" />
                  <span>
                    Activate{" "}
                    {selectedPlan === "PREMIUM_ANNUAL" ? "Annual ($149)" : "Monthly ($19)"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

