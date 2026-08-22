import fs from "fs";
import path from "path";
import {
  RoadmapDetail,
  RoadmapEdge,
  RoadmapNode,
  RoadmapResource,
  RoadmapTopic,
  RoadmapTrackSummary,
} from "@flowctrl/types";

const SOURCE_ROADMAPS_DIR = path.resolve(
  __dirname,
  "../../../../additional used projects/developer-roadmap/roadmaps",
);

const OUTPUT_DATA_DIR = path.resolve(__dirname, "data");

// Metadata dictionary for top tracks
const TRACK_METADATA: Record<
  string,
  {
    title: string;
    description: string;
    category: "role" | "skill" | "best-practice";
    level: "Beginner" | "Intermediate" | "Advanced";
    iconName: string;
  }
> = {
  frontend: {
    title: "Frontend Developer",
    description:
      "Step by step guide to becoming a modern Frontend Developer in 2026",
    category: "role",
    level: "Beginner",
    iconName: "Layout",
  },
  backend: {
    title: "Backend Developer",
    description:
      "Step by step guide to becoming a modern Backend Developer in 2026",
    category: "role",
    level: "Beginner",
    iconName: "Server",
  },
  "full-stack": {
    title: "Full Stack Developer",
    description:
      "Step by step guide to mastering both frontend and backend development",
    category: "role",
    level: "Intermediate",
    iconName: "Layers",
  },
  "ai-engineer": {
    title: "AI & Prompt Engineer",
    description:
      "Comprehensive roadmap for LLMs, prompt engineering, agentic systems, and AI app development",
    category: "role",
    level: "Intermediate",
    iconName: "Cpu",
  },
  "ai-agents": {
    title: "AI Agents & Autonomous Systems",
    description:
      "Architecture, memory, tools, reasoning frameworks, and multi-agent coordination",
    category: "skill",
    level: "Advanced",
    iconName: "Bot",
  },
  react: {
    title: "React & Next.js Ecosystem",
    description:
      "Everything you need to master modern React 19, Server Components, and Next.js",
    category: "skill",
    level: "Intermediate",
    iconName: "Code2",
  },
  python: {
    title: "Python Developer",
    description:
      "Master Python programming from syntax fundamentals to async workflows and data systems",
    category: "skill",
    level: "Beginner",
    iconName: "Terminal",
  },
  devops: {
    title: "DevOps & Infrastructure",
    description:
      "CI/CD pipelines, containerization, cloud architectures, and site reliability engineering",
    category: "role",
    level: "Intermediate",
    iconName: "GitBranch",
  },
  docker: {
    title: "Docker & Containers",
    description:
      "Container basics, multi-stage Dockerfiles, compose setups, and container security",
    category: "skill",
    level: "Beginner",
    iconName: "Box",
  },
  kubernetes: {
    title: "Kubernetes & Orchestration",
    description:
      "Cluster architecture, pods, services, ingress, Helm charts, and cluster operations",
    category: "skill",
    level: "Advanced",
    iconName: "Network",
  },
  nodejs: {
    title: "Node.js & Runtime",
    description:
      "Event loop, streams, APIs, Express/Fastify, and microservices architecture",
    category: "skill",
    level: "Intermediate",
    iconName: "FileCode",
  },
  typescript: {
    title: "TypeScript Mastery",
    description:
      "Static typing, generics, utility types, module resolution, and type gymnastics",
    category: "skill",
    level: "Intermediate",
    iconName: "FileJson",
  },
  golang: {
    title: "Go (Golang) Developer",
    description:
      "High-concurrency systems, goroutines, channels, microservices, and gRPC in Go",
    category: "skill",
    level: "Intermediate",
    iconName: "Zap",
  },
  "cyber-security": {
    title: "Cyber Security Specialist",
    description:
      "Threat modeling, penetration testing, network defense, and OWASP security practices",
    category: "role",
    level: "Advanced",
    iconName: "ShieldCheck",
  },
  "prompt-engineering": {
    title: "Prompt Engineering & In-Context Learning",
    description:
      "Master prompt patterns, few-shot conditioning, CoT reasoning, and evaluation",
    category: "skill",
    level: "Beginner",
    iconName: "Sparkles",
  },
};

function parseTopicFile(
  filePath: string,
  fileName: string,
): RoadmapTopic | null {
  try {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const [slugPart, idWithExt] = fileName.split("@");
    const id = idWithExt ? idWithExt.replace(/\.md$/, "") : fileName;
    const slug = slugPart || fileName.replace(/\.md$/, "");

    const lines = rawContent.split(/\r?\n/);
    let title = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    let descLines: string[] = [];
    const resources: RoadmapResource[] = [];

    let isResourceSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        title = trimmed.replace(/^#\s+/, "").trim();
        continue;
      }

      if (
        trimmed.toLowerCase().includes("visit the following resources") ||
        trimmed.toLowerCase().includes("resources to learn more")
      ) {
        isResourceSection = true;
        continue;
      }

      if (isResourceSection || trimmed.startsWith("- [")) {
        // Resource line pattern: - [@type@Title](url) or - [Title](url)
        const resourceMatch = trimmed.match(
          /-\s*\[(?:@([a-zA-Z_-]+)@)?([^\]]+)\]\(([^)]+)\)/,
        );
        if (resourceMatch) {
          const typeRaw = (resourceMatch[1] || "article").toLowerCase();
          const validTypes: Array<"article" | "video" | "course" | "doc"> = [
            "article",
            "video",
            "course",
            "doc",
          ];
          const type = validTypes.includes(typeRaw as any)
            ? (typeRaw as "article" | "video" | "course" | "doc")
            : "article";

          resources.push({
            id: `${id}-res-${resources.length + 1}`,
            type,
            title: resourceMatch[2].trim(),
            url: resourceMatch[3].trim(),
          });
          continue;
        }
      }

      if (!isResourceSection && trimmed.length > 0) {
        descLines.push(trimmed);
      }
    }

    const description = descLines.join(" ").trim();

    return {
      id,
      slug,
      title,
      description:
        description ||
        `Comprehensive guide and learning curriculum for ${title}.`,
      resources,
    };
  } catch (err) {
    console.error(`Error parsing file ${filePath}:`, err);
    return null;
  }
}

export function buildRoadmapData() {
  if (!fs.existsSync(OUTPUT_DATA_DIR)) {
    fs.mkdirSync(OUTPUT_DATA_DIR, { recursive: true });
  }

  const summaries: RoadmapTrackSummary[] = [];

  const availableFolders = fs.existsSync(SOURCE_ROADMAPS_DIR)
    ? fs
        .readdirSync(SOURCE_ROADMAPS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : Object.keys(TRACK_METADATA);

  console.log(`Found ${availableFolders.length} roadmap tracks.`);

  for (const trackSlug of availableFolders) {
    const meta = TRACK_METADATA[trackSlug] || {
      title: trackSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      description: `Comprehensive learning curriculum and mastery roadmap for ${trackSlug}.`,
      category:
        trackSlug.includes("engineer") ||
        trackSlug.includes("developer") ||
        trackSlug.includes("analyst")
          ? "role"
          : "skill",
      level: "Intermediate",
      iconName: "Compass",
    };

    const contentDir = path.join(SOURCE_ROADMAPS_DIR, trackSlug, "content");
    const topicsMap: Record<string, RoadmapTopic> = {};
    const nodes: RoadmapNode[] = [];
    const edges: RoadmapEdge[] = [];

    if (fs.existsSync(contentDir)) {
      const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

      files.forEach((file, index) => {
        const topic = parseTopicFile(path.join(contentDir, file), file);
        if (topic) {
          topicsMap[topic.id] = topic;

          // Compute hierarchical column/row position for visual graph layout
          const col = index % 3;
          const row = Math.floor(index / 3);
          const x = 80 + col * 260;
          const y = 80 + row * 160;

          const level = row === 0 ? 1 : row < 3 ? 2 : row < 6 ? 3 : 4;

          nodes.push({
            id: `node-${topic.id}`,
            label: topic.title,
            topicId: topic.id,
            level,
            position: { x, y },
          });

          // Connect sequential topics with directional graph edges
          if (index > 0) {
            const prevNode = nodes[index - 1];
            edges.push({
              id: `edge-${prevNode.id}-${nodes[index].id}`,
              source: prevNode.id,
              target: nodes[index].id,
              animated: true,
            });
          }
        }
      });
    }

    const topicCount = Object.keys(topicsMap).length;
    const summary: RoadmapTrackSummary = {
      slug: trackSlug,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      level: meta.level,
      topicCount: topicCount || 10,
      iconName: meta.iconName,
    };

    summaries.push(summary);

    const detail: RoadmapDetail = {
      ...summary,
      nodes,
      edges,
      topics: topicsMap,
    };

    fs.writeFileSync(
      path.join(OUTPUT_DATA_DIR, `${trackSlug}.json`),
      JSON.stringify(detail, null, 2),
      "utf-8",
    );
  }

  // Save index summary
  fs.writeFileSync(
    path.join(OUTPUT_DATA_DIR, "index.json"),
    JSON.stringify(summaries, null, 2),
    "utf-8",
  );

  console.log(
    `Successfully built and wrote ${summaries.length} roadmaps into ${OUTPUT_DATA_DIR}`,
  );
}

if (require.main === module) {
  buildRoadmapData();
}
