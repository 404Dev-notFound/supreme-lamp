import { NextResponse } from "next/server";

const OPPORTUNITY_DATA = [
  {
    id: "job-1",
    title: "Senior Full Stack Engineer",
    company: {
      name: "Stripe",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "San Francisco, CA",
    workMode: "Remote",
    industry: "Fintech",
    experience: "3+ years",
    matchPercent: 94,
    matchedSkills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js"],
    missingSkills: ["Kafka", "GraphQL"],
    salary: "$160k - $210k",
    role: "Full Stack",
    createdAt: "2026-03-10",
  },
  {
    id: "job-2",
    title: "AI & Platform Systems Architect",
    company: {
      name: "Anthropic",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "San Francisco, CA",
    workMode: "Hybrid",
    industry: "Artificial Intelligence",
    experience: "4+ years",
    matchPercent: 88,
    matchedSkills: ["Python", "FastAPI", "PostgreSQL", "Docker", "RAG"],
    missingSkills: ["Kubernetes", "Vector Databases"],
    salary: "$190k - $250k",
    role: "AI Engineer",
    createdAt: "2026-03-15",
  },
  {
    id: "job-3",
    title: "Frontend Engineer (UI/UX Systems)",
    company: {
      name: "Vercel",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "New York, NY",
    workMode: "Remote",
    industry: "Developer Tools",
    experience: "2+ years",
    matchPercent: 92,
    matchedSkills: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Three.js"],
    missingSkills: ["WebAssembly"],
    salary: "$140k - $185k",
    role: "Frontend",
    createdAt: "2026-03-18",
  },
  {
    id: "job-4",
    title: "Backend Core Infrastructure Engineer",
    company: {
      name: "Linear",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "San Francisco, CA",
    workMode: "Remote",
    industry: "Productivity",
    experience: "3+ years",
    matchPercent: 86,
    matchedSkills: ["Node.js", "Express", "PostgreSQL", "Prisma", "Redis"],
    missingSkills: ["Go", "Distributed Tracing"],
    salary: "$155k - $205k",
    role: "Backend",
    createdAt: "2026-03-20",
  },
  {
    id: "job-5",
    title: "DevOps & Cloud Reliability Engineer",
    company: {
      name: "Datadog",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "Austin, TX",
    workMode: "Hybrid",
    industry: "Observability",
    experience: "3+ years",
    matchPercent: 82,
    matchedSkills: ["Docker", "Linux", "CI/CD", "OpenTelemetry"],
    missingSkills: ["Terraform", "Kubernetes"],
    salary: "$150k - $195k",
    role: "DevOps",
    createdAt: "2026-03-22",
  },
  {
    id: "job-6",
    title: "Machine Learning Research Engineer",
    company: {
      name: "OpenAI",
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60",
    },
    location: "San Francisco, CA",
    workMode: "On-site",
    industry: "Artificial Intelligence",
    experience: "5+ years",
    matchPercent: 79,
    matchedSkills: ["Python", "PyTorch", "Evaluation Systems"],
    missingSkills: ["CUDA Optimization", "Triton"],
    salary: "$210k - $310k",
    role: "ML Engineer",
    createdAt: "2026-03-25",
  },
];

/**
 * GET /api/job-matcher
 * Query Parameters:
 *   - role: filter by job role
 *   - industry: filter by industry
 *   - location: filter by location keyword
 *   - workMode: "Remote" | "Hybrid" | "On-site"
 *   - sort: "best" | "readiness" | "latest"
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "").toLowerCase().trim();
    const industry = (searchParams.get("industry") || "").toLowerCase().trim();
    const location = (searchParams.get("location") || "").toLowerCase().trim();
    const workMode = (searchParams.get("workMode") || "").toLowerCase().trim();
    const sort = searchParams.get("sort") || "best";

    let results = OPPORTUNITY_DATA.filter((job) => {
      if (role && !job.role.toLowerCase().includes(role) && !job.title.toLowerCase().includes(role)) {
        return false;
      }
      if (industry && !job.industry.toLowerCase().includes(industry)) {
        return false;
      }
      if (location && !job.location.toLowerCase().includes(location)) {
        return false;
      }
      if (workMode && job.workMode.toLowerCase() !== workMode) {
        return false;
      }
      return true;
    });

    if (sort === "readiness" || sort === "best") {
      results.sort((a, b) => b.matchPercent - a.matchPercent);
    } else if (sort === "latest") {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const response = NextResponse.json(results);
    response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
    return response;
  } catch (error) {
    console.error("[JobMatcher API Error]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve matched opportunities." },
      { status: 500 },
    );
  }
}
