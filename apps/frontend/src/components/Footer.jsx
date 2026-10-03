"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Mail,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Shield,
  Code2,
  Cpu,
  Search,
  CheckCircle2,
} from "lucide-react";
import {
  APP_VERSION,
  COPYRIGHT_NOTICE,
  DEVELOPER_INFO,
  ECOSYSTEM_PRODUCTS,
  LEGAL_LINKS,
  PRODUCT_LINKS,
  SOCIAL_LINKS,
  RESOURCE_CATEGORIES,
} from "@/lib/footerConfig";

export default function Footer() {
  const [isResourcesExpanded, setIsResourcesExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [resourceSearch, setResourceSearch] = useState("");

  // Flatten all resources for easy searching & filtering
  const allResources = useMemo(() => {
    return RESOURCE_CATEGORIES.flatMap((cat) =>
      cat.items.map((item) => ({
        ...item,
        category: cat.name,
        categoryId: cat.id,
      })),
    );
  }, []);

  // Filtered resources based on search & category
  const filteredResources = useMemo(() => {
    return allResources.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;
      const matchesSearch =
        !resourceSearch.trim() ||
        item.name.toLowerCase().includes(resourceSearch.toLowerCase().trim()) ||
        item.description
          .toLowerCase()
          .includes(resourceSearch.toLowerCase().trim()) ||
        item.category
          .toLowerCase()
          .includes(resourceSearch.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [allResources, selectedCategory, resourceSearch]);

  return (
    <footer
      role="contentinfo"
      className="border-t border-white/10 py-16 px-6 glass relative z-10 transition-colors selection:bg-primary/30"
    >
      <div className="absolute inset-0 bg-background/85 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Top Banner: Ecosystem Headline & Developer Attribution */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-12 border-b border-white/10">
          <div className="space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-85 transition-opacity inline-flex group"
              aria-label="flowCTRL Home"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                fC
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-white">
                    flowCTRL
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                    Ecosystem v{APP_VERSION}
                  </span>
                </div>
                <span className="text-xs text-zinc-300 font-medium">
                  The Career Operating System
                </span>
              </div>
            </Link>
            <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
              Empowering engineers and ambitious talent to systematically bridge
              skill gaps, master interactive roadmaps, and build verified
              careers.
            </p>
          </div>

          {/* Quick Attribution & Status Card */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium">
                Platform Status:
              </span>
              <span className="text-emerald-400 font-semibold">
                100% Operational
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-zinc-300">Architect:</span>
              <a
                href={DEVELOPER_INFO.mailto}
                className="text-amber-300 hover:text-amber-200 font-semibold hover:underline inline-flex items-center gap-1 transition-colors"
                title={`Contact ${DEVELOPER_INFO.name}`}
              >
                <span>{DEVELOPER_INFO.name}</span>
                <Mail className="w-3 h-3 opacity-70" />
              </a>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-mono">
              Version {APP_VERSION}
            </div>
          </div>
        </div>

        {/* Core Navigation Grid: 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: flowCTRL Ecosystem */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-sm tracking-wider uppercase text-zinc-200">
                flowCTRL Ecosystem
              </h3>
            </div>
            <p className="text-xs text-zinc-300">
              Integrated platforms, companion products, and developer toolkits.
            </p>
            <ul className="space-y-3 text-sm">
              {ECOSYSTEM_PRODUCTS.map((prod) => (
                <li key={prod.name}>
                  {prod.isExternal ? (
                    <a
                      href={prod.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          {prod.name}
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10 group-hover:border-amber-500/30 group-hover:text-amber-300">
                          {prod.badge}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 mt-0.5 line-clamp-1 group-hover:text-zinc-200">
                        {prod.tagline}
                      </span>
                    </a>
                  ) : (
                    <Link
                      href={prod.href}
                      className="group flex flex-col p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200 group-hover:text-amber-300 transition-colors">
                          {prod.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 border border-white/10 group-hover:border-amber-500/30 group-hover:text-amber-300">
                          {prod.badge}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 mt-0.5 line-clamp-1 group-hover:text-zinc-200">
                        {prod.tagline}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Product & Capabilities */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm tracking-wider uppercase text-zinc-200">
                Product & Features
              </h3>
            </div>
            <p className="text-xs text-zinc-300">
              Skill graph tools, AI intelligence, and career accelerator
              engines.
            </p>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-zinc-300 hover:text-white transition-colors flex items-center justify-between py-1 hover:translate-x-1 duration-200"
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal & Governance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-sm tracking-wider uppercase text-zinc-200">
                Legal & Governance
              </h3>
            </div>
            <p className="text-xs text-zinc-300">
              Terms of service, zero-exposure privacy, and collaboration
              agreements.
            </p>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.title}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-300 hover:text-white transition-colors flex items-center justify-between py-1 group"
                    title={link.description}
                  >
                    <span className="group-hover:text-zinc-100 transition-colors">
                      {link.title}
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Developer & Community */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-sm tracking-wider uppercase text-zinc-200">
                Developer & Community
              </h3>
            </div>
            <p className="text-xs text-zinc-300">
              Created with devotion by Scripted by Dev. Join our global guilds.
            </p>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="text-xs text-zinc-300">
                Lead Creator & Architect
              </div>
              <div className="font-medium text-white text-sm">
                {DEVELOPER_INFO.name}
              </div>
              <a
                href={DEVELOPER_INFO.mailto}
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors break-all"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {DEVELOPER_INFO.email}
              </a>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Social Networks
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-xs text-zinc-300 hover:text-white transition-all shadow-sm"
                  >
                    <span>{social.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resources / Technologies / Services Used Section */}
        <section
          aria-labelledby="resources-heading"
          className="pt-8 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-orange-400" />
                <h3
                  id="resources-heading"
                  className="font-semibold text-sm tracking-wider uppercase text-zinc-200"
                >
                  Resources & Technologies Used ({allResources.length})
                </h3>
              </div>
              <p className="text-xs text-zinc-300">
                The comprehensive open-source libraries, cloud platforms, AI
                services, and tooling integrated into flowCTRL.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsResourcesExpanded(!isResourcesExpanded)}
              aria-expanded={isResourcesExpanded}
              aria-controls="resources-catalog-panel"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm hover:border-white/20 self-start sm:self-auto"
            >
              <span>
                {isResourcesExpanded
                  ? "Collapse Resources"
                  : "Explore All 53 Resources"}
              </span>
              {isResourcesExpanded ? (
                <ChevronUp className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              )}
            </button>
          </div>

          {/* Collapsible Content */}
          {isResourcesExpanded && (
            <div
              id="resources-catalog-panel"
              className="p-6 rounded-3xl bg-zinc-950/60 border border-white/10 backdrop-blur-xl space-y-6 animate-in fade-in slide-in-from-top-4 duration-200"
            >
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === "all"
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    All ({allResources.length})
                  </button>
                  {RESOURCE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {cat.name} ({cat.items.length})
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    placeholder="Search frameworks, APIs..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  {resourceSearch && (
                    <button
                      type="button"
                      onClick={() => setResourceSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Resource Cards */}
              {filteredResources.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  No matching resources found for &quot;{resourceSearch}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredResources.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-orange-500/30 transition-all flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-xs text-zinc-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                            {item.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-amber-300 transition-colors shrink-0" />
                        </div>
                        <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-300">
                        <span className="truncate max-w-[150px]">
                          {item.category}
                        </span>
                        <span className="text-orange-400/90 group-hover:text-orange-300 font-mono">
                          external ↗
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bottom Bar: Copyright, Attribution & Legal Status */}
        <div className="pt-8 border-t border-white/10 text-xs text-zinc-300 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p className="font-medium text-zinc-300">{COPYRIGHT_NOTICE}</p>
            <span className="hidden sm:inline text-zinc-500">|</span>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span>Scripted by</span>
              <a
                href={DEVELOPER_INFO.mailto}
                className="text-zinc-200 hover:text-amber-300 font-semibold underline decoration-white/20 hover:decoration-amber-300 transition-colors"
              >
                {DEVELOPER_INFO.name}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 text-zinc-300">
            <span className="flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Zero-Exposure Certified
            </span>
            <span className="text-zinc-500">|</span>
            <span className="font-mono text-[11px] text-zinc-300">
              Build v{APP_VERSION}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
