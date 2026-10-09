/**
 * FlowCTRL Ecosystem — Five Core Projects Data Model
 * Exactly 5 projects: FlowCTRL (Central Hub), CodeCollab, JudgeX, Mental Health Score, Resume Screener.
 */

export const ECOSYSTEM_PROJECTS = [
  {
    id: "flowctrl",
    name: "FlowCTRL",
    isCenter: true,
    role: "Main Central Platform",
    tagline: "Control over your career.",
    coreStatement: "Bridge the gap between skills and opportunities.",
    accentColor: "#f97316", // Warm Tangerine / Pumpkin
    accentGlow: "rgba(249, 115, 22, 0.4)",
    badge: "Central Hub",
    shortDescription:
      "A career development platform designed to help users take control of their professional growth.",
    purpose:
      "FlowCTRL brings career planning, learning paths, skill development, career preparation, and progress tracking together. It is intended to help users understand their current skills, identify areas for improvement, follow structured learning paths, and work toward their career goals.",
    features: [
      "Structured, interactive dev roadmaps spanning 90+ engineering career tracks",
      "Prerequisite-aware skill gap identification and role benchmark delta analysis",
      "Career preparation uniting coding practice, project collaboration, and resume readiness",
      "Comprehensive progress dashboard tracking milestones, readiness scores, and learning momentum",
    ],
    website: "https://flowctrl.dev/",
    repository: null,
    coordinates: { x: 550, y: 380 },
  },
  {
    id: "codecollab",
    name: "CodeCollab",
    isCenter: false,
    position: "left",
    role: "Developer Collaboration Platform",
    tagline: "Collaborative Open-Source Development",
    accentColor: "#a855f7", // Purple / Violet
    accentGlow: "rgba(168, 85, 247, 0.4)",
    badge: "Collaboration",
    shortDescription:
      "A platform for developer collaboration and practical project experience.",
    purpose:
      "CodeCollab is designed to help developers collaborate on projects, explore development opportunities, and gain practical experience by working with other developers. It emphasizes collaboration, project development, community participation, and practical skill building.",
    features: [
      "Multi-language project matchmaking for developers across diverse experience levels",
      "Trie-based search algorithm for rapid filtering across technical stacks and open issues",
      "Real-time team workspaces and collaboration channels for collective problem solving",
      "Practical project execution that builds demonstrable portfolio proof and GitHub experience",
    ],
    website: null,
    repository: "https://github.com/404Dev-notFound/jubilant-octo-potato",
    coordinates: { x: 150, y: 380 },
    connectionLabel: "Career Development & Practical Experience",
    connectionShort: "Practical Experience",
  },
  {
    id: "judgex",
    name: "JudgeX",
    isCenter: false,
    position: "right",
    role: "Coding Practice Platform",
    tagline: "Problem-Solving & Technical Practice",
    accentColor: "#06b6d4", // Cyan / Electric Blue
    accentGlow: "rgba(6, 182, 212, 0.4)",
    badge: "Coding Practice",
    shortDescription:
      "An online coding practice and problem-solving platform.",
    purpose:
      "JudgeX enables users to practise programming questions, improve logical thinking, strengthen data structures and algorithms knowledge, and develop their problem-solving skills. It serves as a dedicated platform for coding challenges, programming practice, and technical skill development.",
    features: [
      "Extensive library of programming questions and algorithmic coding challenges",
      "Logical problem-solving practice reinforcing foundational and advanced computer science concepts",
      "Instant code evaluation environment supporting multi-language submissions and test cases",
      "Measurable coding progress tracking that benchmarks problem-solving consistency over time",
    ],
    website: null,
    repository: null,
    coordinates: { x: 950, y: 380 },
    connectionLabel: "Learning, Coding Practice & Problem-Solving",
    connectionShort: "Coding Practice",
  },
  {
    id: "mental-health",
    name: "Mental Health Score (Fluffy Spoon)",
    isCenter: false,
    position: "bottom",
    role: "Personal Wellbeing & Self-Reflection Tool",
    tagline: "Developer Cognitive Fitness & Balance",
    accentColor: "#f43f5e", // Rose / Pink
    accentGlow: "rgba(244, 63, 94, 0.4)",
    badge: "Wellbeing",
    shortDescription:
      "A personal wellbeing and self-reflection tool.",
    purpose:
      "Fluffy Spoon provides a wellbeing-oriented experience that encourages users to reflect on their personal wellbeing. It is presented as a complementary tool for maintaining awareness of wellbeing alongside intensive learning and career development, supporting healthy, sustainable progress.",
    features: [
      "Guided self-reflection questionnaires focused on focus stamina, workload pressure, and balance",
      "Non-clinical wellbeing metrics designed to help engineering talent recognize fatigue early",
      "Supports sustainable career progress by encouraging balanced learning habits and rest",
      "Privacy-first architecture ensuring zero automatic sharing of sensitive personal reflection data",
    ],
    website: "https://fluffy-spoon-score.vercel.app/",
    repository: null,
    coordinates: { x: 550, y: 640 },
    connectionLabel: "Career Growth Alongside Personal Wellbeing",
    connectionShort: "Personal Wellbeing",
  },
  {
    id: "resume-screener",
    name: "Resume Screener (ATS Resume Analysis)",
    isCenter: false,
    position: "top",
    role: "Resume Evaluation & ATS-Readiness Support",
    tagline: "Resume Optimization & Career Preparation",
    accentColor: "#10b981", // Emerald / Green
    accentGlow: "rgba(16, 185, 129, 0.4)",
    badge: "Resume Readiness",
    shortDescription:
      "Resume evaluation and ATS-readiness support.",
    purpose:
      "Resume Screener helps users evaluate their resumes, understand areas that need improvement, and present their skills, projects, and experience more effectively. It serves as a career-preparation tool that supports resume improvement and helps users prepare professional application documents.",
    features: [
      "Automated ATS parsing and keyword density evaluation tailored to engineering roles",
      "Identification of missing technical competencies and formatting improvement areas",
      "Clear readiness scoring to help candidates optimize application documents before applying",
      "Actionable recommendations for presenting practical projects and collaborative experience effectively",
    ],
    website: "https://ats-resume-analysis.netlify.app/",
    repository: null,
    coordinates: { x: 550, y: 120 },
    connectionLabel: "Resume Improvement & Career Preparation",
    connectionShort: "Resume Preparation",
  },
];

export const ECOSYSTEM_CONNECTIONS = [
  {
    id: "conn-flowctrl-codecollab",
    source: "flowctrl",
    target: "codecollab",
    label: "Career Development ↔ Collaborative Practical Experience",
    shortLabel: "Practical Experience",
    color: "#a855f7",
    description:
      "FlowCTRL roadmaps identify technical skills to develop, while CodeCollab provides collaborative team projects to practise and demonstrate those skills in real-world repositories.",
  },
  {
    id: "conn-flowctrl-judgex",
    source: "flowctrl",
    target: "judgex",
    label: "Learning ↔ Coding Practice & Problem-Solving",
    shortLabel: "Coding Practice",
    color: "#06b6d4",
    description:
      "FlowCTRL guides conceptual learning and role paths, while JudgeX provides the hands-on coding challenges and problem-solving practice needed to master technical interviews.",
  },
  {
    id: "conn-flowctrl-mental-health",
    source: "flowctrl",
    target: "mental-health",
    label: "Career Growth ↔ Personal Wellbeing",
    shortLabel: "Personal Wellbeing",
    color: "#f43f5e",
    description:
      "Sustainable career growth requires cognitive stamina. Fluffy Spoon provides self-reflection tools to help developers maintain wellbeing alongside rigorous learning.",
  },
  {
    id: "conn-flowctrl-resume-screener",
    source: "flowctrl",
    target: "resume-screener",
    label: "Resume Improvement ↔ Career Preparation",
    shortLabel: "Resume Preparation",
    color: "#10b981",
    description:
      "FlowCTRL helps users develop and master competencies, while Resume Screener evaluates application documents to ensure skills and experience are presented effectively to automated filters.",
  },
];
