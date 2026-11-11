"use client";

import LogoLoop from "./LogoLoop";

const LOGOS = [
  { title: "Google", src: "/logos/google.svg", alt: "Google logo" },
  { title: "OpenAI", src: "/logos/openai.svg", alt: "OpenAI logo" },
  { title: "GitHub", src: "/logos/github.svg", alt: "GitHub logo" },
  { title: "Stripe", src: "/logos/stripe.svg", alt: "Stripe logo" },
  { title: "Anthropic", src: "/logos/anthropic-claude.svg", alt: "Anthropic logo" },
  { title: "Docker", src: "/logos/docker.svg", alt: "Docker logo" },
  { title: "Linear", src: "/logos/linear.svg", alt: "Linear logo" },
  { title: "Vercel", src: "/logos/vercel.svg", alt: "Vercel logo" },
  { title: "LinkedIn", src: "/logos/linkedin.svg", alt: "LinkedIn logo" },
  { title: "Datadog", src: "/logos/datadog.svg", alt: "Datadog logo" },
  { title: "Next.js", src: "/logos/nextjs.svg", alt: "Next.js logo" },
  { title: "Tailwind CSS", src: "/logos/tailwindcss.svg", alt: "Tailwind CSS logo" },
  { title: "Discord", src: "/logos/discord.svg", alt: "Discord logo" },
  { title: "PostgreSQL", src: "/logos/postgresql.svg", alt: "PostgreSQL logo" },
  { title: "Xiaomi", src: "/logos/xiaomi.svg", alt: "Xiaomi logo" },
  { title: "Google Cloud", src: "/logos/google-cloud.svg", alt: "Google Cloud logo" },
  { title: "Tencent Cloud", src: "/logos/tencent-cloud.svg", alt: "Tencent Cloud logo" },
  { title: "X", src: "/logos/x-twitter.svg", alt: "X logo" },
];

export default function CompanyMarquee() {
  return (
    <section className="py-12 overflow-hidden relative bg-black/30 border-y border-white/10">
      <LogoLoop
        logos={LOGOS}
        speed={80}
        direction="left"
        logoHeight={32}
        gap={64}
        hoverSpeed={0}
        scaleOnHover
        ariaLabel="Company logos"
        className="marquee-mask"
      />
    </section>
  );
}
