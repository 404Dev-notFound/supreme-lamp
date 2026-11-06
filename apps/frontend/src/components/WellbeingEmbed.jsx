"use client";

import React, { useState } from "react";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export default function WellbeingEmbed() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400" />
        <h4 className="text-sm font-bold text-zinc-100">Unable to load interactive wellbeing widget</h4>
        <p className="text-xs text-zinc-400 max-w-sm">
          The external wellbeing service might be temporarily unavailable or blocked by browser privacy settings.
        </p>
        <a
          href="https://fluffy-spoon-score.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow"
        >
          <span>Open in New Tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950">
      <iframe
        src="https://fluffy-spoon-score.vercel.app/"
        title="Mental Health Score"
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
