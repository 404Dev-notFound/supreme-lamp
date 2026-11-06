const { prisma } = require("../lib/prisma");

/**
 * Enterprise Courses Service
 * Manages full-length engineering courses, modules, lessons, and enrollment.
 */

const COURSES_DATA = [
  {
    id: "course-dist-sys",
    slug: "distributed-systems-cloud-architecture",
    title: "Distributed Systems & Cloud Architecture Masterclass",
    description: "Master consensus protocols (Raft, Paxos), distributed event brokers, CQRS/event sourcing, idempotency keys, and zero-downtime database sharding.",
    instructor: "Elena Vance (Principal Infrastructure Architect)",
    level: "Advanced",
    durationHours: 36,
    lessonsCount: 24,
    enrolledCount: 1420,
    rating: 4.9,
    badge: "PREMIUM",
    isPremium: true,
    category: "Architecture & Infrastructure",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    modules: [
      {
        title: "Module 1: Foundations of Distributed Consistency",
        lessons: [
          { title: "CAP Theorem in Practice: CP vs AP Trade-offs", duration: "45m", type: "video" },
          { title: "Consensus Algorithms: The Raft Protocol Deep Dive", duration: "60m", type: "interactive" },
          { title: "Vector Clocks, Lamport Timestamps & Causal Ordering", duration: "40m", type: "reading" }
        ]
      },
      {
        title: "Module 2: High-Throughput Event Streaming",
        lessons: [
          { title: "Kafka Internals: Partitioning, Replication, and ISR", duration: "55m", type: "video" },
          { title: "Exactly-Once Semantics & Transactional Outbox Pattern", duration: "60m", type: "lab" }
        ]
      },
      {
        title: "Module 3: Database Sharding & Global Scale",
        lessons: [
          { title: "Consistent Hashing & Dynamic Ring Topologies", duration: "50m", type: "interactive" },
          { title: "Distributed Transactions: 2-Phase Commit vs Saga Orchestration", duration: "75m", type: "lab" }
        ]
      }
    ]
  },
  {
    id: "course-nextjs-ts",
    slug: "full-stack-nextjs-enterprise-typescript",
    title: "Production Next.js 16 & Enterprise TypeScript",
    description: "Build mission-critical web applications with Next.js Turbopack, React Server Components, server actions, streaming SSR, and edge authentication.",
    instructor: "Marcus Aurelius (Lead Frontend Systems)",
    level: "Intermediate to Advanced",
    durationHours: 28,
    lessonsCount: 18,
    enrolledCount: 2850,
    rating: 4.95,
    badge: "POPULAR",
    isPremium: true,
    category: "Full Stack & Web",
    thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    modules: [
      {
        title: "Module 1: Server Components Architecture",
        lessons: [
          { title: "Mental Model of React Server Components vs Client Island", duration: "45m", type: "video" },
          { title: "Streaming SSR with Suspense & Progressive Hydration", duration: "50m", type: "interactive" }
        ]
      },
      {
        title: "Module 2: State, Caching & Data Mutation",
        lessons: [
          { title: "Server Actions with Optimistic UI & Form State", duration: "50m", type: "lab" },
          { title: "Multi-tier Cache Invalidation in Next.js 16", duration: "40m", type: "video" }
        ]
      }
    ]
  },
  {
    id: "course-rag-ai",
    slug: "applied-ai-engineering-rag-systems",
    title: "Applied AI Engineering & Production RAG Systems",
    description: "Architect end-to-end Retrieval-Augmented Generation (RAG) applications using vector stores, hybrid BM25 + dense retrieval, semantic rerankers, and LangChain.",
    instructor: "Dr. K. Aris (AI Research Director)",
    level: "Intermediate",
    durationHours: 32,
    lessonsCount: 20,
    enrolledCount: 3120,
    rating: 4.88,
    badge: "HOT",
    isPremium: true,
    category: "Artificial Intelligence",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80",
    modules: [
      {
        title: "Module 1: Vector Embeddings & Similarity Math",
        lessons: [
          { title: "Cosine Similarity, Euclidean Distance & Dot Product Geometry", duration: "40m", type: "video" },
          { title: "HNSW vs IVF Indexing Trade-offs", duration: "50m", type: "reading" }
        ]
      },
      {
        title: "Module 2: Advanced Retrieval & Reranking",
        lessons: [
          { title: "Hybrid Search: BM25 Lexical + Dense Semantic Vectors", duration: "60m", type: "interactive" },
          { title: "Cross-Encoder Rerankers & Context Compression", duration: "55m", type: "lab" }
        ]
      }
    ]
  },
  {
    id: "course-go-perf",
    slug: "high-performance-backend-engineering-go",
    title: "High-Performance Systems & Backend Engineering in Go",
    description: "Write ultra-low-latency backend microservices with Go concurrency primitives, goroutine pools, zero-allocation serialization, and eBPF tracing.",
    instructor: "Alex Chen (Staff Systems Engineer)",
    level: "Advanced",
    durationHours: 26,
    lessonsCount: 16,
    enrolledCount: 1980,
    rating: 4.92,
    badge: "STAFF PICK",
    isPremium: true,
    category: "Backend & Systems",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    modules: [
      {
        title: "Module 1: Concurrency Primitives & Memory",
        lessons: [
          { title: "Channels, Mutexes, and Atomic Memory Primitives", duration: "50m", type: "video" },
          { title: "Preventing Goroutine Leaks & Deadlocks Under Load", duration: "60m", type: "lab" }
        ]
      }
    ]
  }
];

class CoursesService {
  async listCourses({ category, level, search } = {}) {
    let list = COURSES_DATA;
    if (category && category !== "all") {
      list = list.filter(c => c.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (level && level !== "all") {
      list = list.filter(c => c.level.toLowerCase().includes(level.toLowerCase()));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getCourseBySlug(slug) {
    return COURSES_DATA.find(c => c.slug === slug) || null;
  }
}

const coursesService = new CoursesService();

module.exports = { coursesService, COURSES_DATA };

