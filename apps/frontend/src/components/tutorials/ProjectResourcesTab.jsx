"use client";

import React from "react";
import {
  FolderGit2,
  ExternalLink,
  BookOpen,
  Globe,
  Sparkles,
  ShieldCheck,
  Play,
  FileCode,
  Compass,
} from "lucide-react";

function extractYouTubeId(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

export default function ProjectResourcesTab({ project }) {
  // Find any YouTube video attached to project or its resources
  const directVideoId =
    extractYouTubeId(project.tutorialUrl) ||
    extractYouTubeId(project.videoUrl);

  const resourceVideoId =
    project.resources &&
    project.resources
      .map((r) => extractYouTubeId(r.url))
      .find(Boolean);

  const primaryVideoId = directVideoId || resourceVideoId;

  // Group resources
  const allResources = project.resources || [];
  const repos = allResources.filter((r) => r.resourceType === "GITHUB_REPO");
  const docs = allResources.filter(
    (r) => r.resourceType === "OFFICIAL_DOCS" || r.resourceType === "SPECIFICATION"
  );
  const tutorials = allResources.filter(
    (r) => r.resourceType === "ORIGINAL_TUTORIAL" || r.resourceType === "ARTICLE" || r.resourceType === "VIDEO"
  );

  return (
    <div className="space-y-10">
      {/* 1. Playable Video Tutorial Player (if YouTube video exists) */}
      {primaryVideoId && (
        <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              <Play className="w-4 h-4 fill-red-500 text-red-500" />
              Embedded Video Walkthrough
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${primaryVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/20 transition-all"
            >
              Watch Directly on YouTube
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${primaryVideoId}?rel=0`}
              title="Project Video Walkthrough"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-zinc-400 mt-3">
            Streamed in high definition without external redirection. You can pause, review chapters, and code alongside the instructor.
          </p>
        </section>
      )}

      {/* 2. GitHub Repositories Section */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-orange-400">
            <FolderGit2 className="w-4 h-4" />
            GitHub Repositories & Source Implementations
          </div>
          <span className="text-xs text-zinc-500 font-mono">Open Source</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary GitHub Repo */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-orange-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Primary Source
                </span>
                <FolderGit2 className="w-4 h-4 text-zinc-400" />
              </div>
              <h4 className="text-sm font-bold text-zinc-100 mb-1">
                {project.title} Reference Repository
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                Explore the verified original source code, commit history, branch structure, and test suites.
              </p>
            </div>
            <a
              href={project.githubUrl || project.tutorialUrl || project.sourceRepo || "https://github.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-black font-semibold text-xs hover:bg-orange-400 transition-all"
            >
              Open on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Sibling or Additional Repos */}
          {repos.length > 0 ? (
            repos.map((repo, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Implementation
                    </span>
                    <FolderGit2 className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mb-1">
                    {repo.title}
                  </h4>
                  {repo.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {repo.description}
                    </p>
                  )}
                </div>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-medium transition-all"
                >
                  View Repository
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))
          ) : (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase block mb-1">
                  Community Implementations
                </span>
                <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                  Build Your Own X Catalog
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Curated index of open-source recreations across multiple languages and architectures.
                </p>
              </div>
              <a
                href={project.sourceRepo || "https://github.com/codecrafters-io/build-your-own-x"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium border border-white/5 transition-all"
              >
                Explore Catalog
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 3. Official Documentation & Specifications */}
      <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Globe className="w-4 h-4" />
            Official Documentation & Technical Specifications
          </div>
          <span className="text-xs text-zinc-500 font-mono">Standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.length > 0 ? (
            docs.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">
                      Specification
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-300 transition-colors">
                    {doc.title}
                  </h4>
                  {doc.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0 mt-1" />
              </a>
            ))
          ) : (
            <div className="col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Consult standard RFCs, language manuals, and official runtime documentation for {project.language} during implementation.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Verified Tutorials & Learning Articles */}
      {tutorials.length > 0 && (
        <section className="p-8 rounded-3xl glass-card border border-white/10 bg-zinc-950/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              Curated Articles & Deep Dives
            </div>
            <span className="text-xs text-zinc-500 font-mono">Verified Guides</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorials.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      {item.resourceType.replace(/_/g, " ")}
                    </span>
                    {item.author && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        by {item.author}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0 mt-1" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

