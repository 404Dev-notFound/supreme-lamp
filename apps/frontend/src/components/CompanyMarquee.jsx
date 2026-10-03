"use client";

import React from "react";

const LOGOS = [
  { name: "Google", src: "/logos/google.svg" },
  { name: "OpenAI", src: "/logos/openai.svg" },
  { name: "GitHub", src: "/logos/github.svg" },
  { name: "Stripe", src: "/logos/stripe.svg" },
  { name: "Anthropic", src: "/logos/anthropic-claude.svg" },
  { name: "Docker", src: "/logos/docker.svg" },
  { name: "Linear", src: "/logos/linear.svg" },
  { name: "Vercel", src: "/logos/vercel.svg" },
  { name: "LinkedIn", src: "/logos/linkedin.svg" },
  { name: "Datadog", src: "/logos/datadog.svg" },
  { name: "Next.js", src: "/logos/nextjs.svg" },
  { name: "Tailwind CSS", src: "/logos/tailwindcss.svg" },
  { name: "Discord", src: "/logos/discord.svg" },
  { name: "PostgreSQL", src: "/logos/postgresql.svg" },
  { name: "Xiaomi", src: "/logos/xiaomi.svg" },
  { name: "Google Cloud", src: "/logos/google-cloud.svg" },
  { name: "Tencent Cloud", src: "/logos/tencent-cloud.svg" },
  { name: "X", src: "/logos/x-twitter.svg" },
];

export default function CompanyMarquee() {
  return (
    <section className="py-24 overflow-hidden relative bg-black/30 border-y border-white/10">
      <div className="w-full relative marquee-mask">
        <div className="marquee-track">
          {/* Primary logo set */}
          <div className="marquee-group">
            {LOGOS.map((logo, index) => (
              <div key={`logo-primary-${index}`} className="marquee-item">
                <img
                  src={logo.src}
                  alt={`${logo.name} logo`}
                  title={logo.name}
                  loading="lazy"
                  className="marquee-logo"
                />
              </div>
            ))}
          </div>

          {/* Duplicated logo set for seamless infinite loop */}
          <div className="marquee-group" aria-hidden="true">
            {LOGOS.map((logo, index) => (
              <div key={`logo-clone-${index}`} className="marquee-item">
                <img
                  src={logo.src}
                  alt=""
                  title={logo.name}
                  loading="lazy"
                  className="marquee-logo"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .marquee-mask {
          overflow: hidden;
          width: 100%;
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 6%,
            black 94%,
            transparent 100%
          );
        }

        .marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marquee-scroll 36s linear infinite;
        }

        .marquee-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .marquee-item {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 130px;
          padding: 0 16px;
        }

        @media (min-width: 640px) {
          .marquee-item {
            width: 145px;
            padding: 0 20px;
          }
        }

        @media (min-width: 768px) {
          .marquee-item {
            width: 160px;
            padding: 0 22px;
          }
        }

        @media (min-width: 1024px) {
          .marquee-item {
            width: 175px;
            padding: 0 26px;
          }
        }

        @media (min-width: 1280px) {
          .marquee-item {
            width: 180px;
            padding: 0 28px;
          }
        }

        .marquee-logo {
          height: 28px;
          width: auto;
          max-width: 100px;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.6;
          transition: opacity 0.25s ease, transform 0.25s ease;
          user-select: none;
        }

        @media (min-width: 768px) {
          .marquee-logo {
            height: 32px;
            max-width: 120px;
          }
        }

        .marquee-item:hover .marquee-logo {
          opacity: 0.95;
          transform: scale(1.05);
        }

        @keyframes marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}} />
    </section>
  );
}
