"use client";

import React, { useEffect, useRef } from "react";
import { Lock, X, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function PremiumAccessPopup({
  isOpen,
  onClose,
  targetResource,
  anchorRect = null,
  isAuthenticated = false,
  onOpenAuth = null,
  onOpenUpgrade = null,
}) {
  const popupRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate positioning near the clicked card
  let style = {};
  if (anchorRect && typeof window !== "undefined") {
    const margin = 12;
    const popupWidth = 320;
    const popupHeight = 220;

    let left = anchorRect.right + margin;
    let top = anchorRect.top;

    // Check right screen boundary
    if (left + popupWidth > window.innerWidth - 16) {
      left = anchorRect.left - popupWidth - margin;
    }
    // Check left screen boundary
    if (left < 16) {
      left = Math.max(16, (window.innerWidth - popupWidth) / 2);
      top = Math.max(16, anchorRect.bottom + margin);
    }
    // Check bottom screen boundary
    if (top + popupHeight > window.innerHeight - 16) {
      top = Math.max(16, window.innerHeight - popupHeight - 16);
    }

    style = {
      position: "fixed",
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    };
  } else {
    // Default contextual side/floating fallback
    style = {
      position: "fixed",
      bottom: "24px",
      right: "24px",
    };
  }

  return (
    <div
      ref={popupRef}
      style={style}
      role="dialog"
      aria-modal="true"
      aria-label="Premium Membership Notice"
      className="z-50 w-80 p-5 rounded-2xl bg-zinc-950/95 border border-orange-500/40 text-white shadow-2xl shadow-orange-500/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 transition-all select-none"
    >
      {/* Top Header: Lock Icon & Dismiss */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
            flowCTRL Premium
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Message */}
      <h4 className="text-base font-bold text-white tracking-tight mb-1">
        Available with Premium Membership
      </h4>

      {targetResource?.title && (
        <div className="text-xs text-amber-200/90 font-medium mb-2 truncate">
          {targetResource.title}
        </div>
      )}

      {/* Supporting Text */}
      <p className="text-xs text-zinc-300 leading-relaxed mb-4">
        Unlock exclusive learning resources and access premium roadmaps with
        flowCTRL Premium.
      </p>

      {/* Action CTA */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenUpgrade) onOpenUpgrade();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold text-xs hover:from-orange-400 hover:to-amber-400 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            Upgrade to Premium
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAuth) onOpenAuth();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-semibold text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            Sign In to flowCTRL
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}
      </div>
    </div>
  );
}

