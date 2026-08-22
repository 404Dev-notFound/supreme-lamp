"use client";

import React, { useState } from "react";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Netflix",
  "Stripe",
  "Apple",
  "NVIDIA",
  "Adobe",
  "Salesforce",
  "IBM",
  "Oracle",
  "Deloitte",
  "Goldman Sachs",
  "JPMorgan Chase",
  "Accenture",
  "Uber",
  "Airbnb",
  "Spotify",
  "PayPal",
];

// Helper to duplicate items for seamless looping
function duplicate(array: string[]) {
  return [...array, ...array];
}

const row0 = duplicate(companies);
const row1 = duplicate([...companies.slice(5), ...companies.slice(0, 5)]);
const row2 = duplicate([...companies.slice(10), ...companies.slice(0, 10)]);
const row3 = duplicate([...companies.slice(15), ...companies.slice(0, 15)]);

export default function CompanyMarquee() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  const handleMouseEnter = (row: number, name: string) => {
    setHoveredRow(row);
    setHoveredName(name);
  };
  const handleMouseLeave = () => {
    setHoveredRow(null);
    setHoveredName(null);
  };

  return (
    <section className="py-24 overflow-hidden relative bg-black/30 border-y border-white/10">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Row 1 - slightly higher */}
        <div className="overflow-hidden whitespace-nowrap mb-2">
          <div
            className={`inline-block marquee-inner ${hoveredRow === 0 ? "paused" : ""}`}
            style={{ animation: "marquee1 30s linear infinite" }}
          >
            {row0.map((c, i) => (
              <span
                key={`row0-${i}`}
                className={`text-xl text-white/90 mx-4 transition-all duration-300 ${hoveredRow === 0 && hoveredName === c ? "scale-110 text-amber-400" : ""}`}
                onMouseEnter={() => handleMouseEnter(0, c)}
                onMouseLeave={handleMouseLeave}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        {/* Row 2 - staggered lower */}
        <div className="overflow-hidden whitespace-nowrap mb-2">
          <div
            className={`inline-block marquee-inner ${hoveredRow === 1 ? "paused" : ""}`}
            style={{ animation: "marquee2 45s linear infinite" }}
          >
            {row1.map((c, i) => (
              <span
                key={`row1-${i}`}
                className={`text-lg text-white/80 mx-4 transition-all duration-300 ${hoveredRow === 1 && hoveredName === c ? "scale-110 text-amber-400" : ""}`}
                onMouseEnter={() => handleMouseEnter(1, c)}
                onMouseLeave={handleMouseLeave}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        {/* Row 3 - staggered higher */}
        <div className="overflow-hidden whitespace-nowrap mb-2">
          <div
            className={`inline-block marquee-inner ${hoveredRow === 2 ? "paused" : ""}`}
            style={{ animation: "marquee3 60s linear infinite" }}
          >
            {row2.map((c, i) => (
              <span
                key={`row2-${i}`}
                className={`text-lg text-white/70 mx-4 transition-all duration-300 ${hoveredRow === 2 && hoveredName === c ? "scale-110 text-amber-400" : ""}`}
                onMouseEnter={() => handleMouseEnter(2, c)}
                onMouseLeave={handleMouseLeave}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        {/* Row 4 - staggered lower */}
        <div className="overflow-hidden whitespace-nowrap">
          <div
            className={`inline-block marquee-inner ${hoveredRow === 3 ? "paused" : ""}`}
            style={{ animation: "marquee4 75s linear infinite" }}
          >
            {row3.map((c, i) => (
              <span
                key={`row3-${i}`}
                className={`text-lg text-white/60 mx-4 transition-all duration-300 ${hoveredRow === 3 && hoveredName === c ? "scale-110 text-amber-400" : ""}`}
                onMouseEnter={() => handleMouseEnter(3, c)}
                onMouseLeave={handleMouseLeave}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .marquee-inner {
          /* default animation speed set inline */
          will-change: transform;
        }
        .marquee-inner.paused {
          animation-play-state: paused !important;
        }
        @keyframes marquee1 {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee2 {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee3 {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee4 {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
