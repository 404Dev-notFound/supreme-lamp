'use client';

import React, { useState, useEffect } from "react";

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

// Simple Fisher–Yates shuffle
function shuffleArray(array: string[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CompanyMarquee() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  // Initialize rows as empty; they'll be populated on client after mount
  const [row0, setRow0] = useState<string[]>([]);
  const [row1, setRow1] = useState<string[]>([]);
  const [row2, setRow2] = useState<string[]>([]);
  const [row3, setRow3] = useState<string[]>([]);

  // Populate rows with shuffled duplicate lists on client side only
  useEffect(() => {
    setRow0(duplicate(shuffleArray(companies)));
    setRow1(duplicate(shuffleArray(companies)));
    setRow2(duplicate(shuffleArray(companies)));
    setRow3(duplicate(shuffleArray(companies)));
  }, []);


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
            className={`inline-block marquee-inner ${hoveredRow===0 ? 'paused' : ''}`}
            style={{ animation: "marquee1 30s linear infinite" }}
          >
              {row0.map((c, i) => (
                <span
                  key={`row0-${i}`}
                  className={`text-xl text-white/90 mx-4 transition-all duration-300 ${hoveredRow===0 && hoveredName===c ? 'scale-110 text-amber-400' : ''}`}
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
            className={`inline-block marquee-inner ${hoveredRow===1 ? 'paused' : ''}`}
            style={{ animation: "marquee2 45s linear infinite" }}
          >
              {row1.map((c, i) => (
                <span
                  key={`row1-${i}`}
                  className={`text-lg text-white/80 mx-4 transition-all duration-300 ${hoveredRow===1 && hoveredName===c ? 'scale-110 text-amber-400' : ''}`}
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
            className={`inline-block marquee-inner ${hoveredRow===2 ? 'paused' : ''}`}
            style={{ animation: "marquee3 60s linear infinite" }}
          >
              {row2.map((c, i) => (
                <span
                  key={`row2-${i}`}
                  className={`text-lg text-white/70 mx-4 transition-all duration-300 ${hoveredRow===2 && hoveredName===c ? 'scale-110 text-amber-400' : ''}`}
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
            className={`inline-block marquee-inner ${hoveredRow===3 ? 'paused' : ''}`}
            style={{ animation: "marquee4 75s linear infinite" }}
          >
              {row3.map((c, i) => (
                <span
                  key={`row3-${i}`}
                  className={`text-lg text-white/60 mx-4 transition-all duration-300 ${hoveredRow===3 && hoveredName===c ? 'scale-110 text-amber-400' : ''}`}
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
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee3 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee4 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
