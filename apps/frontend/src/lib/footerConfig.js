/**
 * flowCTRL Ecosystem & Footer Configuration
 * Single source of truth for navigation, ecosystem products, legal documents,
 * and integrated technologies/resources across the platform.
 */

export const APP_VERSION = "1.6.0";
export const COPYRIGHT_NOTICE = "© 2026 flowCTRL Inc. All rights reserved.";

export const DEVELOPER_INFO = {
  name: "Scripted by Dev",
  email: "scriptedbydev@gmail.com",
  mailto: "mailto:scriptedbydev@gmail.com",
};

/**
 * flowCTRL Ecosystem Products
 */
export const ECOSYSTEM_PRODUCTS = [
  {
    name: "flowCTRL",
    shortName: "fC",
    tagline: "The Career Operating System",
    description:
      "Identify skill gaps, explore 90+ dev roadmaps, and land your dream engineering role.",
    href: "/",
    isExternal: false,
    badge: "Core Platform",
    officialUrl: "https://flowctrl.dev",
  },
  {
    name: "CodeCollab",
    shortName: "CC",
    tagline: "Collaborative Open-Source Development Platform",
    description:
      "Multi-language project matchmaking, trie search, and team collaboration workspace.",
    href: "https://opensource-projects.netlify.app",
    isExternal: true,
    badge: "Ecosystem Partner",
    officialUrl: "https://opensource-projects.netlify.app",
    repoUrl: "https://github.com/404Dev-notFound/jubilant-octo-potato",
  },
  {
    name: "ATS Resume Analysis",
    shortName: "ATS",
    tagline: "Automated Resume Screener & ATS Parser",
    description:
      "Evaluate your resume against top industry filters and receive real-time match scoring.",
    href: "/resume-screener",
    isExternal: false,
    badge: "Production App",
    officialUrl: "https://ats-resume-analysis.netlify.app",
  },
  {
    name: "Mental Health Score",
    shortName: "MHS",
    tagline: "Developer Wellbeing & Mental Fitness Check",
    description:
      "Fluffy Spoon wellbeing assessment model tailored for high-focus engineering teams.",
    href: "https://fluffy-spoon-score.vercel.app",
    isExternal: true,
    badge: "Wellbeing AI",
    officialUrl: "https://fluffy-spoon-score.vercel.app",
  },
  {
    name: "Interactive Dev Roadmaps",
    shortName: "RDM",
    tagline: "90+ Career Roles & Framework Learning Graphs",
    description:
      "Comprehensive visual learning paths across Frontend, Backend, AI, and DevOps.",
    href: "/roadmaps",
    isExternal: false,
    badge: "90+ Tracks",
    officialUrl: "https://roadmap.sh",
  },
];

/**
 * Legal & Governance Links
 */
export const LEGAL_LINKS = [
  {
    title: "Terms & Conditions",
    label: "Platform Terms & Conditions",
    href: "https://opensource-projects.netlify.app/#terms",
    isExternal: true,
    description:
      "General terms of service, acceptable use, and member responsibilities.",
  },
  {
    title: "Privacy Policy",
    label: "Privacy Policy",
    href: "https://opensource-projects.netlify.app/#privacy",
    isExternal: true,
    description:
      "Zero-email exposure architecture, cryptographic tokens, and data protection.",
  },
  {
    title: "CodeCollab Terms & Conditions",
    label: "CodeCollab Terms & Conditions",
    href: "https://opensource-projects.netlify.app/#terms",
    isExternal: true,
    description:
      "Project registration, licensing, and collaborative workspace governance.",
  },
  {
    title: "flowCTRL Terms & Conditions",
    label: "flowCTRL Terms & Conditions",
    href: "https://opensource-projects.netlify.app/#terms",
    isExternal: true,
    description:
      "Career intelligence, roadmap services, and subscription terms.",
  },
  {
    title: "404 Community Collaboration Agreement",
    label: "404 Community / Project Collaboration Agreement",
    href: "https://opensource-projects.netlify.app/#terms",
    isExternal: true,
    description:
      "Open-source collaboration terms, code of conduct, and contribution guidelines.",
  },
  {
    title: "Security & Responsible Disclosure",
    label: "Security & Responsible Disclosure",
    href: "https://opensource-projects.netlify.app/#security",
    isExternal: true,
    description:
      "Security architecture, vulnerability reporting procedures, and audit logs.",
  },
  {
    title: "Cookie & Data Policy",
    label: "Cookie & Data Retention Standards",
    href: "https://opensource-projects.netlify.app/#privacy",
    isExternal: true,
    description:
      "Session cookies, SameSite restrictions, and local storage standards.",
  },
  {
    title: "Platform Disclaimer",
    label: "Platform Disclaimer",
    href: "https://opensource-projects.netlify.app/#terms",
    isExternal: true,
    description:
      "Service warranties, availability statements, and third-party disclaimers.",
  },
];

/**
 * Core Product & Navigation Links
 */
export const PRODUCT_LINKS = [
  { label: "Interactive Dev Roadmaps", href: "/roadmaps", isExternal: false },
  { label: "Skill Gap Analyzer", href: "/#features", isExternal: false },
  { label: "ATS Resume Checker", href: "/resume-screener", isExternal: false },
  { label: "1-on-1 Mentorship", href: "/#features", isExternal: false },
  { label: "Portfolio Builder", href: "/#features", isExternal: false },
  { label: "Job Matcher", href: "/#features", isExternal: false },
  { label: "Pricing & Plans", href: "/#pricing", isExternal: false },
];

/**
 * Social & Community Links
 */
export const SOCIAL_LINKS = [
  {
    name: "GitHub",
    href: "https://github.com",
    handle: "github.com",
    isExternal: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com",
    handle: "linkedin.com",
    isExternal: true,
  },
  {
    name: "X (Twitter)",
    href: "https://x.com",
    handle: "@flowctrl",
    isExternal: true,
  },
  {
    name: "Discord",
    href: "https://discord.com",
    handle: "flowCTRL Community",
    isExternal: true,
  },
];

/**
 * Categorized Resources / Technologies / External Services Used
 * Exactly matches all items documented in `aaps link and name.txt`
 */
export const RESOURCE_CATEGORIES = [
  {
    id: "product-ecosystem",
    name: "Product & Ecosystem",
    description:
      "Core applications, sub-products, and companion tools within the flowCTRL suite",
    items: [
      {
        name: "FlowCTRL",
        url: "https://flowctrl.dev",
        description:
          "Main Career Operating System platform and intelligence hub.",
      },
      {
        name: "CodeCollab",
        url: "https://opensource-projects.netlify.app",
        description:
          "Open-source engineering and collaborative project platform.",
      },
      {
        name: "ATS Resume Analysis (Resume Screener)",
        url: "https://ats-resume-analysis.netlify.app",
        description: "Resume parsing and keyword optimization service.",
      },
      {
        name: "Mental Health Score (Fluffy Spoon)",
        url: "https://fluffy-spoon-score.vercel.app",
        description: "Developer mental wellness scoring and wellness guidance.",
      },
    ],
  },
  {
    id: "ai-intelligence",
    name: "AI & Developer Intelligence",
    description: "Large language models, reasoning engines, and AI code agents",
    items: [
      {
        name: "OpenAI",
        url: "https://openai.com",
        description: "Generative AI APIs, GPT models, and semantic embeddings.",
      },
      {
        name: "Anthropic Claude",
        url: "https://www.anthropic.com",
        description:
          "Advanced cognitive reasoning and contextual analysis models.",
      },
      {
        name: "Google Gemini",
        url: "https://gemini.google.com",
        description: "Multimodal AI models and developer inference services.",
      },
      {
        name: "Xiaomi MiMo AI",
        url: "https://api.xiaomimimo.com",
        description:
          "Specialized language intelligence and conversational services.",
      },
      {
        name: "OpenCode AI",
        url: "https://opencode.ai",
        description:
          "Developer agent automation and autonomous coding platform.",
      },
    ],
  },
  {
    id: "frameworks-frontend",
    name: "Development & Frameworks",
    description:
      "Frontend libraries, build tooling, and client-side rendering engines",
    items: [
      {
        name: "Next.js",
        url: "https://nextjs.org",
        description:
          "React application framework with Turbopack and Server Components.",
      },
      {
        name: "Turborepo / Turbopack",
        url: "https://turbo.build",
        description:
          "High-performance monorepo build system and incremental bundler.",
      },
      {
        name: "Tailwind CSS",
        url: "https://tailwindcss.com",
        description:
          "Utility-first CSS styling framework powering modern UI systems.",
      },
      {
        name: "Three.js",
        url: "https://threejs.org",
        description:
          "WebGL 3D graphics library for interactive canvas rendering.",
      },
      {
        name: "Framer Motion",
        url: "https://www.framer.com/motion",
        description:
          "Production-ready motion library for fluid React animations.",
      },
      {
        name: "React Flow",
        url: "https://reactflow.dev",
        description:
          "Customizable node-based interactive workflow and graph UI.",
      },
      {
        name: "Lucide Icons",
        url: "https://lucide.dev",
        description:
          "Clean, consistent, and accessible open-source iconography.",
      },
    ],
  },
  {
    id: "database-infra",
    name: "Database & Infrastructure",
    description:
      "Relational persistence, container orchestration, and schema management",
    items: [
      {
        name: "PostgreSQL",
        url: "https://www.postgresql.org",
        description:
          "Authoritative relational database for secure, relational persistence.",
      },
      {
        name: "Prisma",
        url: "https://www.prisma.io",
        description:
          "Next-generation ORM for Node.js and TypeScript data modeling.",
      },
      {
        name: "Docker Hub",
        url: "https://hub.docker.com",
        description:
          "Container registry and verified base images for deployment.",
      },
      {
        name: "Adminer",
        url: "https://www.adminer.org",
        description: "Lightweight database management web interface.",
      },
    ],
  },
  {
    id: "observability-telemetry",
    name: "Observability & Telemetry",
    description:
      "Distributed tracing, performance metrics, and application health monitoring",
    items: [
      {
        name: "OpenTelemetry",
        url: "https://opentelemetry.io",
        description:
          "Vendor-agnostic telemetry framework for traces and metrics.",
      },
      {
        name: "Jaeger Tracing",
        url: "https://www.jaegertracing.io",
        description:
          "End-to-end distributed tracing for transaction troubleshooting.",
      },
      {
        name: "Prometheus",
        url: "https://prometheus.io",
        description: "Time-series monitoring and real-time alerting service.",
      },
      {
        name: "Datadog",
        url: "https://www.datadoghq.com",
        description:
          "Cloud-scale application performance monitoring and log analysis.",
      },
    ],
  },
  {
    id: "auth-cloud",
    name: "Authentication & Cloud",
    description:
      "Identity providers, payment processing, and corporate integration gateways",
    items: [
      {
        name: "Google Identity / OAuth",
        url: "https://accounts.google.com",
        description:
          "Single sign-on and federated Google identity authentication.",
      },
      {
        name: "Google Cloud Console",
        url: "https://console.cloud.google.com",
        description:
          "Cloud project governance, API credentials, and client scopes.",
      },
      {
        name: "NextAuth.js",
        url: "https://next-auth.js.org",
        description:
          "Flexible authentication library for Next.js applications.",
      },
      {
        name: "Stripe",
        url: "https://stripe.com",
        description: "Financial infrastructure and secure payment processing.",
      },
      {
        name: "Feishu / Lark Open Platform",
        url: "https://open.feishu.cn",
        description:
          "Enterprise collaboration, webhook notifications, and bot integrations.",
      },
    ],
  },
  {
    id: "deployment-hosting",
    name: "Deployment & Hosting",
    description:
      "Edge delivery networks, static artifact CDNs, and package registries",
    items: [
      {
        name: "Vercel",
        url: "https://vercel.com",
        description:
          "Global edge hosting platform and Next.js production runtime.",
      },
      {
        name: "Netlify",
        url: "https://www.netlify.com",
        description:
          "Cloud deployment and edge networking for modern web applications.",
      },
      {
        name: "npm Registry",
        url: "https://registry.npmjs.org",
        description:
          "Authoritative package registry for JavaScript and Node.js ecosystems.",
      },
      {
        name: "Tencent Cloud Mirrors",
        url: "https://mirrors.tencent.com",
        description:
          "High-speed mirrors for accelerated package dependency fetching.",
      },
    ],
  },
  {
    id: "jobs-career",
    name: "Jobs, Career & Learning",
    description:
      "Hiring platforms, recruitment ATS systems, and learning roadmaps",
    items: [
      {
        name: "roadmap.sh",
        url: "https://roadmap.sh",
        description:
          "Community-driven visual developer roadmaps and educational guides.",
      },
      {
        name: "Nowcoder",
        url: "https://www.nowcoder.com",
        description:
          "Technical interview preparation and coding practice platform.",
      },
      {
        name: "Zhiye (Beisen ATS)",
        url: "https://www.zhiye.com",
        description:
          "Enterprise talent management and applicant tracking system.",
      },
      {
        name: "Hotjob (Dayee ATS)",
        url: "https://www.hotjob.cn",
        description:
          "Campus recruitment and applicant tracking pipeline solution.",
      },
      {
        name: "Tupu360 ATS",
        url: "https://www.tupu360.com",
        description:
          "Recruitment management software and candidate profile aggregator.",
      },
    ],
  },
  {
    id: "social-community",
    name: "Social & Community",
    description:
      "Developer networks, podcast distribution, and engineering forums",
    items: [
      {
        name: "GitHub",
        url: "https://github.com",
        description:
          "Source code repository, issue tracking, and developer ecosystem.",
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com",
        description: "Professional networking and talent marketplace.",
      },
      {
        name: "X (Twitter)",
        url: "https://x.com",
        description:
          "Real-time tech announcements, dev relations, and community updates.",
      },
      {
        name: "Discord",
        url: "https://discord.com",
        description:
          "Voice, video, and text communication for developer guilds.",
      },
      {
        name: "Xiaohongshu (RED)",
        url: "https://www.xiaohongshu.com",
        description: "Lifestyle and career sharing community content channels.",
      },
      {
        name: "Apple Podcasts",
        url: "https://podcasts.apple.com",
        description: "Tech audio talks and engineering interview broadcasts.",
      },
      {
        name: "Xiaoyuzhou FM",
        url: "https://www.xiaoyuzhoufm.com",
        description:
          "Curated podcast platform focused on technology and career insights.",
      },
    ],
  },
  {
    id: "utilities-apis",
    name: "Utilities, Tooling & APIs",
    description:
      "Search binaries, design assets, monetization tooling, and public web APIs",
    items: [
      {
        name: "ripgrep",
        url: "https://github.com/BurntSushi/ripgrep",
        description:
          "Ultra-fast line-oriented regex search tool for deep codebases.",
      },
      {
        name: "fd",
        url: "https://github.com/sharkdp/fd",
        description: "Fast, user-friendly CLI alternative to find command.",
      },
      {
        name: "Linear",
        url: "https://linear.app",
        description:
          "Issue tracking, sprint planning, and engineering project management.",
      },
      {
        name: "Polar",
        url: "https://polar.sh",
        description:
          "Creator monetization and open-source sponsorship platform.",
      },
      {
        name: "Web Scraping Dev API",
        url: "https://api.web-scraping.dev",
        description:
          "Developer-focused headless scraping and web proxy pipeline.",
      },
      {
        name: "Unsplash",
        url: "https://images.unsplash.com",
        description:
          "High-resolution curated imagery and photographic media CDN.",
      },
      {
        name: "Unpkg",
        url: "https://unpkg.com",
        description:
          "Fast, global content delivery network for all npm packages.",
      },
      {
        name: "Google Fonts",
        url: "https://fonts.google.com",
        description:
          "Typography catalog delivering Inter, Outfit, and Geist font faces.",
      },
      {
        name: "Placehold.co",
        url: "https://placehold.co",
        description: "Lightweight placeholder image generation service.",
      },
    ],
  },
];
