"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="p-8 rounded-3xl bg-zinc-900 border border-red-500/30 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Critical Application Error
          </h1>
          <p className="text-sm text-zinc-400 mb-6">
            {error?.message ||
              "A critical error prevented the page from rendering."}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reload flowCTRL
          </button>
        </div>
      </body>
    </html>
  );
}
