/**
 * Seed comprehensive premium roadmaps (including System Design) into PostgreSQL.
 * Usage: node scripts/seed_premium_roadmaps.js
 */

const path = require('path');
const { PrismaPg } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'adapter-pg'));
const { Pool } = require('pg');
const { PrismaClient } = require(path.resolve(__dirname, '..', 'node_modules', '@prisma', 'client'));

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ['warn', 'error'] });

const ROADMAPS = [
  {
    slug: 'system-design-architecture',
    title: 'Large-Scale System Design & Scalable Architecture',
    description: 'Master the 4-step interview framework, distributed scaling, consistent hashing, caching strategies, CAP theorem, and modern microservice topologies.',
    categorySlug: 'system-design',
    level: 'Advanced',
    badge: 'PREMIUM',
    iconName: 'Layers',
    estimatedHours: 45,
    topicsCount: 18,
    isPinned: false,
    content: {
      overview: 'End-to-end curriculum based on real-world large-scale engineering and the System Design Primer. Learn to design fault-tolerant, high-throughput web architectures handling millions of requests per second.',
      prerequisites: ['Computer Networking (TCP/IP, HTTP)', 'Basic Relational Database Concepts', 'Operating Systems Virtual Memory & Concurrency'],
      modules: [
        {
          id: 'mod-sd-1',
          title: 'System Design Interview Framework & Estimation',
          description: 'Step-by-step 4-tier design methodology and back-of-the-envelope capacity calculations.',
          topics: [
            {
              id: 'top-sd-framework',
              title: '4-Step System Design Method',
              summary: '1) Scope use cases & constraints, 2) High-level design diagram, 3) Core component design, 4) Scale and bottleneck mitigation.',
              resources: [
                { id: 'res-sd-primer', title: 'System Design Primer Interview Guide', url: 'https://github.com/donnemartin/system-design-primer', type: 'github' }
              ]
            },
            {
              id: 'top-bote-calc',
              title: 'Back-of-the-Envelope Capacity Estimations',
              summary: 'Estimating QPS, peak throughput, storage volume over 5 years, memory caching tier sizing, and network bandwidth.',
              resources: [
                { id: 'res-bote', title: 'Latency Numbers Every Programmer Should Know', url: 'https://people.eecs.berkeley.edu/~rcs/research/interactive_latency.html', type: 'guide' }
              ]
            }
          ]
        },
        {
          id: 'mod-sd-2',
          title: 'Core Infrastructure: Load Balancers, Reverse Proxies & CDN',
          description: 'Routing ingress traffic, edge acceleration, TLS termination, and health checks.',
          topics: [
            {
              id: 'top-lb-proxy',
              title: 'Load Balancing & Reverse Proxies (L4 vs L7)',
              summary: 'DNS round-robin, HAProxy, NGINX, Envoy, consistent hashing load balancing, sticky sessions vs stateless tokens.',
              resources: [
                { id: 'res-lb-docs', title: 'Load Balancing Algorithms & Health Checks', url: 'https://www.nginx.com/resources/glossary/load-balancing/', type: 'docs' }
              ]
            },
            {
              id: 'top-cdn',
              title: 'Content Delivery Networks (CDN) & Anycast',
              summary: 'Edge caching, push vs pull CDNs, cache invalidation strategies, and Cloudflare/Fastly Anycast routing.',
              resources: [
                { id: 'res-cdn-guide', title: 'How CDNs Work - Cloudflare Learning Center', url: 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/', type: 'guide' }
              ]
            }
          ]
        },
        {
          id: 'mod-sd-3',
          title: 'High-Performance Caching & In-Memory Architectures',
          description: 'Cache eviction algorithms, cache-aside, write-through, write-behind, and cache stampede prevention.',
          topics: [
            {
              id: 'top-caching-patterns',
              title: 'Caching Strategies: Cache-Aside vs Write-Through',
              summary: 'Read-through, write-through, write-behind, and cache-aside patterns. Mitigating cache penetration, cache breakdown, and cache avalanche.',
              resources: [
                { id: 'res-redis-cache', title: 'Redis Caching Topologies and Patterns', url: 'https://redis.io/docs/latest/develop/use-cases/caching/', type: 'docs' }
              ]
            },
            {
              id: 'top-eviction',
              title: 'Cache Eviction & Expiration Policies',
              summary: 'LRU, LFU, FIFO, volatile-lru, and memory limits in distributed cache clusters.',
              resources: [
                { id: 'res-redis-evict', title: 'Using Redis as an LRU Cache', url: 'https://redis.io/docs/latest/develop/reference/eviction/', type: 'docs' }
              ]
            }
          ]
        },
        {
          id: 'mod-sd-4',
          title: 'Distributed Storage: Relational, NoSQL & Sharding',
          description: 'Data replication, master-replica, sharding, federation, and ACID vs BASE paradigms.',
          topics: [
            {
              id: 'top-sharding',
              title: 'Database Sharding, Partitioning & Federation',
              summary: 'Horizontal vs vertical partitioning, shard key selection, re-sharding challenges, and cross-shard join avoidance.',
              resources: [
                { id: 'res-sharding-guide', title: 'Database Sharding Concepts & Architecture', url: 'https://aws.amazon.com/what-is/database-sharding/', type: 'article' }
              ]
            },
            {
              id: 'top-nosql-taxonomy',
              title: 'NoSQL Database Taxonomy (Key-Value, Document, Column, Graph)',
              summary: 'When to choose Cassandra (wide-column), MongoDB (document), DynamoDB (key-value), or Neo4j (graph).',
              resources: [
                { id: 'res-ddia', title: 'Designing Data-Intensive Applications: Chapter 3', url: 'https://dataintensive.net/', type: 'book' }
              ]
            }
          ]
        },
        {
          id: 'mod-sd-5',
          title: 'Asynchronous Processing & Message Brokers',
          description: 'Decoupling services with message queues, event streaming, backpressure, and idempotency.',
          topics: [
            {
              id: 'top-message-queues',
              title: 'Message Queues vs Event Streams (RabbitMQ vs Kafka)',
              summary: 'Point-to-point queues vs distributed append-only logs. Consumer groups, offset tracking, partitions, and replayability.',
              resources: [
                { id: 'res-kafka-intro', title: 'Apache Kafka Architecture & Fundamentals', url: 'https://kafka.apache.org/documentation/', type: 'docs' }
              ]
            },
            {
              id: 'top-idempotent-consumer',
              title: 'Idempotent Consumer & Deduplication',
              summary: 'Guaranteed at-least-once delivery handling, unique message deduplication keys, distributed locks, and database transactions.',
              resources: [
                { id: 'res-enterprise-patterns', title: 'Enterprise Integration Patterns - Idempotent Receiver', url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html', type: 'guide' }
              ]
            }
          ]
        },
        {
          id: 'mod-sd-6',
          title: 'Real-World Architectures: Pastebin, Twitter & Web Crawler',
          description: 'Complete end-to-end case studies for interview-ready system designs.',
          topics: [
            {
              id: 'top-pastebin-design',
              title: 'Design Pastebin / URL Shortener (TinyURL)',
              summary: 'Base62 encoding vs MD5 hash truncation, Key Generation Service (KGS), analytics counter caching, read-heavy optimizations.',
              resources: [
                { id: 'res-tinyurl-design', title: 'TinyURL System Design Deep Dive', url: 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md', type: 'solution' }
              ]
            },
            {
              id: 'top-twitter-feed',
              title: 'Design Twitter Timeline & Social Feed',
              summary: 'Fan-out on write (push) vs Fan-out on read (pull), celebrity user edge-case handling, Redis list feed caching.',
              resources: [
                { id: 'res-twitter-design', title: 'Twitter Timeline Architecture & Fanout', url: 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md', type: 'solution' }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    slug: 'llm-engineering-rag-systems',
    title: 'Production LLM Engineering & Advanced RAG Systems',
    description: 'Build enterprise Retrieval-Augmented Generation with LangChain, hybrid vector search, chunking hierarchies, and reranking pipelines.',
    categorySlug: 'ai',
    level: 'Advanced',
    badge: 'PREMIUM',
    iconName: 'BrainCircuit',
    estimatedHours: 40,
    topicsCount: 16,
    isPinned: false,
    content: {
      overview: 'Complete engineering guide to deploying reliable LLM agents, vector databases, hybrid BM25 + dense semantic retrieval, and self-correcting RAG workflows.',
      prerequisites: ['Python / TypeScript', 'Linear Algebra / Embeddings Basics', 'REST APIs'],
      modules: [
        {
          id: 'mod-rag-1',
          title: 'Vector Embeddings & Indexing Strategies',
          description: 'Dense vector representations, distance metrics (Cosine, Dot Product), and HNSW graph indexing.',
          topics: [
            { id: 'top-hnsw', title: 'Hierarchical Navigable Small World (HNSW) Graphs', summary: 'Approximate Nearest Neighbor (ANN) search algorithms powering modern vector search engines.', resources: [] },
            { id: 'top-chunking', title: 'Semantic Chunking & Parent-Document Retrieval', summary: 'Sliding window, document structure preservation, and small-to-big retrieval strategies.', resources: [] }
          ]
        },
        {
          id: 'mod-rag-2',
          title: 'Hybrid Retrieval & Cross-Encoder Reranking',
          description: 'Combining keyword search with dense semantic retrieval and cross-encoder precision.',
          topics: [
            { id: 'top-hybrid-search', title: 'BM25 + Dense Semantic Fusion (RRF)', summary: 'Reciprocal Rank Fusion algorithms to combine sparse keyword tokens with neural embeddings.', resources: [] },
            { id: 'top-rerankers', title: 'Cross-Encoder Re-Ranking Models (Cohere, BGE)', summary: 'Second-stage ranking of retrieved context to eliminate hallucination in downstream prompts.', resources: [] }
          ]
        }
      ]
    }
  },
  {
    slug: 'cloud-native-kubernetes-gitops',
    title: 'Cloud-Native Kubernetes, Service Mesh & GitOps',
    description: 'Production cluster architecture, Istio service mesh, Cilium eBPF CNI, ArgoCD declarative GitOps, and zero-downtime Canary rollouts.',
    categorySlug: 'devops',
    level: 'Advanced',
    badge: 'PREMIUM',
    iconName: 'Cpu',
    estimatedHours: 35,
    topicsCount: 14,
    isPinned: false,
    content: {
      overview: 'Deep architectural dive into production Kubernetes cluster management, custom controllers, eBPF networking, and automated GitOps workflows.',
      prerequisites: ['Docker Containerization', 'Linux Networking Basics', 'YAML / declarative manifests'],
      modules: [
        {
          id: 'mod-k8s-1',
          title: 'Control Plane Internals & etcd Quorum',
          description: 'API Server, Controller Manager, Kube-Scheduler, and high-availability etcd clustering.',
          topics: [
            { id: 'top-etcd-quorum', title: 'etcd Distributed Consensus in Kubernetes', summary: 'Raft consensus guarantees, revision compaction, and snapshotting in multi-master clusters.', resources: [] }
          ]
        }
      ]
    }
  }
];

async function seed() {
  console.log('--- Seeding Premium Roadmaps ---');
  for (const r of ROADMAPS) {
    await prisma.premiumResource.upsert({
      where: { slug: r.slug },
      update: {
        title: r.title,
        description: r.description,
        categorySlug: r.categorySlug,
        level: r.level,
        badge: r.badge,
        iconName: r.iconName,
        estimatedHours: r.estimatedHours,
        topicsCount: r.topicsCount,
        content: r.content,
        isActive: true,
        isPinned: false,
      },
      create: {
        slug: r.slug,
        title: r.title,
        description: r.description,
        categorySlug: r.categorySlug,
        accessLevel: 'PREMIUM',
        level: r.level,
        badge: r.badge,
        iconName: r.iconName,
        estimatedHours: r.estimatedHours,
        topicsCount: r.topicsCount,
        content: r.content,
        isActive: true,
        isPinned: false,
      }
    });
    console.log(`Seeded premium roadmap: ${r.slug} (${r.title})`);
  }
  console.log('--- Finished Seeding Premium Roadmaps ---');
}

seed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

