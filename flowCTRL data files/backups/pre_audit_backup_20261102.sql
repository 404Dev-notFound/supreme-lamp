--
-- PostgreSQL database dump
--

\restrict u9JIrIMSpC6SqVKN3rvCei8SWdhzc0hULzNfWqmGRuqdch0G0jnwlMf5OWGWhjs

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'APPLIED',
    'SCREENING',
    'INTERVIEWING',
    'OFFERED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: IssuePriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IssuePriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public."IssuePriority" OWNER TO postgres;

--
-- Name: IssueStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."IssueStatus" AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'DONE'
);


ALTER TYPE public."IssueStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'GUEST',
    'USER',
    'MENTOR',
    'RECRUITER',
    'COMPANY_REP',
    'ADMIN',
    'SUPER_ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: WorkMode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."WorkMode" AS ENUM (
    'REMOTE',
    'HYBRID',
    'ONSITE'
);


ALTER TYPE public."WorkMode" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text,
    "ipAddress" text,
    "userAgent" text,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: CareerPath; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CareerPath" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    level text DEFAULT 'Mid-Level'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CareerPath" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    name text NOT NULL,
    logo text,
    website text,
    location text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Company" OWNER TO postgres;

--
-- Name: Issue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Issue" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."IssueStatus" DEFAULT 'TODO'::public."IssueStatus" NOT NULL,
    priority public."IssuePriority" DEFAULT 'MEDIUM'::public."IssuePriority" NOT NULL,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "projectId" text NOT NULL,
    "creatorId" text,
    "assigneeId" text
);


ALTER TABLE public."Issue" OWNER TO postgres;

--
-- Name: Job; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Job" (
    id text NOT NULL,
    title text NOT NULL,
    "companyId" text NOT NULL,
    location text NOT NULL,
    "workMode" public."WorkMode" DEFAULT 'REMOTE'::public."WorkMode" NOT NULL,
    "salaryMin" integer,
    "salaryMax" integer,
    currency text DEFAULT 'USD'::text NOT NULL,
    description text,
    "applyUrl" text,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Job" OWNER TO postgres;

--
-- Name: JobApplication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobApplication" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "resumeId" text,
    status public."ApplicationStatus" DEFAULT 'APPLIED'::public."ApplicationStatus" NOT NULL,
    notes text,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."JobApplication" OWNER TO postgres;

--
-- Name: JobSkill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobSkill" (
    id text NOT NULL,
    "jobId" text NOT NULL,
    "skillId" text NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JobSkill" OWNER TO postgres;

--
-- Name: MembershipHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipHistory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    action text NOT NULL,
    tier text DEFAULT 'PREMIUM'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MembershipHistory" OWNER TO postgres;

--
-- Name: MembershipPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipPlan" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    tier text DEFAULT 'PREMIUM'::text NOT NULL,
    price double precision DEFAULT 0.0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "interval" text,
    features text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MembershipPlan" OWNER TO postgres;

--
-- Name: MembershipTransaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipTransaction" (
    id text NOT NULL,
    "membershipId" text,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status text NOT NULL,
    "paymentMethod" text,
    "providerReference" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MembershipTransaction" OWNER TO postgres;

--
-- Name: MentorProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MentorProfile" (
    id text NOT NULL,
    "userId" text NOT NULL,
    expertise text NOT NULL,
    "yearsOfExp" integer NOT NULL,
    "hourlyRate" double precision,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MentorProfile" OWNER TO postgres;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    link text,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- Name: PremiumResource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PremiumResource" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "categorySlug" text,
    "categoryId" text,
    "accessLevel" text DEFAULT 'PREMIUM'::text NOT NULL,
    level text DEFAULT 'Advanced'::text NOT NULL,
    badge text DEFAULT 'PREMIUM'::text,
    "iconName" text DEFAULT 'Sparkles'::text,
    "estimatedHours" integer DEFAULT 25,
    "topicsCount" integer DEFAULT 0 NOT NULL,
    "externalUrl" text,
    content jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PremiumResource" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    difficulty text DEFAULT 'Intermediate'::text NOT NULL,
    "techStack" text[],
    image text,
    description text,
    "githubUrl" text,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isDemo" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ownerId" text
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: ProjectMember; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectMember" (
    "projectId" text NOT NULL,
    "userId" text NOT NULL,
    "projectRole" text DEFAULT 'viewer'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ProjectMember" OWNER TO postgres;

--
-- Name: ResourceCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceCategory" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ResourceCategory" OWNER TO postgres;

--
-- Name: Resume; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Resume" (
    id text NOT NULL,
    "userId" text,
    "fileName" text NOT NULL,
    "fileSize" integer NOT NULL,
    "fileUrl" text,
    "mimeType" text DEFAULT 'application/pdf'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "storageKey" text
);


ALTER TABLE public."Resume" OWNER TO postgres;

--
-- Name: ResumeAnalysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResumeAnalysis" (
    id text NOT NULL,
    "resumeId" text,
    "userId" text,
    "overallScore" integer NOT NULL,
    verdict text NOT NULL,
    "verdictReason" text,
    "atsScore" integer,
    "atsIssues" jsonb,
    "topFixes" jsonb,
    strengths jsonb,
    flaws jsonb,
    "sectionFeedback" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ResumeAnalysis" OWNER TO postgres;

--
-- Name: Roadmap; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Roadmap" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'role'::text NOT NULL,
    slug text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Roadmap" OWNER TO postgres;

--
-- Name: RoadmapPhase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoadmapPhase" (
    id text NOT NULL,
    title text NOT NULL,
    "order" integer NOT NULL,
    "roadmapId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoadmapPhase" OWNER TO postgres;

--
-- Name: RoadmapTask; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoadmapTask" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    completed boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "roadmapPhaseId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RoadmapTask" OWNER TO postgres;

--
-- Name: SavedJob; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SavedJob" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "jobId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SavedJob" OWNER TO postgres;

--
-- Name: SecurityLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SecurityLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "eventType" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SecurityLog" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Skill" (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    "categoryId" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Skill" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text,
    email text,
    "emailVerified" timestamp(3) without time zone,
    image text,
    password text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    headline text,
    bio text,
    location text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserMembership; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserMembership" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "planId" text NOT NULL,
    tier text DEFAULT 'FREE'::text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "autoRenew" boolean DEFAULT false NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "lastVerifiedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserMembership" OWNER TO postgres;

--
-- Name: UserPreference; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserPreference" (
    "userId" text NOT NULL,
    theme text DEFAULT 'dark'::text NOT NULL,
    "emailNotifications" boolean DEFAULT true NOT NULL,
    "weeklyDigest" boolean DEFAULT true NOT NULL,
    "jobAlerts" boolean DEFAULT true NOT NULL,
    "profileVisibility" text DEFAULT 'PUBLIC'::text NOT NULL,
    "careerGoalVisibility" boolean DEFAULT true NOT NULL,
    "customSettings" jsonb DEFAULT '{}'::jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserPreference" OWNER TO postgres;

--
-- Name: UserProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserProfile" (
    "userId" text NOT NULL,
    "displayName" text,
    "firstName" text,
    "lastName" text,
    headline text,
    bio text,
    "avatarUrl" text,
    location text,
    "websiteUrl" text,
    "githubUrl" text,
    "linkedinUrl" text,
    "twitterUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserProfile" OWNER TO postgres;

--
-- Name: UserRoadmapProgress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserRoadmapProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roadmapSlug" text NOT NULL,
    "completedTopics" text[],
    "currentTopic" text,
    "progressPercent" integer DEFAULT 0 NOT NULL,
    "lastActivityAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserRoadmapProgress" OWNER TO postgres;

--
-- Name: UserSession; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSession" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionToken" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "deviceType" text DEFAULT 'Desktop'::text,
    browser text,
    os text,
    "revokedAt" timestamp(3) without time zone,
    "lastActiveAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserSession" OWNER TO postgres;

--
-- Name: UserSkill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserSkill" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "skillId" text NOT NULL,
    proficiency integer DEFAULT 3 NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UserSkill" OWNER TO postgres;

--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."VerificationToken" OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "userId", action, "targetType", "targetId", "ipAddress", "userAgent", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: CareerPath; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CareerPath" (id, title, slug, description, level, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, name, slug, description, "createdAt", "updatedAt") FROM stdin;
cmuwxriuj0000zs972smm7rww	Programming	programming	Core programming language and development skills	2026-10-06 17:11:49.291	2026-11-01 20:48:28.616
cmuwxriw90001zs97bt7keflq	Data Science	data-science	Data analysis, machine learning, statistics	2026-10-06 17:11:49.353	2026-11-01 20:48:28.736
cmuwxriwb0002zs973cpus5j8	Product Management	product-management	Roadmapping, stakeholder alignment, market analysis	2026-10-06 17:11:49.355	2026-11-01 20:48:28.74
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Company" (id, name, logo, website, location, description, "createdAt", "updatedAt", "isVerified") FROM stdin;
\.


--
-- Data for Name: Issue; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Issue" (id, title, description, status, priority, tags, "createdAt", "updatedAt", "projectId", "creatorId", "assigneeId") FROM stdin;
iss_fc_001	Real-time PostgreSQL Data Persistence	Persist all user signup, authentication, profile, and project mutations immediately in PostgreSQL via Prisma.	DONE	HIGH	{database,prisma,security,docker}	2026-10-06 17:11:49.841	2026-10-06 17:11:49.841	prj_flowctrl_platform	usr_seed_admin	\N
iss_fc_002	Transactional Integrity & Concurrency Safeguards	Ensure atomic commits across related models to prevent race conditions and partial writes.	IN_PROGRESS	HIGH	{transactions,acid,reliability}	2026-10-06 17:11:49.846	2026-10-06 17:11:49.846	prj_flowctrl_platform	usr_seed_admin	\N
iss_fc_003	Docker Persistent Volume Lifecycle Verification	Validate data retention across container tear-down, service restarts, and host reboots.	TODO	MEDIUM	{devops,docker,storage}	2026-10-06 17:11:49.849	2026-10-06 17:11:49.849	prj_flowctrl_platform	usr_seed_admin	\N
iss_co_001	Cluster Health Telemetry Exporter	Implement node heartbeat probe and stream telemetry metrics into PostgreSQL.	TODO	URGENT	{telemetry,observability,metrics}	2026-10-06 17:11:49.86	2026-10-06 17:11:49.86	prj_cloud_orchestrator	usr_seed_alex	\N
iss_co_002	Service Mesh Automated TLS Rotation	Automate certificate provisioning and mutual TLS verification between internal services.	TODO	MEDIUM	{security,networking,tls}	2026-10-06 17:11:49.864	2026-10-06 17:11:49.864	prj_cloud_orchestrator	usr_seed_alex	\N
\.


--
-- Data for Name: Job; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Job" (id, title, "companyId", location, "workMode", "salaryMin", "salaryMax", currency, description, "applyUrl", "isFeatured", "createdAt", "updatedAt", "isActive") FROM stdin;
\.


--
-- Data for Name: JobApplication; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobApplication" (id, "userId", "jobId", "resumeId", status, notes, "appliedAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: JobSkill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobSkill" (id, "jobId", "skillId", "isRequired", "createdAt") FROM stdin;
\.


--
-- Data for Name: MembershipHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipHistory" (id, "userId", "planId", action, tier, "startDate", "endDate", note, "createdAt") FROM stdin;
cmvyayb5p007h2w97gm7uek76	usr_seed_admin	cmvyayb4n007e2w977a2m9grd	ACTIVATED	PREMIUM	2026-11-01 20:48:29.436	2027-11-01 20:48:29.428	Initial seed membership for admin@flowctrl.dev	2026-11-01 20:48:29.437
cmvyayb5y007j2w97iiltx3ul	usr_seed_alex	cmvyayb4n007e2w977a2m9grd	ACTIVATED	PREMIUM	2026-11-01 20:48:29.446	2027-11-01 20:48:29.428	Initial seed membership for alex@flowctrl.dev	2026-11-01 20:48:29.446
cmvyayb65007l2w97x43to0vr	usr_seed_mentor	cmvyayb4b007d2w97u43xgrno	ACTIVATED	FREE	2026-11-01 20:48:29.452	\N	Initial seed membership for mentor@flowctrl.dev	2026-11-01 20:48:29.453
cmvyayb68007n2w979fv5lqv4	usr_seed_recruiter	cmvyayb4b007d2w97u43xgrno	ACTIVATED	FREE	2026-11-01 20:48:29.456	\N	Initial seed membership for recruiter@flowctrl.dev	2026-11-01 20:48:29.456
cmvyayb6c007p2w97c9hatm9s	cmux1mf9x0000zs97oo8zo9f0	cmvyayb4b007d2w97u43xgrno	ACTIVATED	FREE	2026-11-01 20:48:29.46	\N	Initial seed membership for test@gmail.com	2026-11-01 20:48:29.46
cmvyb6blj0001cg97q1m6vvdt	usr_seed_mentor	cmvyayb4n007e2w977a2m9grd	UPGRADED	PREMIUM	2026-11-01 20:54:43.131	2026-12-01 20:54:43.131	Upgraded to flowCTRL Premium (Monthly) via mock	2026-11-01 20:54:43.255
cmvyb6bry0003cg97f5rd9l3p	usr_seed_alex	cmvyayb4n007e2w977a2m9grd	CANCELLED	PREMIUM	2026-11-01 20:48:29.444	2027-11-01 20:48:29.428	Testing cancellation flow	2026-11-01 20:54:43.486
cmvz2paln0001d497sisffsfg	usr_seed_mentor	cmvyayb4n007e2w977a2m9grd	UPGRADED	PREMIUM	2026-11-02 09:45:17.922	2026-12-02 09:45:17.922	Upgraded to flowCTRL Premium (Monthly) via mock	2026-11-02 09:45:18.059
cmvz2pave0003d497wacqwgba	usr_seed_alex	cmvyayb4n007e2w977a2m9grd	CANCELLED	PREMIUM	2026-11-01 20:48:29.444	2027-11-01 20:48:29.428	Testing cancellation flow	2026-11-02 09:45:18.41
cmvzfr1bg0001dg97w6jh1fzo	usr_seed_mentor	cmvyayb4n007e2w977a2m9grd	UPGRADED	PREMIUM	2026-11-02 15:50:34.259	2026-12-02 15:50:34.259	Upgraded to flowCTRL Premium (Monthly) via mock	2026-11-02 15:50:34.348
cmvzfr1jn0003dg97ylzpmzup	usr_seed_alex	cmvyayb4n007e2w977a2m9grd	CANCELLED	PREMIUM	2026-11-01 20:48:29.444	2027-11-01 20:48:29.428	Testing cancellation flow	2026-11-02 15:50:34.643
\.


--
-- Data for Name: MembershipPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipPlan" (id, code, name, description, tier, price, currency, "interval", features, "isActive", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmvyayb4b007d2w97u43xgrno	FREE	Community Explorer	Foundational access to all standard community roadmaps, interactive graphs, and core career tracking.	FREE	0	USD	\N	{"Access to 92+ Community Roadmaps","Interactive Step-by-Step Curriculum Graphs","Basic Topic Progress Tracking","Public Career Profile & Skills Portfolio","Job Matcher & Community Search"}	t	1	2026-11-01 20:48:29.387	2026-11-01 20:48:29.387
cmvyayb4n007e2w977a2m9grd	PREMIUM_MONTHLY	flowCTRL Premium (Monthly)	Complete access to exclusive curated masterclasses, advanced architecture tracks, and deep-dive resources.	PREMIUM	19	USD	month	{"All Free Tier features included","Full Access to Exclusive Premium Learning Tracks","Curated Advanced Architecture & Security Blueprints","Deep-Dive Technical Guides & Resource Repositories","Interactive Progress Checkpoints & Code Lab Links","Priority Verification on Skills & Profile Badging","Monthly Billing, Cancel Anytime"}	t	2	2026-11-01 20:48:29.399	2026-11-01 20:48:29.399
cmvyayb4t007f2w97ivzia5vt	PREMIUM_ANNUAL	flowCTRL Premium (Annual)	Best value for dedicated engineers and senior architects. Save 35% with full year access.	PREMIUM	149	USD	year	{"Everything in Premium Monthly included","2 Months Free (35% Savings over monthly)","Priority Access to Newly Released Masterclasses","Offline Downloadable Roadmap Summaries","Verified Senior Architect Member Badge","Annual Priority Support & Feature Requests"}	t	3	2026-11-01 20:48:29.405	2026-11-01 20:48:29.405
\.


--
-- Data for Name: MembershipTransaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipTransaction" (id, "membershipId", "userId", amount, currency, status, "paymentMethod", "providerReference", "createdAt", "updatedAt") FROM stdin;
cmvyb6bl20000cg976ld9ekcg	cmvyayb62007k2w9766ptti9d	usr_seed_mentor	19	USD	COMPLETED	mock	txn_1793566483235_zcb9a2	2026-11-01 20:54:43.239	2026-11-01 20:54:43.239
cmvz2pal10000d497plzb15js	cmvyayb62007k2w9766ptti9d	usr_seed_mentor	19	USD	COMPLETED	mock	txn_1793612718030_xyccdi	2026-11-02 09:45:18.037	2026-11-02 09:45:18.037
cmvzfr1b50000dg97qbga1f9n	cmvyayb62007k2w9766ptti9d	usr_seed_mentor	19	USD	COMPLETED	mock	txn_1793634634333_8g6lzv	2026-11-02 15:50:34.338	2026-11-02 15:50:34.338
\.


--
-- Data for Name: MentorProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MentorProfile" (id, "userId", expertise, "yearsOfExp", "hourlyRate", "isAvailable", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "userId", title, message, type, link, read, "readAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PremiumResource; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PremiumResource" (id, slug, title, description, "categorySlug", "categoryId", "accessLevel", level, badge, "iconName", "estimatedHours", "topicsCount", "externalUrl", content, "isActive", "isFeatured", "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmvyayb71007w2w978ft1w5uc	distributed-systems-architecture	Advanced Distributed Systems & High-Scale Architecture	Master consensus protocols, Raft, Paxos, event-driven streaming architectures, partition tolerance, and fault-tolerant distributed computing.	backend-cloud	cmvyayb6h007q2w97l7flddo5	PREMIUM	Advanced	PREMIUM	Network	45	12	\N	{"modules": [{"id": "mod-dist-1", "title": "Consensus & Replication Fundamentals", "topics": [{"id": "top-raft-paxos", "title": "Raft and Paxos Consensus Protocols", "summary": "Mechanisms for achieving agreement in asynchronous systems with crash-recovery failures. Quorum systems, log matching, and term transitions.", "resources": [{"id": "res-raft-paper", "url": "https://raft.github.io/raft.pdf", "type": "paper", "title": "In Search of an Understandable Consensus Algorithm (Raft Paper)"}, {"id": "res-paxos-simple", "url": "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf", "type": "article", "title": "Paxos Made Simple by Leslie Lamport"}]}, {"id": "top-cap-pacelc", "title": "CAP Theorem & PACELC Trade-Offs", "summary": "Formal analysis of consistency, availability, and partition tolerance tradeoffs during normal and partitioned execution.", "resources": [{"id": "res-pacelc-guide", "url": "https://en.wikipedia.org/wiki/PACELC_theorem", "type": "article", "title": "PACELC Theorem & Latency vs. Consistency Trade-Offs"}]}], "description": "State machine replication, leader election, and distributed consensus algorithms."}, {"id": "mod-dist-2", "title": "Distributed Storage & Partitioning", "topics": [{"id": "top-consistent-hashing", "title": "Consistent Hashing & Dynamo Ring Architecture", "summary": "Ring-based distribution with virtual nodes to minimize data relocation during cluster scaling and failover.", "resources": [{"id": "res-dynamo-paper", "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf", "type": "paper", "title": "Amazon Dynamo: Highly Available Key-Value Store"}]}, {"id": "top-vector-clocks", "title": "Causality, Vector Clocks & CRDTs", "summary": "Conflict-free Replicated Data Types (State-based and Operation-based) enabling concurrent editing without coordination.", "resources": [{"id": "res-crdt-tech", "url": "https://hal.inria.fr/inria-00555588/document", "type": "article", "title": "A Comprehensive Study of Convergent and Commutative Replicated Data Types"}]}], "description": "Consistent hashing, virtual nodes, sharding strategies, and multi-datacenter data replication."}, {"id": "mod-dist-3", "title": "High-Throughput Streaming & Event Sourcing", "topics": [{"id": "top-kafka-internals", "title": "Distributed Commit Logs & Partition Mechanics", "summary": "Zero-copy data transfer, index segmentation, consumer group rebalancing, and transaction coordinators.", "resources": [{"id": "res-kafka-doc", "url": "https://kafka.apache.org/documentation/#design", "type": "guide", "title": "Apache Kafka Architecture & Log Compaction Deep Dive"}]}], "description": "Log-centric architectures, exactly-once processing semantics, and distributed pub/sub pipelines."}], "overview": "An exhaustive engineering curriculum covering the theory, mechanics, and real-world implementation of planetary-scale distributed systems.", "prerequisites": ["Strong systems programming knowledge", "Understanding of networking (TCP/IP, sockets)", "Relational and NoSQL fundamentals"]}	t	t	1	2026-11-01 20:48:29.485	2026-11-01 20:48:29.485
cmvyayb7g007x2w97mso0tqzh	offensive-security-red-teaming	Offensive Security, Exploit Analysis & Red Teaming	Advanced penetration testing, vulnerability discovery, memory corruption analysis, web application exploitation, and enterprise red team tradecraft.	security	cmvyayb6n007r2w97c06fqr13	PREMIUM	Advanced	PREMIUM	ShieldCheck	50	14	\N	{"modules": [{"id": "mod-sec-1", "title": "Modern Web Application Exploitation", "topics": [{"id": "top-advanced-deserialization", "title": "Insecure Object Deserialization & Gadget Chains", "summary": "Constructing exploitation gadget chains in runtime environments (Java, Python, PHP, Node.js) for remote code execution.", "resources": [{"id": "res-appsec-guide", "url": "https://owasp.org/www-project-application-security-verification-standard/", "type": "article", "title": "OWASP Application Security Verification Standard"}]}, {"id": "top-ssrf-cloud-metadata", "title": "SSRF & Cloud Metadata Exploitation", "summary": "Exploiting blind SSRF to exfiltrate cloud credentials from AWS IMDSv1/v2, GCP metadata endpoints, and internal microservice mesh.", "resources": [{"id": "res-ssrf-bible", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html", "type": "guide", "title": "Server-Side Request Forgery Prevention Cheat Sheet"}]}], "description": "Deep dive beyond basic injection into complex multi-stage deserialization, prototype pollution, and authentication bypass."}, {"id": "mod-sec-2", "title": "Fuzzing & Vulnerability Research", "topics": [{"id": "top-coverage-fuzzing", "title": "Coverage-Guided Fuzzing with AFL++ and LibFuzzer", "summary": "Instrumenting binaries with compile-time hooks, mutating corpus inputs, and isolating heap/stack corruption.", "resources": [{"id": "res-fuzzing-guide", "url": "https://aflplus.plus/docs/", "type": "guide", "title": "AFL++ Comprehensive Fuzzing Documentation"}]}], "description": "Coverage-guided fuzz testing, memory corruption detection, and crash triaging."}, {"id": "mod-sec-3", "title": "Active Directory & Enterprise Red Teaming", "topics": [{"id": "top-ad-kerberos", "title": "Kerberos Protocol Attacks & Ticket Forgery", "summary": "Golden Ticket, Silver Ticket, Kerberoasting, and Unconstrained Delegation attack vectors in hybrid enterprise environments.", "resources": [{"id": "res-mitre-attck", "url": "https://attack.mitre.org/", "type": "guide", "title": "MITRE ATT&CK Enterprise Matrix"}]}], "description": "Domain enumeration, Kerberoasting, AS-REP roasting, token manipulation, and cross-forest privilege escalation."}], "overview": "Professional offensive cybersecurity blueprint focused on practical vulnerability research, active defense evasion, and systematic red team operations.", "prerequisites": ["Linux and Windows internals", "Networking fundamentals", "Familiarity with Python and C/C++ basics"]}	t	t	2	2026-11-01 20:48:29.5	2026-11-01 20:48:29.5
cmvyayb7j007y2w97xwj3ta2w	autonomous-ai-agents	Applied Autonomous AI Agents & Neural Architectures	Build production-grade autonomous agent systems, multi-agent communication protocols, hierarchical memory, tool-use loops, and adversarial defenses.	ai-intelligence	cmvyayb6p007s2w97tcxcf40u	PREMIUM	Advanced	PREMIUM	Bot	40	11	\N	{"modules": [{"id": "mod-agent-1", "title": "Agentic Reasoning Frameworks", "topics": [{"id": "top-react-loop", "title": "ReAct: Synergizing Reasoning & Action", "summary": "Designing iterative Thought-Action-Observation loops with self-reflection and deterministic error correction.", "resources": [{"id": "res-react-paper", "url": "https://arxiv.org/abs/2210.03629", "type": "paper", "title": "ReAct: Synergizing Reasoning and Acting in Language Models"}]}, {"id": "top-reflexion", "title": "Reflexion: Episodic Memory & Self-Correction", "summary": "Reinforcing agents through linguistic feedback loops stored in episodic memory without fine-tuning weights.", "resources": [{"id": "res-reflexion-paper", "url": "https://arxiv.org/abs/2303.11366", "type": "paper", "title": "Reflexion: Language Agents with Verbal Reinforcement Learning"}]}], "description": "ReAct, Reflexion, Plan-and-Solve, and Tree-of-Thoughts architectural paradigms."}, {"id": "mod-agent-2", "title": "Memory Architectures & Vector Spaces", "topics": [{"id": "top-agent-memory", "title": "Dynamic Context Compression & Memory Consolidation", "summary": "Summarization pipelines, token budget eviction, and hybrid dense/sparse vector retrieval for persistent agent state.", "resources": [{"id": "res-mem-architecture", "url": "https://arxiv.org/abs/2304.03442", "type": "guide", "title": "Generative Agents: Interactive Simulacra of Human Behavior"}]}], "description": "Hierarchical working, episodic, and semantic memory systems for long-horizon agent tasks."}, {"id": "mod-agent-3", "title": "Adversarial Defense & Guardrails", "topics": [{"id": "top-prompt-injection-defense", "title": "Indirect Prompt Injection Mitigations", "summary": "Dual-LLM evaluator patterns, tool parameter strict validation, and sandboxed execution boundaries.", "resources": [{"id": "res-owasp-llm-top10", "url": "https://owasp.org/www-project-top-10-for-large-language-model-applications/", "type": "guide", "title": "OWASP Top 10 for Large Language Model Applications"}]}], "description": "Hardening autonomous agents against indirect prompt injection, data exfiltration, and tool abuse."}], "overview": "From single-turn LLM prompts to fully autonomous self-correcting agent systems with cognitive memory architectures and tool orchestration.", "prerequisites": ["Python intermediate proficiency", "Basic knowledge of vector embeddings", "API interaction experience"]}	t	t	3	2026-11-01 20:48:29.503	2026-11-01 20:48:29.503
cmvyayb7s007z2w9765d478h7	kubernetes-platform-engineering	Cloud-Native Kubernetes & Platform Engineering	Architect internal developer platforms (IDPs), custom Kubernetes operators, service meshes (Istio/Linkerd), and eBPF-powered cluster telemetry.	devops-cloud	cmvyayb6r007t2w9716wl5wuo	PREMIUM	Advanced	PREMIUM	Box	40	10	\N	{"modules": [{"id": "mod-k8s-1", "title": "Custom Controllers & Operator SDK", "topics": [{"id": "top-k8s-operator", "title": "Operator Pattern & Reconciliation Loops", "summary": "Building level-triggered reconciliation loops with client-go, controller-runtime, and Kubebuilder.", "resources": [{"id": "res-k8s-operators", "url": "https://kubernetes.io/docs/concepts/extend-kubernetes/operator/", "type": "guide", "title": "Official Kubernetes Operator Pattern Guide"}]}], "description": "Extending the Kubernetes control plane with Custom Resource Definitions and reconciliation controllers."}, {"id": "mod-k8s-2", "title": "Service Mesh & Zero-Trust Networking", "topics": [{"id": "top-service-mesh", "title": "Istio & Envoy Data Plane Mechanics", "summary": "Configuring VirtualServices, DestinationRules, automatic mTLS sidecar injection, and circuit breaking.", "resources": [{"id": "res-envoy-arch", "url": "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview", "type": "guide", "title": "Envoy Proxy Architecture & Threading Model"}]}], "description": "mTLS, progressive delivery with Canary rollouts, and traffic mirroring."}], "overview": "Professional cloud-native guide for senior SREs and platform engineers designing resilient multi-tenant Kubernetes platforms.", "prerequisites": ["Docker and container basics", "Linux systems administration", "Basic Go or Python for controllers"]}	t	f	4	2026-11-01 20:48:29.512	2026-11-01 20:48:29.512
cmvyayb7w00802w97o4jfn508	applied-cryptography-zkp	Applied Cryptography & Zero-Knowledge Proofs	Practical cryptography engineering: Elliptic Curves, Ed25519, Key Exchange protocols, Authenticated Encryption, and zk-SNARK mathematical foundations.	computer-science	cmvyayb6s007u2w97uitxfwiy	PREMIUM	Advanced	PREMIUM	Lock	35	9	\N	{"modules": [{"id": "mod-crypto-1", "title": "Modern Cryptographic Primitives", "topics": [{"id": "top-aead-curves", "title": "AEAD & Elliptic Curve Diffie-Hellman (X25519)", "summary": "Preventing padding oracle and chosen-ciphertext attacks with provably secure AEAD constructions.", "resources": [{"id": "res-crypto-engineering", "url": "https://www.schneier.com/books/cryptography-engineering/", "type": "guide", "title": "Cryptography Engineering Principles (Ferguson, Schneier, Kohno)"}]}], "description": "Authenticated encryption with associated data (AEAD), ChaCha20-Poly1305, and Curve25519."}, {"id": "mod-crypto-2", "title": "Zero-Knowledge Foundations", "topics": [{"id": "top-zk-snarks", "title": "Groth16 and Polynomial Commitments", "summary": "Converting computational logic into arithmetic circuits and generating succinct non-interactive zero-knowledge proofs.", "resources": [{"id": "res-zk-learning", "url": "https://zk-learning.org/", "type": "guide", "title": "Zero Knowledge Proofs MOOC & Course Materials"}]}], "description": "Arithmetization, R1CS, QAP, and zk-SNARK proof systems (Groth16, PLONK)."}], "overview": "Modern applied cryptographic techniques for software engineers building secure communications, privacy-preserving proofs, and distributed ledgers.", "prerequisites": ["Linear algebra basics", "Modular arithmetic", "Familiarity with hashing and digital signatures"]}	t	f	5	2026-11-01 20:48:29.516	2026-11-01 20:48:29.516
cmvyayb7z00812w97a41g7l8j	high-performance-databases	High-Performance Database Internals & Storage Engines	Explore B-Tree and LSM-Tree storage engines, MVCC isolation levels, Write-Ahead Logging (WAL), cost-based query optimizers, and buffer pool caching.	databases-storage	cmvyayb6u007v2w97dzyuzccq	PREMIUM	Advanced	PREMIUM	Database	40	10	\N	{"modules": [{"id": "mod-db-1", "title": "Storage Engine Architectures", "topics": [{"id": "top-lsm-trees", "title": "LSM-Trees, Memtables & Compaction Strategies", "summary": "Leveled vs. Size-Tiered compaction, Bloom filters for point lookups, and crash recovery with WAL.", "resources": [{"id": "res-rocksdb-arch", "url": "https://github.com/facebook/rocksdb/wiki/RocksDB-Basics", "type": "guide", "title": "RocksDB Architecture & Compaction Mechanics"}]}], "description": "B+Trees vs. Log-Structured Merge (LSM) Trees and their write-amplification tradeoffs."}, {"id": "mod-db-2", "title": "Concurrency Control & MVCC", "topics": [{"id": "top-mvcc-internals", "title": "PostgreSQL MVCC & Tuple Visibility", "summary": "xmin/xmax transaction boundaries, vacuuming, freeze operations, and lock escalation.", "resources": [{"id": "res-pg-internals", "url": "https://www.interdb.jp/pg/", "type": "guide", "title": "The Internals of PostgreSQL for Hardware & Engine Architects"}]}], "description": "Snapshot isolation, serializable snapshot isolation (SSI), and write skew prevention."}], "overview": "Deep technical inspection of how database engines store, index, buffer, and execute queries across disk and memory hierarchies.", "prerequisites": ["Operating systems fundamentals (page cache, I/O)", "SQL proficiency", "C/Rust/Go familiarity"]}	t	f	6	2026-11-01 20:48:29.519	2026-11-01 20:48:29.519
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, title, category, difficulty, "techStack", image, description, "githubUrl", "isPinned", "isDemo", "createdAt", "updatedAt", "ownerId") FROM stdin;
prj_flowctrl_platform	flowCTRL Core Platform	Full-Stack Web	Advanced	{Node.js,Express,Next.js,PostgreSQL,Prisma,Docker}	https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80	Unified developer career accelerator and interactive learning environment with real-time PostgreSQL persistence.	https://github.com/flowctrl/flowctrl	t	f	2026-10-06 17:11:49.825	2026-11-01 20:48:29.539	usr_seed_admin
prj_cloud_orchestrator	Distributed Cloud Orchestrator	DevOps & Cloud	Advanced	{Go,Docker,Kubernetes,PostgreSQL,gRPC}	https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80	High-throughput cluster orchestration controller managing microservices across distributed nodes.	https://github.com/flowctrl/cloud-orchestrator	f	t	2026-10-06 17:11:49.854	2026-11-01 20:48:29.559	usr_seed_alex
\.


--
-- Data for Name: ProjectMember; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectMember" ("projectId", "userId", "projectRole", "joinedAt") FROM stdin;
prj_flowctrl_platform	usr_seed_admin	owner	2026-10-06 17:11:49.825
prj_cloud_orchestrator	usr_seed_alex	owner	2026-10-06 17:11:49.854
\.


--
-- Data for Name: ResourceCategory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResourceCategory" (id, slug, name, description, icon, "sortOrder", "createdAt", "updatedAt") FROM stdin;
cmvyayb6h007q2w97l7flddo5	backend-cloud	Backend & Cloud Architecture	\N	Server	1	2026-11-01 20:48:29.465	2026-11-01 20:48:29.465
cmvyayb6n007r2w97c06fqr13	security	Cybersecurity & Systems Hardening	\N	ShieldCheck	2	2026-11-01 20:48:29.471	2026-11-01 20:48:29.471
cmvyayb6p007s2w97tcxcf40u	ai-intelligence	AI Engineering & Machine Learning	\N	Brain	3	2026-11-01 20:48:29.473	2026-11-01 20:48:29.473
cmvyayb6r007t2w9716wl5wuo	devops-cloud	Platform Engineering & SRE	\N	Layers	4	2026-11-01 20:48:29.475	2026-11-01 20:48:29.475
cmvyayb6s007u2w97uitxfwiy	computer-science	Core Computer Science & Systems	\N	Binary	5	2026-11-01 20:48:29.476	2026-11-01 20:48:29.476
cmvyayb6u007v2w97dzyuzccq	databases-storage	Databases & Distributed Storage	\N	Database	6	2026-11-01 20:48:29.478	2026-11-01 20:48:29.478
\.


--
-- Data for Name: Resume; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Resume" (id, "userId", "fileName", "fileSize", "fileUrl", "mimeType", "createdAt", "updatedAt", "storageKey") FROM stdin;
\.


--
-- Data for Name: ResumeAnalysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ResumeAnalysis" (id, "resumeId", "userId", "overallScore", verdict, "verdictReason", "atsScore", "atsIssues", "topFixes", strengths, flaws, "sectionFeedback", "createdAt") FROM stdin;
\.


--
-- Data for Name: Roadmap; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Roadmap" (id, title, description, category, slug, "isPublic", "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RoadmapPhase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RoadmapPhase" (id, title, "order", "roadmapId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: RoadmapTask; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RoadmapTask" (id, title, description, completed, "order", "roadmapPhaseId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SavedJob; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavedJob" (id, "userId", "jobId", "createdAt") FROM stdin;
\.


--
-- Data for Name: SecurityLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SecurityLog" (id, "userId", "eventType", "ipAddress", "userAgent", details, "createdAt") FROM stdin;
cmuwxrj85007dzs97selab60h	usr_seed_admin	seed_initialized	127.0.0.1	flowCTRL Seeder	{"role": "ADMIN"}	2026-10-06 17:11:49.775
cmuwxrj8h007ezs974al361pt	usr_seed_alex	seed_initialized	127.0.0.1	flowCTRL Seeder	{"role": "USER"}	2026-10-06 17:11:49.791
cmuwxrj8p007fzs97bzxan2h1	usr_seed_mentor	seed_initialized	127.0.0.1	flowCTRL Seeder	{"role": "MENTOR"}	2026-10-06 17:11:49.8
cmuwxrj8x007gzs974u5wbxbk	usr_seed_recruiter	seed_initialized	127.0.0.1	flowCTRL Seeder	{"role": "RECRUITER"}	2026-10-06 17:11:49.807
cmux1mfd50001zs9777ig30qr	cmux1mf9x0000zs97oo8zo9f0	register_success	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	{"method": "credentials"}	2026-10-06 18:59:49.961
cmux1mhps00000o97hglc7mcj	cmux1mf9x0000zs97oo8zo9f0	login_success	\N	\N	\N	2026-10-06 18:59:53.009
cmvyb6bls0002cg9726zlxwhp	usr_seed_mentor	membership_upgrade	127.0.0.1	flowCTRL Client	{"tier": "PREMIUM", "amount": 19, "planCode": "PREMIUM_MONTHLY", "transactionId": "cmvyb6bl20000cg976ld9ekcg"}	2026-11-01 20:54:43.264
cmvyb6bs40004cg97dk02iydu	usr_seed_alex	membership_cancelled	127.0.0.1	flowCTRL Client	{"reason": "Testing cancellation flow"}	2026-11-01 20:54:43.492
cmvz2pam60002d497rrwtg86o	usr_seed_mentor	membership_upgrade	127.0.0.1	flowCTRL Client	{"tier": "PREMIUM", "amount": 19, "planCode": "PREMIUM_MONTHLY", "transactionId": "cmvz2pal10000d497plzb15js"}	2026-11-02 09:45:18.079
cmvz2pavo0004d497lbj9i2vh	usr_seed_alex	membership_cancelled	127.0.0.1	flowCTRL Client	{"reason": "Testing cancellation flow"}	2026-11-02 09:45:18.42
cmvzfr1bp0002dg97ev9ewaar	usr_seed_mentor	membership_upgrade	127.0.0.1	flowCTRL Client	{"tier": "PREMIUM", "amount": 19, "planCode": "PREMIUM_MONTHLY", "transactionId": "cmvzfr1b50000dg97qbga1f9n"}	2026-11-02 15:50:34.357
cmvzfr1jr0004dg97j5vvy4zu	usr_seed_alex	membership_cancelled	127.0.0.1	flowCTRL Client	{"reason": "Testing cancellation flow"}	2026-11-02 15:50:34.647
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Skill" (id, name, category, "categoryId", description, "createdAt", "updatedAt") FROM stdin;
cmuwxriwo0006zs97cu2n8ijp	CSS	Frontend Development	\N	Style responsive and modern user interfaces.	2026-10-06 17:11:49.368	2026-11-01 20:48:28.757
cmuwxriwf0003zs97ojn4fwkp	Python Programming	Programming	\N	Fundamental Python language skills.	2026-10-06 17:11:49.359	2026-11-01 20:48:28.748
cmuwxriwr0008zs97vmoo66v8	TypeScript	Frontend Development	\N	Build scalable applications with typed JavaScript.	2026-10-06 17:11:49.371	2026-11-01 20:48:28.764
cmuwxriwt0009zs970igip5b7	React	Frontend Development	\N	Create modern component-based user interfaces.	2026-10-06 17:11:49.373	2026-11-01 20:48:28.769
cmuwxriwv000azs9710f6dm8l	Next.js	Frontend Development	\N	Build full-stack React applications with server-side rendering.	2026-10-06 17:11:49.375	2026-11-01 20:48:28.773
cmuwxriwx000bzs97vvx8zirq	Tailwind CSS	Frontend Development	\N	Build responsive interfaces using utility-first CSS.	2026-10-06 17:11:49.377	2026-11-01 20:48:28.777
cmuwxriwy000czs97w1xmdjrd	Bootstrap	Frontend Development	\N	Develop responsive layouts with Bootstrap components.	2026-10-06 17:11:49.378	2026-11-01 20:48:28.779
cmuwxriwz000dzs97ffccz3ol	Redux	Frontend Development	\N	Manage application state in React applications.	2026-10-06 17:11:49.379	2026-11-01 20:48:28.782
cmuwxrix1000ezs97qa36qci9	Framer Motion	Frontend Development	\N	Create smooth animations and page transitions.	2026-10-06 17:11:49.381	2026-11-01 20:48:28.786
cmuwxrix2000fzs97vmdckvsk	Node.js	Backend Development	\N	Develop scalable server-side JavaScript applications.	2026-10-06 17:11:49.382	2026-11-01 20:48:28.788
cmuwxrix3000gzs97fifu14uc	Express.js	Backend Development	\N	Build RESTful APIs and backend services with Express.	2026-10-06 17:11:49.383	2026-11-01 20:48:28.79
cmuwxrix4000hzs97huhwc1aa	REST API Development	Backend Development	\N	Design and develop RESTful web services.	2026-10-06 17:11:49.384	2026-11-01 20:48:28.792
cmuwxrix6000izs97p79przxq	GraphQL	Backend Development	\N	Build flexible APIs using GraphQL.	2026-10-06 17:11:49.386	2026-11-01 20:48:28.794
cmuwxrix7000jzs972dfxafdv	MongoDB	Database	\N	Store and manage NoSQL data efficiently.	2026-10-06 17:11:49.387	2026-11-01 20:48:28.796
cmuwxrix8000kzs97yx2zfke0	PostgreSQL	Database	\N	Design and manage relational databases using PostgreSQL.	2026-10-06 17:11:49.388	2026-11-01 20:48:28.798
cmuwxrixa000lzs97h682z6dg	MySQL	Database	\N	Work with relational databases using MySQL.	2026-10-06 17:11:49.39	2026-11-01 20:48:28.801
cmuwxrixb000mzs974uay4ohf	Prisma ORM	Backend Development	\N	Model and query databases using Prisma ORM.	2026-10-06 17:11:49.391	2026-11-01 20:48:28.803
cmuwxrixd000nzs97urpfwc8d	Git	Developer Tools	\N	Track source code changes using Git version control.	2026-10-06 17:11:49.393	2026-11-01 20:48:28.805
cmuwxrixe000ozs97i21sbup9	GitHub	Developer Tools	\N	Collaborate on projects and manage repositories using GitHub.	2026-10-06 17:11:49.394	2026-11-01 20:48:28.806
cmuwxrixg000pzs97loqnixwu	Python	Programming Languages	\N	Develop applications, automation scripts, and AI solutions using Python.	2026-10-06 17:11:49.396	2026-11-01 20:48:28.808
cmuwxrixh000qzs976svubk2n	Java	Programming Languages	\N	Build enterprise-grade applications using Java.	2026-10-06 17:11:49.397	2026-11-01 20:48:28.81
cmuwxrixi000rzs97uk21k4hi	C++	Programming Languages	\N	Develop high-performance software and system-level applications.	2026-10-06 17:11:49.398	2026-11-01 20:48:28.812
cmuwxrixk000szs97mbxj5wex	C	Programming Languages	\N	Write efficient low-level and embedded system programs.	2026-10-06 17:11:49.4	2026-11-01 20:48:28.813
cmuwxrixl000tzs971iiqozde	Go	Programming Languages	\N	Build scalable backend services using Go.	2026-10-06 17:11:49.401	2026-11-01 20:48:28.815
cmuwxrixm000uzs97v1b11c8u	Rust	Programming Languages	\N	Develop memory-safe and high-performance systems software.	2026-10-06 17:11:49.402	2026-11-01 20:48:28.819
cmuwxrixo000vzs97vskuqvsf	Kotlin	Programming Languages	\N	Develop modern Android applications using Kotlin.	2026-10-06 17:11:49.404	2026-11-01 20:48:28.821
cmuwxrixp000wzs97a87emuub	Swift	Programming Languages	\N	Build native iOS applications using Swift.	2026-10-06 17:11:49.405	2026-11-01 20:48:28.823
cmuwxrixs000xzs97uvrf0ufl	PHP	Programming Languages	\N	Develop dynamic web applications using PHP.	2026-10-06 17:11:49.408	2026-11-01 20:48:28.825
cmuwxrixt000yzs973bl98z77	C#	Programming Languages	\N	Build desktop, web, and game applications using C#.	2026-10-06 17:11:49.409	2026-11-01 20:48:28.826
cmuwxrixv000zzs970izkab1z	Linux	Operating Systems	\N	Manage Linux systems and command-line environments.	2026-10-06 17:11:49.411	2026-11-01 20:48:28.828
cmuwxrixw0010zs97yv1szbf4	Docker	DevOps	\N	Containerize applications for development and deployment.	2026-10-06 17:11:49.412	2026-11-01 20:48:28.831
cmuwxrixy0011zs97912f4m0t	Docker Compose	DevOps	\N	Manage multi-container applications with Docker Compose.	2026-10-06 17:11:49.414	2026-11-01 20:48:28.835
cmuwxrixz0012zs97m50yw5sv	Kubernetes	DevOps	\N	Deploy, scale, and manage containerized applications.	2026-10-06 17:11:49.415	2026-11-01 20:48:28.838
cmuwxriy10013zs97663j4gn2	GitHub Actions	DevOps	\N	Automate build, test, and deployment workflows.	2026-10-06 17:11:49.417	2026-11-01 20:48:28.841
cmuwxriy30014zs974xp5eax1	CI/CD	DevOps	\N	Implement continuous integration and deployment pipelines.	2026-10-06 17:11:49.419	2026-11-01 20:48:28.843
cmuwxriy40015zs9730ntljrc	AWS	Cloud Computing	\N	Build and deploy cloud-native applications on Amazon Web Services.	2026-10-06 17:11:49.42	2026-11-01 20:48:28.844
cmuwxriy50016zs97dp7ber2a	Microsoft Azure	Cloud Computing	\N	Develop and manage cloud solutions using Azure.	2026-10-06 17:11:49.421	2026-11-01 20:48:28.846
cmuwxriy80018zs97at92iyc3	Firebase	Cloud Computing	\N	Build full-stack applications using Firebase services.	2026-10-06 17:11:49.424	2026-11-01 20:48:28.851
cmuwxriy90019zs97ail20vv3	Data Structures	Computer Science Fundamentals	\N	Understand and implement linear and non-linear data structures.	2026-10-06 17:11:49.425	2026-11-01 20:48:28.854
cmuwxriyb001azs97bqyhu2ao	Algorithms	Computer Science Fundamentals	\N	Design efficient algorithms for solving computational problems.	2026-10-06 17:11:49.427	2026-11-01 20:48:28.856
cmuwxriyc001bzs97irj4ay31	Object-Oriented Programming (OOP)	Computer Science Fundamentals	\N	Apply object-oriented principles to software development.	2026-10-06 17:11:49.428	2026-11-01 20:48:28.857
cmuwxriyd001czs97lnk1mvpp	Database Management Systems (DBMS)	Computer Science Fundamentals	\N	Understand database concepts, normalization, and transactions.	2026-10-06 17:11:49.429	2026-11-01 20:48:28.859
cmuwxriye001dzs97q306gdtp	Operating Systems	Computer Science Fundamentals	\N	Learn process management, memory management, and scheduling.	2026-10-06 17:11:49.43	2026-11-01 20:48:28.861
cmuwxriyg001ezs974gzu4dh0	Computer Networks	Computer Science Fundamentals	\N	Understand networking protocols, routing, and communication.	2026-10-06 17:11:49.432	2026-11-01 20:48:28.862
cmuwxriyh001fzs9764qyt267	System Design	Software Architecture	\N	Design scalable, distributed, and reliable software systems.	2026-10-06 17:11:49.433	2026-11-01 20:48:28.864
cmuwxriyi001gzs975u1ll7tb	Software Engineering	Software Development	\N	Apply engineering principles throughout the software lifecycle.	2026-10-06 17:11:49.434	2026-11-01 20:48:28.867
cmuwxriyk001hzs97u14cd84t	Design Patterns	Software Architecture	\N	Use reusable software design solutions for common problems.	2026-10-06 17:11:49.436	2026-11-01 20:48:28.87
cmuwxriwl0004zs97ri5k3ueh	Data Analysis	Data Science	\N	Analyzing datasets with pandas and numpy.	2026-10-06 17:11:49.365	2026-11-01 20:48:28.908
cmuwxriwn0005zs97vvv6sudj	HTML	Frontend Development	\N	Build semantic and accessible web page structures.	2026-10-06 17:11:49.367	2026-11-01 20:48:28.755
cmuwxrizw002izs973fo5t0bw	Cloud Security	Cybersecurity	\N	Secure cloud infrastructure and cloud-native applications.	2026-10-06 17:11:49.484	2026-11-01 20:48:28.988
cmuwxrizz002kzs97tojyjeu2	Cryptography	Cybersecurity	\N	Apply encryption techniques to secure digital information.	2026-10-06 17:11:49.487	2026-11-01 20:48:28.992
cmuwxrj00002lzs97n15iyjh6	Digital Forensics	Cybersecurity	\N	Investigate and analyze digital evidence after security incidents.	2026-10-06 17:11:49.488	2026-11-01 20:48:28.993
cmuwxrj01002mzs97i0uip0dz	Incident Response	Cybersecurity	\N	Respond to and recover from cybersecurity incidents.	2026-10-06 17:11:49.489	2026-11-01 20:48:28.995
cmuwxrj04002ozs97g09nskwy	DevSecOps	Cybersecurity	\N	Integrate security practices into DevOps workflows.	2026-10-06 17:11:49.492	2026-11-01 20:48:28.998
cmuwxrj05002pzs97q42gp0lo	Vulnerability Assessment	Cybersecurity	\N	Identify, classify, and prioritize security vulnerabilities.	2026-10-06 17:11:49.493	2026-11-01 20:48:29
cmuwxrj06002qzs97df5ks0bb	Malware Analysis	Cybersecurity	\N	Analyze malicious software to understand its behavior and impact.	2026-10-06 17:11:49.494	2026-11-01 20:48:29.001
cmuwxrj07002rzs97l2oagyl3	Blockchain Fundamentals	Blockchain	\N	Understand decentralized ledger technology and blockchain concepts.	2026-10-06 17:11:49.495	2026-11-01 20:48:29.003
cmuwxrj09002szs97v6f3j80i	Smart Contracts	Blockchain	\N	Develop decentralized applications using smart contracts.	2026-10-06 17:11:49.497	2026-11-01 20:48:29.005
cmuwxrj0a002tzs972ln712t5	Solidity	Blockchain	\N	Write secure smart contracts for Ethereum-based applications.	2026-10-06 17:11:49.498	2026-11-01 20:48:29.007
cmuwxrj0b002uzs97mrzf3rna	Web3 Development	Blockchain	\N	Build decentralized applications using Web3 technologies.	2026-10-06 17:11:49.499	2026-11-01 20:48:29.008
cmuwxrj0d002vzs97ijzlcmw2	Security Operations Center (SOC)	Cybersecurity	\N	Monitor, detect, and respond to security threats in SOC environments.	2026-10-06 17:11:49.501	2026-11-01 20:48:29.01
cmuwxrizr002ezs97imxcr96q	Ethical Hacking	Cybersecurity	\N	Identify and assess vulnerabilities using ethical hacking techniques.	2026-10-06 17:11:49.479	2026-11-01 20:48:28.979
cmuwxriyl001izs97cbie8r6t	Problem Solving	Computer Science Fundamentals	\N	Develop logical and analytical thinking to solve coding problems.	2026-10-06 17:11:49.437	2026-11-01 20:48:28.872
cmuwxrizt002gzs97ki50wyod	Network Security	Cybersecurity	\N	Secure enterprise networks using industry-standard practices.	2026-10-06 17:11:49.481	2026-11-01 20:48:28.984
cmuwxrizv002hzs978txuto2f	Application Security	Cybersecurity	\N	Protect web and mobile applications from security threats.	2026-10-06 17:11:49.483	2026-11-01 20:48:28.986
cmuwxriyo001jzs97hzcl9aha	Competitive Programming	Programming	\N	Solve algorithmic challenges under time constraints.	2026-10-06 17:11:49.44	2026-11-01 20:48:28.874
cmuwxriyp001kzs97aokgoze5	SQL	Database	\N	Query and manage relational databases using SQL.	2026-10-06 17:11:49.441	2026-11-01 20:48:28.876
cmuwxriyr001lzs97h9u82wsu	NoSQL Databases	Database	\N	Work with document, key-value, and distributed databases.	2026-10-06 17:11:49.443	2026-11-01 20:48:28.878
cmuwxriys001mzs97c055dbdd	Redis	Database	\N	Use Redis for caching, messaging, and high-speed data storage.	2026-10-06 17:11:49.444	2026-11-01 20:48:28.88
cmuwxriyt001nzs97mplzbtom	Authentication & Authorization	Backend Development	\N	Implement secure authentication and role-based access control.	2026-10-06 17:11:49.445	2026-11-01 20:48:28.882
cmuwxriyu001ozs97tj3tu286	JWT Authentication	Backend Development	\N	Secure APIs using JSON Web Tokens.	2026-10-06 17:11:49.446	2026-11-01 20:48:28.885
cmuwxriyw001pzs97x4u2u29q	OAuth 2.0	Backend Development	\N	Integrate secure third-party authentication providers.	2026-10-06 17:11:49.448	2026-11-01 20:48:28.887
cmuwxriyx001qzs971jcq9qh4	Web Security	Cybersecurity	\N	Protect web applications against common security vulnerabilities.	2026-10-06 17:11:49.449	2026-11-01 20:48:28.889
cmuwxriyy001rzs97mj7jaxh4	API Testing	Backend Development	\N	Test REST and GraphQL APIs using modern testing tools.	2026-10-06 17:11:49.45	2026-11-01 20:48:28.891
cmuwxriyz001szs97m46fatk2	Unit Testing	Software Testing	\N	Write automated tests to ensure code quality and reliability.	2026-10-06 17:11:49.451	2026-11-01 20:48:28.893
cmuwxriz1001tzs97t6pi3y7k	Artificial Intelligence	Artificial Intelligence	\N	Understand the fundamentals of intelligent systems and AI techniques.	2026-10-06 17:11:49.453	2026-11-01 20:48:28.897
cmuwxriz3001uzs97ju2f9p7z	Machine Learning	Artificial Intelligence	\N	Build predictive models using supervised and unsupervised learning.	2026-10-06 17:11:49.455	2026-11-01 20:48:28.9
cmuwxriz4001vzs97baf4cafo	Deep Learning	Artificial Intelligence	\N	Develop neural network models for complex learning tasks.	2026-10-06 17:11:49.456	2026-11-01 20:48:28.903
cmuwxriz5001wzs977maxq6iy	Data Science	Data Science	\N	Extract insights from structured and unstructured data.	2026-10-06 17:11:49.457	2026-11-01 20:48:28.906
cmuwxriz8001yzs97zun633bm	NumPy	Data Science	\N	Perform efficient numerical computing with NumPy.	2026-10-06 17:11:49.46	2026-11-01 20:48:28.91
cmuwxriz9001zzs97x2i2kccx	Pandas	Data Science	\N	Manipulate, clean, and analyze datasets using Pandas.	2026-10-06 17:11:49.461	2026-11-01 20:48:28.911
cmuwxriza0020zs97pbhlrb6b	Matplotlib	Data Visualization	\N	Create data visualizations and analytical charts.	2026-10-06 17:11:49.462	2026-11-01 20:48:28.913
cmuwxrizb0021zs977zy167fq	Scikit-learn	Machine Learning	\N	Build machine learning models using Scikit-learn.	2026-10-06 17:11:49.463	2026-11-01 20:48:28.915
cmuwxrizc0022zs97yfhfir3m	TensorFlow	Deep Learning	\N	Develop deep learning models using TensorFlow.	2026-10-06 17:11:49.464	2026-11-01 20:48:28.918
cmuwxrizd0023zs976tnbeddf	PyTorch	Deep Learning	\N	Train and deploy neural network models with PyTorch.	2026-10-06 17:11:49.465	2026-11-01 20:48:28.921
cmuwxrize0024zs97v70zx6dp	Computer Vision	Artificial Intelligence	\N	Develop systems that analyze and interpret images and videos.	2026-10-06 17:11:49.466	2026-11-01 20:48:28.923
cmuwxrizf0025zs970u6hp2n2	Natural Language Processing (NLP)	Artificial Intelligence	\N	Build applications that understand and generate human language.	2026-10-06 17:11:49.467	2026-11-01 20:48:28.924
cmuwxrizg0026zs972cme36m3	Generative AI	Artificial Intelligence	\N	Create AI systems capable of generating text, images, audio, and code.	2026-10-06 17:11:49.468	2026-11-01 20:48:28.926
cmuwxrizi0027zs97sdwh8eld	Large Language Models (LLMs)	Artificial Intelligence	\N	Work with transformer-based language models and applications.	2026-10-06 17:11:49.47	2026-11-01 20:48:28.928
cmuwxrizj0028zs97yywbhlla	Prompt Engineering	Artificial Intelligence	\N	Design effective prompts for AI and language models.	2026-10-06 17:11:49.471	2026-11-01 20:48:28.93
cmuwxrizk0029zs9770affu2w	MLOps	Machine Learning	\N	Deploy, monitor, and manage machine learning models in production.	2026-10-06 17:11:49.472	2026-11-01 20:48:28.932
cmuwxrizm002azs97fp05fb6k	Feature Engineering	Machine Learning	\N	Create meaningful input features to improve model performance.	2026-10-06 17:11:49.474	2026-11-01 20:48:28.935
cmuwxrizn002bzs976byqd5c4	Model Deployment	Machine Learning	\N	Deploy machine learning models as scalable production services.	2026-10-06 17:11:49.475	2026-11-01 20:48:28.937
cmuwxrizo002czs97lkkxv70w	Statistics	Data Science	\N	Apply statistical concepts for data analysis and machine learning.	2026-10-06 17:11:49.476	2026-11-01 20:48:28.939
cmuwxrizs002fzs97nufthym7	Penetration Testing	Cybersecurity	\N	Perform authorized security testing on systems and applications.	2026-10-06 17:11:49.48	2026-11-01 20:48:28.982
cmuwxrj25004czs9761br0r2q	Communication Skills	Professional Skills	\N	Communicate ideas effectively in written and verbal formats.	2026-10-06 17:11:49.565	2026-11-01 20:48:29.074
cmuwxrj24004bzs97mbloizc6	Stakeholder Management	Business	\N	Manage relationships with clients, teams, and business stakeholders.	2026-10-06 17:11:49.564	2026-11-01 20:48:29.072
cmuwxrj16003izs97fvom49ug	UX Design	UI/UX Design	\N	Create seamless and user-centered digital experiences.	2026-10-06 17:11:49.53	2026-11-01 20:48:29.015
cmuwxrj18003jzs97m23pd37i	Figma	UI/UX Design	\N	Design interfaces, prototypes, and collaborative design systems using Figma.	2026-10-06 17:11:49.532	2026-11-01 20:48:29.018
cmuwxrj19003kzs97pdg7pc6r	Adobe XD	UI/UX Design	\N	Create interactive UI prototypes and wireframes.	2026-10-06 17:11:49.533	2026-11-01 20:48:29.02
cmuwxrj1a003lzs97w2gpafnh	Sketch	UI/UX Design	\N	Design digital products and reusable UI components.	2026-10-06 17:11:49.534	2026-11-01 20:48:29.021
cmuwxrj1c003mzs97lh0oc618	Wireframing	UI/UX Design	\N	Create low-fidelity layouts to plan user interfaces.	2026-10-06 17:11:49.536	2026-11-01 20:48:29.023
cmuwxrj1d003nzs97354zlrge	Prototyping	UI/UX Design	\N	Build interactive prototypes for testing and validation.	2026-10-06 17:11:49.537	2026-11-01 20:48:29.024
cmuwxrj1e003ozs97cfhiw2lp	User Research	UI/UX Design	\N	Conduct research to understand user needs and behaviors.	2026-10-06 17:11:49.538	2026-11-01 20:48:29.026
cmuwxrj1g003pzs97ogw4lc9h	Usability Testing	UI/UX Design	\N	Evaluate products by observing real users completing tasks.	2026-10-06 17:11:49.54	2026-11-01 20:48:29.027
cmuwxrj1h003qzs973lfjzehg	Information Architecture	UI/UX Design	\N	Organize content and navigation for optimal usability.	2026-10-06 17:11:49.541	2026-11-01 20:48:29.029
cmuwxrj1i003rzs97pyesdae2	Interaction Design	UI/UX Design	\N	Design meaningful interactions between users and products.	2026-10-06 17:11:49.542	2026-11-01 20:48:29.03
cmuwxrj1k003szs975oi63exi	Design Systems	UI/UX Design	\N	Create reusable components and design standards for products.	2026-10-06 17:11:49.544	2026-11-01 20:48:29.033
cmuwxrj1n003tzs977up9d2c9	Accessibility (WCAG)	UI/UX Design	\N	Design inclusive digital experiences that meet accessibility standards.	2026-10-06 17:11:49.547	2026-11-01 20:48:29.037
cmuwxrj1o003uzs97zrkzfpki	Responsive Design	UI/UX Design	\N	Design interfaces that adapt seamlessly across devices.	2026-10-06 17:11:49.548	2026-11-01 20:48:29.039
cmuwxrj1p003vzs97irotvq9n	Motion Design	UI/UX Design	\N	Create animations that improve usability and user engagement.	2026-10-06 17:11:49.549	2026-11-01 20:48:29.042
cmuwxrj1q003wzs97jd221hsp	Graphic Design	Design	\N	Create visual assets for digital and print media.	2026-10-06 17:11:49.55	2026-11-01 20:48:29.044
cmuwxrj1r003xzs97ryomaxdl	Adobe Photoshop	Design	\N	Edit and create raster graphics for digital products.	2026-10-06 17:11:49.551	2026-11-01 20:48:29.046
cmuwxrj1s003yzs97bcso90ul	Adobe Illustrator	Design	\N	Design vector graphics, icons, and branding assets.	2026-10-06 17:11:49.552	2026-11-01 20:48:29.048
cmuwxrj1t003zzs97dehv7ibh	Brand Identity Design	Design	\N	Develop consistent visual identities for products and organizations.	2026-10-06 17:11:49.553	2026-11-01 20:48:29.051
cmuwxrj1u0040zs975x4e1jo1	Typography	Design	\N	Apply typography principles to improve readability and visual hierarchy.	2026-10-06 17:11:49.554	2026-11-01 20:48:29.053
cmuwxrj1v0041zs9774wwwkhi	Product Management	Product & Business	\N	Lead the strategy, development, and lifecycle of digital products.	2026-10-06 17:11:49.555	2026-11-01 20:48:29.055
cmuwxrj1w0042zs97jwj183ed	Product Strategy	Product & Business	\N	Define product vision, roadmap, and long-term business goals.	2026-10-06 17:11:49.556	2026-11-01 20:48:29.057
cmuwxrj1x0043zs97pbv0437t	Business Analysis	Product & Business	\N	Analyze business requirements and translate them into technical solutions.	2026-10-06 17:11:49.557	2026-11-01 20:48:29.059
cmuwxrj1y0044zs972zxpj2so	Market Research	Product & Business	\N	Study market trends, competitors, and customer behavior.	2026-10-06 17:11:49.558	2026-11-01 20:48:29.061
cmuwxrj1z0045zs97ak3lqkxn	Business Strategy	Product & Business	\N	Develop strategies to achieve organizational objectives and growth.	2026-10-06 17:11:49.559	2026-11-01 20:48:29.062
cmuwxrj200046zs97kogkc95d	Agile Methodology	Project Management	\N	Manage projects using Agile principles and iterative development.	2026-10-06 17:11:49.56	2026-11-01 20:48:29.064
cmuwxrj210047zs97hc05u8ax	Scrum	Project Management	\N	Apply Scrum practices for effective software development teams.	2026-10-06 17:11:49.561	2026-11-01 20:48:29.066
cmuwxrj220048zs974emmd68w	Kanban	Project Management	\N	Manage workflows and improve team productivity using Kanban.	2026-10-06 17:11:49.562	2026-11-01 20:48:29.068
cmuwxrj230049zs974y1cv83p	Project Management	Project Management	\N	Plan, execute, monitor, and deliver successful projects.	2026-10-06 17:11:49.563	2026-11-01 20:48:29.07
cmuwxrj0e002wzs97zwca145p	Risk Management	Project Management	\N	Assess and mitigate organizational cybersecurity risks.	2026-10-06 17:11:49.502	2026-11-01 20:48:29.071
cmuwxrj26004dzs97rvdeqxm0	Presentation Skills	Professional Skills	\N	Deliver engaging and impactful presentations to audiences.	2026-10-06 17:11:49.566	2026-11-01 20:48:29.076
cmuwxrj27004ezs97j5ito14j	Leadership	Professional Skills	\N	Lead teams, make decisions, and drive organizational success.	2026-10-06 17:11:49.567	2026-11-01 20:48:29.078
cmuwxrj28004fzs97oihi3mic	Negotiation	Professional Skills	\N	Reach mutually beneficial agreements through effective negotiation.	2026-10-06 17:11:49.568	2026-11-01 20:48:29.08
cmuwxrj29004gzs97285s5v9c	Critical Thinking	Professional Skills	\N	Analyze problems objectively and make informed decisions.	2026-10-06 17:11:49.569	2026-11-01 20:48:29.082
cmuwxrj2a004hzs975srrc5mj	Time Management	Professional Skills	\N	Prioritize tasks and manage time efficiently to improve productivity.	2026-10-06 17:11:49.57	2026-11-01 20:48:29.084
cmuwxrj2b004izs977v4amwnw	Entrepreneurship	Startup	\N	Build, launch, and scale innovative businesses and startups.	2026-10-06 17:11:49.571	2026-11-01 20:48:29.085
cmuwxrj2b004jzs9775iq1mpj	Startup Fundamentals	Startup	\N	Understand startup ecosystems, fundraising, and growth strategies.	2026-10-06 17:11:49.571	2026-11-01 20:48:29.087
cmuwxrj2d004lzs972sawj3lu	Android Development	Mobile Development	\N	Build native Android applications using modern development tools.	2026-10-06 17:11:49.573	2026-11-01 20:48:29.09
cmuwxrj2f004mzs974h2j0bzq	iOS Development	Mobile Development	\N	Develop native iOS applications using Apple's ecosystem.	2026-10-06 17:11:49.575	2026-11-01 20:48:29.091
cmuwxrj2g004nzs97bv8gfh59	Flutter	Mobile Development	\N	Build cross-platform mobile applications using Flutter.	2026-10-06 17:11:49.576	2026-11-01 20:48:29.092
cmuwxrj2h004ozs97pdaelbot	React Native	Mobile Development	\N	Create cross-platform mobile applications using React Native.	2026-10-06 17:11:49.577	2026-11-01 20:48:29.094
cmuwxrj2i004pzs97flept5yx	Jetpack Compose	Mobile Development	\N	Develop modern Android user interfaces using Jetpack Compose.	2026-10-06 17:11:49.578	2026-11-01 20:48:29.096
cmuwxrizx002jzs97yp8sazg5	Identity & Access Management (IAM)	Cybersecurity	\N	Manage user identities, authentication, and authorization.	2026-10-06 17:11:49.485	2026-11-01 20:48:28.99
cmuwxrizq002dzs978q2i3zti	Cybersecurity Fundamentals	Cybersecurity	\N	Understand the core principles of information and network security.	2026-10-06 17:11:49.478	2026-11-01 20:48:28.976
cmuwxrj15003hzs97wlwczjs7	UI Design	UI/UX Design	\N	Design visually appealing and intuitive user interfaces.	2026-10-06 17:11:49.529	2026-11-01 20:48:29.013
cmuwxrj2m004tzs976ww5a2y3	Push Notifications	Mobile Development	\N	Implement real-time push notifications for mobile applications.	2026-10-06 17:11:49.582	2026-11-01 20:48:29.105
cmuwxrj2n004uzs975dtb5kxh	Mobile UI Design	Mobile Development	\N	Design responsive and user-friendly mobile application interfaces.	2026-10-06 17:11:49.583	2026-11-01 20:48:29.107
cmuwxrj2o004vzs97y4vthj54	Cross-Platform Development	Mobile Development	\N	Develop applications that run on multiple mobile platforms.	2026-10-06 17:11:49.584	2026-11-01 20:48:29.109
cmuwxrj2p004wzs970b3icais	Progressive Web Apps (PWA)	Web Development	\N	Build installable and offline-capable web applications.	2026-10-06 17:11:49.585	2026-11-01 20:48:29.11
cmuwxrj2q004xzs97r4yveurr	App Performance Optimization	Mobile Development	\N	Improve application speed, responsiveness, and efficiency.	2026-10-06 17:11:49.586	2026-11-01 20:48:29.112
cmuwxrj2q004yzs9764nwi2ym	Mobile Testing	Mobile Development	\N	Test mobile applications for functionality, performance, and usability.	2026-10-06 17:11:49.587	2026-11-01 20:48:29.113
cmuwxrj2s0050zs97aw7wgdo7	Mobile Security	Mobile Development	\N	Protect mobile applications against common security threats.	2026-10-06 17:11:49.588	2026-11-01 20:48:29.118
cmuwxrj2t0051zs979ykupfpd	Offline Data Synchronization	Mobile Development	\N	Enable offline-first experiences with local data synchronization.	2026-10-06 17:11:49.589	2026-11-01 20:48:29.119
cmuwxrj2u0052zs97lzqw3j5y	Location Services	Mobile Development	\N	Integrate GPS and location-based services into mobile applications.	2026-10-06 17:11:49.59	2026-11-01 20:48:29.121
cmuwxrj2v0053zs9728zfshgb	Camera & Media APIs	Mobile Development	\N	Use device camera, gallery, and media capabilities within applications.	2026-10-06 17:11:49.591	2026-11-01 20:48:29.122
cmuwxrj2w0054zs97bcx3eee3	Mobile Architecture	Mobile Development	\N	Design scalable and maintainable architectures for mobile applications.	2026-10-06 17:11:49.592	2026-11-01 20:48:29.123
cmuwxrj2x0055zs97a1d3p5wl	Game Development	Game Development	\N	Develop 2D and 3D games for desktop, mobile, and console platforms.	2026-10-06 17:11:49.593	2026-11-01 20:48:29.125
cmuwxrj2y0056zs97asnalrqi	Unity	Game Development	\N	Build interactive games and simulations using the Unity engine.	2026-10-06 17:11:49.594	2026-11-01 20:48:29.126
cmuwxrj2z0057zs97r97fwdp1	Unreal Engine	Game Development	\N	Create high-quality 3D games and real-time experiences using Unreal Engine.	2026-10-06 17:11:49.595	2026-11-01 20:48:29.127
cmuwxrj2z0058zs971yz8z4fz	AR Development	Extended Reality (XR)	\N	Develop augmented reality experiences for mobile and wearable devices.	2026-10-06 17:11:49.595	2026-11-01 20:48:29.128
cmuwxrj300059zs97u8mwdfav	VR Development	Extended Reality (XR)	\N	Build immersive virtual reality applications and simulations.	2026-10-06 17:11:49.596	2026-11-01 20:48:29.13
cmuwxrj31005azs97nit99l9x	Computer Graphics	Graphics	\N	Understand rendering, shading, and graphical programming concepts.	2026-10-06 17:11:49.597	2026-11-01 20:48:29.131
cmuwxrj32005bzs97oau8ps4s	IoT Development	Internet of Things	\N	Build connected smart devices and IoT solutions.	2026-10-06 17:11:49.598	2026-11-01 20:48:29.133
cmuwxrj33005czs97lbsap0l7	Embedded Systems	Embedded Systems	\N	Develop firmware and software for embedded hardware platforms.	2026-10-06 17:11:49.599	2026-11-01 20:48:29.135
cmuwxrj34005dzs97kdwamcq4	Arduino	Embedded Systems	\N	Prototype embedded systems and automation projects using Arduino.	2026-10-06 17:11:49.6	2026-11-01 20:48:29.136
cmuwxrj35005ezs97ol1buu6y	Raspberry Pi	Embedded Systems	\N	Develop Linux-based embedded applications using Raspberry Pi.	2026-10-06 17:11:49.601	2026-11-01 20:48:29.138
cmuwxrj36005fzs974bmfuf8l	ESP32 & ESP8266	Internet of Things	\N	Build Wi-Fi and Bluetooth enabled IoT applications.	2026-10-06 17:11:49.602	2026-11-01 20:48:29.139
cmuwxrj36005gzs97k7tb9hq6	Robotics	Robotics	\N	Design and program robotic systems for automation and research.	2026-10-06 17:11:49.602	2026-11-01 20:48:29.14
cmuwxrj37005hzs97p99axzz0	Robot Operating System (ROS)	Robotics	\N	Develop robotic applications using the Robot Operating System framework.	2026-10-06 17:11:49.603	2026-11-01 20:48:29.141
cmuwxrj38005izs97ys4845vg	Drone Technology	Robotics	\N	Design, control, and develop autonomous drone systems.	2026-10-06 17:11:49.604	2026-11-01 20:48:29.143
cmuwxrj39005jzs97wrboqjzu	PCB Design	Electronics	\N	Design printed circuit boards for electronic systems.	2026-10-06 17:11:49.605	2026-11-01 20:48:29.144
cmuwxrj3a005kzs97p369cywu	FPGA Development	Semiconductor	\N	Develop programmable digital hardware using FPGA platforms.	2026-10-06 17:11:49.606	2026-11-01 20:48:29.145
cmuwxrj3b005lzs97z4m5gmfm	VLSI Design	Semiconductor	\N	Design and verify integrated circuits using VLSI methodologies.	2026-10-06 17:11:49.607	2026-11-01 20:48:29.146
cmuwxrj3c005mzs97lzcrn3va	Microcontrollers	Embedded Systems	\N	Program and interface microcontrollers for embedded applications.	2026-10-06 17:11:49.608	2026-11-01 20:48:29.147
cmuwxrj3d005nzs972onxang0	Industrial Automation	Automation	\N	Develop automated systems for manufacturing and industrial processes.	2026-10-06 17:11:49.609	2026-11-01 20:48:29.149
cmuwxrj3e005ozs97d4gdmdia	Computer-Aided Design (CAD)	Engineering	\N	Create engineering designs and technical drawings using CAD software.	2026-10-06 17:11:49.61	2026-11-01 20:48:29.151
cmuwxrj3f005pzs97b3vx23s9	Financial Analysis	Finance	\N	Analyze financial statements, business performance, and investment opportunities.	2026-10-06 17:11:49.611	2026-11-01 20:48:29.152
cmuwxrj3g005qzs97223is4xb	Financial Modeling	Finance	\N	Build financial models for forecasting, valuation, and business planning.	2026-10-06 17:11:49.612	2026-11-01 20:48:29.154
cmuwxrj3h005rzs977ijhdjsp	Investment Analysis	Finance	\N	Evaluate investment opportunities using financial and market data.	2026-10-06 17:11:49.613	2026-11-01 20:48:29.155
cmuwxrj3i005szs97mry7xp24	Business Consulting	Consulting	\N	Provide strategic recommendations to improve business performance.	2026-10-06 17:11:49.614	2026-11-01 20:48:29.156
cmuwxrj3j005tzs97emkartkl	Management Consulting	Consulting	\N	Solve organizational challenges through strategic planning and execution.	2026-10-06 17:11:49.615	2026-11-01 20:48:29.157
cmuwxrj3k005uzs97yjy80z6m	Business Intelligence	Data & Analytics	\N	Transform business data into actionable insights for decision-making.	2026-10-06 17:11:49.616	2026-11-01 20:48:29.158
cmuwxrj3l005vzs9720r4bkra	Data Engineering	Data Engineering	\N	Build scalable data pipelines and processing systems.	2026-10-06 17:11:49.617	2026-11-01 20:48:29.159
cmuwxrj3m005wzs97op32tfol	Apache Spark	Data Engineering	\N	Process and analyze large-scale datasets using Apache Spark.	2026-10-06 17:11:49.618	2026-11-01 20:48:29.161
cmuwxrj3m005xzs97gejps0oz	Cloud Architecture	Cloud Computing	\N	Design scalable, secure, and resilient cloud infrastructure.	2026-10-06 17:11:49.618	2026-11-01 20:48:29.162
cmuwxrj3n005yzs97e93rbmpn	Site Reliability Engineering (SRE)	Cloud Computing	\N	Ensure reliability, scalability, and performance of production systems.	2026-10-06 17:11:49.619	2026-11-01 20:48:29.164
cmuwxrj3o005zzs97vmtb0h7k	Healthcare Informatics	Healthcare Technology	\N	Manage and analyze healthcare information systems and data.	2026-10-06 17:11:49.62	2026-11-01 20:48:29.166
cmuwxrj3p0060zs97svh3we5o	Medical Imaging	Healthcare Technology	\N	Work with digital imaging technologies used in healthcare.	2026-10-06 17:11:49.621	2026-11-01 20:48:29.168
cmuwxrj2k004rzs97njur7xp5	Android SDK	Mobile Development	\N	Develop Android applications using the Android SDK.	2026-10-06 17:11:49.58	2026-11-01 20:48:29.101
cmuwxrj3s0063zs97go8cxz9w	Telecommunication Systems	Telecommunications	\N	Understand modern communication networks and telecom infrastructure.	2026-10-06 17:11:49.624	2026-11-01 20:48:29.175
cmuwxrj3t0064zs9737egjcu4	5G Technologies	Telecommunications	\N	Understand the architecture and applications of 5G communication systems.	2026-10-06 17:11:49.625	2026-11-01 20:48:29.176
cmuwxrj3u0065zs978edv8uk7	Semiconductor Manufacturing	Semiconductor	\N	Understand semiconductor fabrication and chip manufacturing processes.	2026-10-06 17:11:49.626	2026-11-01 20:48:29.177
cmuwxrj3v0066zs9711pu8clr	Electronic Circuit Design	Electronics	\N	Design analog and digital electronic circuits for embedded systems.	2026-10-06 17:11:49.627	2026-11-01 20:48:29.178
cmuwxrj3w0067zs9787kebbd6	Research Methodology	Research & Development	\N	Conduct systematic research using scientific methods and experimental design.	2026-10-06 17:11:49.628	2026-11-01 20:48:29.18
cmuwxrj3x0068zs97399vba04	Technical Documentation	Professional Skills	\N	Create clear, structured, and maintainable technical documentation.	2026-10-06 17:11:49.629	2026-11-01 20:48:29.182
cmuwxrj3y0069zs97tfbbktdb	Resume Writing	Career Development	\N	Create professional resumes tailored to specific job roles.	2026-10-06 17:11:49.63	2026-11-01 20:48:29.183
cmuwxrj3z006azs97pvk39423	ATS Resume Optimization	Career Development	\N	Optimize resumes to improve compatibility with Applicant Tracking Systems.	2026-10-06 17:11:49.631	2026-11-01 20:48:29.185
cmuwxrj3z006bzs97t4vx3emt	Cover Letter Writing	Career Development	\N	Write compelling cover letters tailored to employers and job roles.	2026-10-06 17:11:49.631	2026-11-01 20:48:29.187
cmuwxrj40006czs97xnjiyqf5	LinkedIn Optimization	Career Development	\N	Build a professional LinkedIn profile that attracts recruiters.	2026-10-06 17:11:49.632	2026-11-01 20:48:29.189
cmuwxrj41006dzs974ouhqh64	Portfolio Development	Career Development	\N	Create a professional portfolio showcasing projects and achievements.	2026-10-06 17:11:49.633	2026-11-01 20:48:29.191
cmuwxrj42006ezs97e2syj6hh	Technical Interview Preparation	Career Development	\N	Prepare for coding and technical interviews using structured practice.	2026-10-06 17:11:49.634	2026-11-01 20:48:29.192
cmuwxrj43006fzs97k43fv5bg	Behavioral Interview Preparation	Career Development	\N	Prepare for HR and behavioral interviews using structured responses.	2026-10-06 17:11:49.635	2026-11-01 20:48:29.193
cmuwxrj44006gzs97pkqa2lg2	Mock Interviews	Career Development	\N	Practice interviews through realistic simulations and feedback.	2026-10-06 17:11:49.636	2026-11-01 20:48:29.195
cmuwxrj45006hzs97c2spbai9	Salary Negotiation	Career Development	\N	Negotiate compensation confidently during job offers.	2026-10-06 17:11:49.637	2026-11-01 20:48:29.196
cmuwxrj46006izs97v6ygkc1b	Networking	Career Development	\N	Build meaningful professional relationships to advance your career.	2026-10-06 17:11:49.638	2026-11-01 20:48:29.197
cmuwxrj47006jzs9798fgxc3r	Personal Branding	Career Development	\N	Develop a strong professional identity across online and offline platforms.	2026-10-06 17:11:49.639	2026-11-01 20:48:29.199
cmuwxrj48006kzs97hlcchgsr	Public Speaking	Professional Skills	\N	Communicate ideas confidently to audiences of all sizes.	2026-10-06 17:11:49.64	2026-11-01 20:48:29.201
cmuwxrj49006lzs974joetgt3	Technical Writing	Professional Skills	\N	Write clear documentation, tutorials, and technical articles.	2026-10-06 17:11:49.641	2026-11-01 20:48:29.202
cmuwxrj4b006mzs97wwutzjh3	Open Source Contribution	Open Source	\N	Contribute to open-source projects through code, documentation, and reviews.	2026-10-06 17:11:49.643	2026-11-01 20:48:29.204
cmuwxrj4c006nzs97gnoqdzun	Code Review	Software Development	\N	Review code to improve quality, maintainability, and performance.	2026-10-06 17:11:49.644	2026-11-01 20:48:29.205
cmuwxrj4d006ozs970kwjyz3l	Mentoring	Professional Skills	\N	Guide and support learners and junior professionals in their growth.	2026-10-06 17:11:49.645	2026-11-01 20:48:29.206
cmuwxrj4e006pzs973xwkulbf	Teaching	Professional Skills	\N	Design and deliver educational content effectively.	2026-10-06 17:11:49.646	2026-11-01 20:48:29.208
cmuwxrj4f006qzs97cb3kemn7	Community Building	Professional Skills	\N	Build and manage thriving professional and technical communities.	2026-10-06 17:11:49.647	2026-11-01 20:48:29.209
cmuwxrj4g006rzs97xwhmdy72	Freelancing	Business	\N	Manage freelance projects, clients, contracts, and payments.	2026-10-06 17:11:49.648	2026-11-01 20:48:29.21
cmuwxrj4i006tzs9799guyy8t	Jenkins	DevOps	\N	Automate software build, testing, and deployment pipelines using Jenkins.	2026-10-06 17:11:49.65	2026-11-01 20:48:29.213
cmuwxrj4j006uzs97dufu2io0	Terraform	DevOps	\N	Provision and manage cloud infrastructure using Infrastructure as Code.	2026-10-06 17:11:49.651	2026-11-01 20:48:29.215
cmuwxrj4k006vzs97soazvywl	Ansible	DevOps	\N	Automate configuration management and application deployment.	2026-10-06 17:11:49.652	2026-11-01 20:48:29.216
cmuwxrj4l006wzs97jdn1z181	Helm	DevOps	\N	Package, deploy, and manage Kubernetes applications using Helm charts.	2026-10-06 17:11:49.653	2026-11-01 20:48:29.218
cmuwxrj4m006xzs97psm0gk30	Nginx	DevOps	\N	Configure high-performance web servers, reverse proxies, and load balancers.	2026-10-06 17:11:49.654	2026-11-01 20:48:29.219
cmuwxrj4n006yzs973nq324yz	Apache HTTP Server	DevOps	\N	Deploy and manage web applications using Apache HTTP Server.	2026-10-06 17:11:49.655	2026-11-01 20:48:29.221
cmuwxrj4o006zzs97s1vpy4af	Prometheus	Monitoring & Observability	\N	Collect and monitor metrics for applications and infrastructure.	2026-10-06 17:11:49.656	2026-11-01 20:48:29.222
cmuwxrj4q0070zs97tr2hqm9a	Grafana	Monitoring & Observability	\N	Visualize metrics and create monitoring dashboards using Grafana.	2026-10-06 17:11:49.658	2026-11-01 20:48:29.224
cmuwxrj4r0071zs97liokh8tj	ELK Stack	Monitoring & Observability	\N	Centralize logging and analytics using Elasticsearch, Logstash, and Kibana.	2026-10-06 17:11:49.659	2026-11-01 20:48:29.226
cmuwxrj4s0072zs9783atfwd7	Kafka	Data Engineering	\N	Build scalable real-time event streaming applications using Apache Kafka.	2026-10-06 17:11:49.66	2026-11-01 20:48:29.228
cmuwxrj4u0073zs97zsz4sbhq	RabbitMQ	Backend Development	\N	Implement asynchronous messaging and distributed communication.	2026-10-06 17:11:49.662	2026-11-01 20:48:29.231
cmuwxrj4v0074zs97n6poddmn	Microservices Architecture	Software Architecture	\N	Design scalable systems using independently deployable services.	2026-10-06 17:11:49.663	2026-11-01 20:48:29.234
cmuwxrj4w0075zs97ydwaoayq	Service Mesh	Cloud Computing	\N	Manage secure communication between microservices using service mesh technologies.	2026-10-06 17:11:49.664	2026-11-01 20:48:29.236
cmuwxrj4x0076zs976ne3ia5z	Istio	Cloud Computing	\N	Secure, monitor, and manage microservices using Istio.	2026-10-06 17:11:49.665	2026-11-01 20:48:29.238
cmuwxrj4y0077zs973lkf1m7n	Load Balancing	Cloud Computing	\N	Distribute application traffic across multiple servers efficiently.	2026-10-06 17:11:49.666	2026-11-01 20:48:29.239
cmuwxrj4z0078zs976isl1qk8	Infrastructure as Code (IaC)	DevOps	\N	Manage infrastructure through version-controlled configuration files.	2026-10-06 17:11:49.667	2026-11-01 20:48:29.241
cmuwxrj500079zs970eo3a0ac	Container Orchestration	DevOps	\N	Deploy, scale, and manage containerized workloads across clusters.	2026-10-06 17:11:49.668	2026-11-01 20:48:29.242
cmuwxrj51007azs972azacvh9	Monitoring & Logging	Monitoring & Observability	\N	Monitor application health and analyze logs for troubleshooting.	2026-10-06 17:11:49.669	2026-11-01 20:48:29.243
cmuwxrj3r0062zs974ozvo5lc	AUTOSAR	Automotive	\N	Develop standardized automotive software architectures using AUTOSAR.	2026-10-06 17:11:49.623	2026-11-01 20:48:29.173
cmuwxriwq0007zs973eigqsc5	JavaScript	Frontend Development	\N	Develop interactive web applications using JavaScript.	2026-10-06 17:11:49.37	2026-11-01 20:48:28.76
cmuwxriy60017zs973feyo20v	Google Cloud Platform	Cloud Computing	\N	Deploy scalable applications using Google Cloud Platform.	2026-10-06 17:11:49.422	2026-11-01 20:48:28.848
cmuwxrj03002nzs97p9y02v80	Security Information and Event Management (SIEM)	Cybersecurity	\N	Monitor and analyze security events using SIEM platforms.	2026-10-06 17:11:49.491	2026-11-01 20:48:28.996
cmuwxrj2c004kzs97rbch39as	Innovation Management	Startup	\N	Drive innovation through experimentation, validation, and continuous improvement.	2026-10-06 17:11:49.572	2026-11-01 20:48:29.088
cmuwxrj2j004qzs97w4bw1xlw	SwiftUI	Mobile Development	\N	Build declarative user interfaces for Apple platforms using SwiftUI.	2026-10-06 17:11:49.579	2026-11-01 20:48:29.099
cmuwxrj2l004szs97rf2n5ona	Firebase Authentication	Mobile Development	\N	Implement secure authentication in mobile applications using Firebase.	2026-10-06 17:11:49.581	2026-11-01 20:48:29.103
cmuwxrj2r004zzs97sdhs18xh	App Store Deployment	Mobile Development	\N	Publish and maintain applications on the Google Play Store and Apple App Store.	2026-10-06 17:11:49.587	2026-11-01 20:48:29.114
cmuwxrj3q0061zs97if4ha1pq	Automotive Software Development	Automotive	\N	Develop software systems for connected and autonomous vehicles.	2026-10-06 17:11:49.622	2026-11-01 20:48:29.171
cmuwxrj4h006szs97z7m5no4d	Client Communication	Business	\N	Communicate professionally with clients to build long-term relationships.	2026-10-06 17:11:49.649	2026-11-01 20:48:29.212
cmuwxrj52007bzs97bgrjh89f	Performance Optimization	Software Engineering	\N	Improve application performance, scalability, and resource utilization.	2026-10-06 17:11:49.67	2026-11-01 20:48:29.244
cmuwxrj53007czs97t3uw28z8	High Availability Systems	Cloud Computing	\N	Design fault-tolerant systems that minimize downtime and ensure reliability.	2026-10-06 17:11:49.671	2026-11-01 20:48:29.246
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, "emailVerified", image, password, role, status, headline, bio, location, "createdAt", "updatedAt") FROM stdin;
usr_seed_admin	System Administrator	admin@flowctrl.dev	\N	\N	$2b$10$hEY/K9IzZO.rGoVCIEdPieJWSSwrDs90VuAzyMEexfufHbM9/FoWu	ADMIN	ACTIVE	\N	\N	\N	2026-10-06 17:11:49.775	2026-10-06 17:11:49.775
usr_seed_alex	Alex Johnson	alex@flowctrl.dev	\N	\N	$2b$10$hEY/K9IzZO.rGoVCIEdPieJWSSwrDs90VuAzyMEexfufHbM9/FoWu	USER	ACTIVE	\N	\N	\N	2026-10-06 17:11:49.791	2026-10-06 17:11:49.791
usr_seed_mentor	Sarah Lin	mentor@flowctrl.dev	\N	\N	$2b$10$hEY/K9IzZO.rGoVCIEdPieJWSSwrDs90VuAzyMEexfufHbM9/FoWu	MENTOR	ACTIVE	\N	\N	\N	2026-10-06 17:11:49.8	2026-10-06 17:11:49.8
usr_seed_recruiter	Marcus Vance	recruiter@flowctrl.dev	\N	\N	$2b$10$hEY/K9IzZO.rGoVCIEdPieJWSSwrDs90VuAzyMEexfufHbM9/FoWu	RECRUITER	ACTIVE	\N	\N	\N	2026-10-06 17:11:49.807	2026-10-06 17:11:49.807
cmux1mf9x0000zs97oo8zo9f0	test1	test@gmail.com	\N	\N	$2b$10$9F0pWgncBDQ3jWv6gc8FEujgjeJqusn5LUzqo0dRDHtPqgavXaieu	USER	ACTIVE	\N	\N	\N	2026-10-06 18:59:49.845	2026-10-06 18:59:49.845
\.


--
-- Data for Name: UserMembership; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserMembership" (id, "userId", "planId", tier, status, "startDate", "expiresAt", "autoRenew", "cancelledAt", "lastVerifiedAt", "createdAt", "updatedAt") FROM stdin;
cmvyayb5l007g2w97ry291u7y	usr_seed_admin	cmvyayb4n007e2w977a2m9grd	PREMIUM	ACTIVE	2026-11-01 20:48:29.433	2027-11-01 20:48:29.428	t	\N	2026-11-01 20:48:29.433	2026-11-01 20:48:29.433	2026-11-01 20:48:29.433
cmvyayb67007m2w97g5e64k70	usr_seed_recruiter	cmvyayb4b007d2w97u43xgrno	FREE	ACTIVE	2026-11-01 20:48:29.455	\N	f	\N	2026-11-01 20:48:29.455	2026-11-01 20:48:29.455	2026-11-01 20:48:29.455
cmvyayb6a007o2w972ib0twni	cmux1mf9x0000zs97oo8zo9f0	cmvyayb4b007d2w97u43xgrno	FREE	ACTIVE	2026-11-01 20:48:29.458	\N	f	\N	2026-11-01 20:48:29.458	2026-11-01 20:48:29.458	2026-11-01 20:48:29.458
cmvyayb62007k2w9766ptti9d	usr_seed_mentor	cmvyayb4b007d2w97u43xgrno	FREE	ACTIVE	2026-11-02 15:50:34.259	\N	f	\N	2026-11-02 15:50:34.259	2026-11-01 20:48:29.45	2026-11-02 15:50:34.597
cmvyayb5w007i2w97er69a5df	usr_seed_alex	cmvyayb4n007e2w977a2m9grd	PREMIUM	ACTIVE	2026-11-01 20:48:29.444	2027-11-01 20:48:29.428	f	2026-11-02 15:50:34.632	2026-11-01 20:48:29.444	2026-11-01 20:48:29.444	2026-11-02 15:50:34.635
\.


--
-- Data for Name: UserPreference; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserPreference" ("userId", theme, "emailNotifications", "weeklyDigest", "jobAlerts", "profileVisibility", "careerGoalVisibility", "customSettings", "createdAt", "updatedAt") FROM stdin;
usr_seed_admin	dark	t	t	t	PUBLIC	t	{}	2026-10-06 17:11:49.775	2026-10-06 17:11:49.775
usr_seed_alex	dark	t	t	t	PUBLIC	t	{}	2026-10-06 17:11:49.791	2026-10-06 17:11:49.791
usr_seed_mentor	dark	t	t	t	PUBLIC	t	{}	2026-10-06 17:11:49.8	2026-10-06 17:11:49.8
usr_seed_recruiter	dark	t	t	t	PUBLIC	t	{}	2026-10-06 17:11:49.807	2026-10-06 17:11:49.807
cmux1mf9x0000zs97oo8zo9f0	dark	t	t	t	PUBLIC	t	{}	2026-10-06 18:59:49.942	2026-10-06 18:59:49.942
\.


--
-- Data for Name: UserProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserProfile" ("userId", "displayName", "firstName", "lastName", headline, bio, "avatarUrl", location, "websiteUrl", "githubUrl", "linkedinUrl", "twitterUrl", "createdAt", "updatedAt") FROM stdin;
usr_seed_admin	System Administrator	\N	\N	Core Platform Administrator	Overseeing flowCTRL security and infrastructure.	\N	Global	\N	\N	\N	\N	2026-10-06 17:11:49.775	2026-10-06 17:11:49.775
usr_seed_alex	Alex Johnson	\N	\N	Senior Full-Stack Engineer	Building scalable distributed web applications with flowCTRL.	\N	San Francisco, CA	\N	\N	\N	\N	2026-10-06 17:11:49.791	2026-10-06 17:11:49.791
usr_seed_mentor	Sarah Lin	\N	\N	Staff AI Engineer & Tech Lead	Guiding aspiring engineers in systems design and cloud architectures.	\N	Seattle, WA	\N	\N	\N	\N	2026-10-06 17:11:49.8	2026-10-06 17:11:49.8
usr_seed_recruiter	Marcus Vance	\N	\N	Technical Talent Partner	Connecting elite engineers with top-tier technology teams.	\N	New York, NY	\N	\N	\N	\N	2026-10-06 17:11:49.807	2026-10-06 17:11:49.807
cmux1mf9x0000zs97oo8zo9f0	test1	\N	\N			\N		\N	\N	\N	\N	2026-10-06 18:59:49.903	2026-10-06 18:59:49.903
\.


--
-- Data for Name: UserRoadmapProgress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserRoadmapProgress" (id, "userId", "roadmapSlug", "completedTopics", "currentTopic", "progressPercent", "lastActivityAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserSession; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSession" (id, "userId", "sessionToken", "ipAddress", "userAgent", "deviceType", browser, os, "revokedAt", "lastActiveAt", "expiresAt", "createdAt", "updatedAt") FROM stdin;
cmux1mhqp00010o977uiiwqbt	cmux1mf9x0000zs97oo8zo9f0	sess_cmux1mf9x0000zs97oo8zo9f0_1791313193027	127.0.0.1	FlowCTRL Web Client	Desktop	Web Browser	Windows	\N	2026-10-06 18:59:53.041	2026-11-05 18:59:53.027	2026-10-06 18:59:53.041	2026-10-06 18:59:53.041
cmux1mfed0002zs97d5sji7dt	cmux1mf9x0000zs97oo8zo9f0	9c337e93bfc9e46e092db5829217fd7fbe8fdb8c694ee24972c183c6f9ca4f76	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	Desktop	Chrome	Windows	\N	2026-10-06 19:05:37.215	2026-11-05 18:59:49.991	2026-10-06 18:59:50.005	2026-10-06 19:05:37.256
\.


--
-- Data for Name: UserSkill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserSkill" (id, "userId", "skillId", proficiency, "isVerified", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VerificationToken; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."VerificationToken" (identifier, token, expires) FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CareerPath CareerPath_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CareerPath"
    ADD CONSTRAINT "CareerPath_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Issue Issue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_pkey" PRIMARY KEY (id);


--
-- Name: JobApplication JobApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_pkey" PRIMARY KEY (id);


--
-- Name: JobSkill JobSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobSkill"
    ADD CONSTRAINT "JobSkill_pkey" PRIMARY KEY (id);


--
-- Name: Job Job_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_pkey" PRIMARY KEY (id);


--
-- Name: MembershipHistory MembershipHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipHistory"
    ADD CONSTRAINT "MembershipHistory_pkey" PRIMARY KEY (id);


--
-- Name: MembershipPlan MembershipPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY (id);


--
-- Name: MembershipTransaction MembershipTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipTransaction"
    ADD CONSTRAINT "MembershipTransaction_pkey" PRIMARY KEY (id);


--
-- Name: MentorProfile MentorProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MentorProfile"
    ADD CONSTRAINT "MentorProfile_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PremiumResource PremiumResource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PremiumResource"
    ADD CONSTRAINT "PremiumResource_pkey" PRIMARY KEY (id);


--
-- Name: ProjectMember ProjectMember_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId", "userId");


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: ResourceCategory ResourceCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceCategory"
    ADD CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY (id);


--
-- Name: ResumeAnalysis ResumeAnalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResumeAnalysis"
    ADD CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: Resume Resume_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Resume"
    ADD CONSTRAINT "Resume_pkey" PRIMARY KEY (id);


--
-- Name: RoadmapPhase RoadmapPhase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoadmapPhase"
    ADD CONSTRAINT "RoadmapPhase_pkey" PRIMARY KEY (id);


--
-- Name: RoadmapTask RoadmapTask_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoadmapTask"
    ADD CONSTRAINT "RoadmapTask_pkey" PRIMARY KEY (id);


--
-- Name: Roadmap Roadmap_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roadmap"
    ADD CONSTRAINT "Roadmap_pkey" PRIMARY KEY (id);


--
-- Name: SavedJob SavedJob_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_pkey" PRIMARY KEY (id);


--
-- Name: SecurityLog SecurityLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SecurityLog"
    ADD CONSTRAINT "SecurityLog_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Skill Skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_pkey" PRIMARY KEY (id);


--
-- Name: UserMembership UserMembership_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembership"
    ADD CONSTRAINT "UserMembership_pkey" PRIMARY KEY (id);


--
-- Name: UserPreference UserPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId");


--
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId");


--
-- Name: UserRoadmapProgress UserRoadmapProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRoadmapProgress"
    ADD CONSTRAINT "UserRoadmapProgress_pkey" PRIMARY KEY (id);


--
-- Name: UserSession UserSession_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY (id);


--
-- Name: UserSkill UserSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Account_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_userId_idx" ON public."Account" USING btree ("userId");


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_targetType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_targetType_idx" ON public."AuditLog" USING btree ("targetType");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: CareerPath_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CareerPath_slug_key" ON public."CareerPath" USING btree (slug);


--
-- Name: CareerPath_title_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CareerPath_title_key" ON public."CareerPath" USING btree (title);


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Company_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Company_name_key" ON public."Company" USING btree (name);


--
-- Name: Issue_assigneeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Issue_assigneeId_idx" ON public."Issue" USING btree ("assigneeId");


--
-- Name: Issue_creatorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Issue_creatorId_idx" ON public."Issue" USING btree ("creatorId");


--
-- Name: Issue_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Issue_priority_idx" ON public."Issue" USING btree (priority);


--
-- Name: Issue_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Issue_projectId_idx" ON public."Issue" USING btree ("projectId");


--
-- Name: Issue_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Issue_status_idx" ON public."Issue" USING btree (status);


--
-- Name: JobApplication_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobApplication_jobId_idx" ON public."JobApplication" USING btree ("jobId");


--
-- Name: JobApplication_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobApplication_status_idx" ON public."JobApplication" USING btree (status);


--
-- Name: JobApplication_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobApplication_userId_idx" ON public."JobApplication" USING btree ("userId");


--
-- Name: JobSkill_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobSkill_jobId_idx" ON public."JobSkill" USING btree ("jobId");


--
-- Name: JobSkill_jobId_skillId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "JobSkill_jobId_skillId_key" ON public."JobSkill" USING btree ("jobId", "skillId");


--
-- Name: JobSkill_skillId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "JobSkill_skillId_idx" ON public."JobSkill" USING btree ("skillId");


--
-- Name: Job_companyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_companyId_idx" ON public."Job" USING btree ("companyId");


--
-- Name: Job_location_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_location_idx" ON public."Job" USING btree (location);


--
-- Name: Job_workMode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Job_workMode_idx" ON public."Job" USING btree ("workMode");


--
-- Name: MembershipHistory_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipHistory_createdAt_idx" ON public."MembershipHistory" USING btree ("createdAt");


--
-- Name: MembershipHistory_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipHistory_userId_idx" ON public."MembershipHistory" USING btree ("userId");


--
-- Name: MembershipPlan_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipPlan_code_idx" ON public."MembershipPlan" USING btree (code);


--
-- Name: MembershipPlan_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MembershipPlan_code_key" ON public."MembershipPlan" USING btree (code);


--
-- Name: MembershipPlan_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipPlan_isActive_idx" ON public."MembershipPlan" USING btree ("isActive");


--
-- Name: MembershipPlan_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipPlan_tier_idx" ON public."MembershipPlan" USING btree (tier);


--
-- Name: MembershipTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipTransaction_createdAt_idx" ON public."MembershipTransaction" USING btree ("createdAt");


--
-- Name: MembershipTransaction_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipTransaction_status_idx" ON public."MembershipTransaction" USING btree (status);


--
-- Name: MembershipTransaction_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MembershipTransaction_userId_idx" ON public."MembershipTransaction" USING btree ("userId");


--
-- Name: MentorProfile_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MentorProfile_userId_idx" ON public."MentorProfile" USING btree ("userId");


--
-- Name: MentorProfile_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "MentorProfile_userId_key" ON public."MentorProfile" USING btree ("userId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_read_idx" ON public."Notification" USING btree (read);


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: PremiumResource_accessLevel_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PremiumResource_accessLevel_idx" ON public."PremiumResource" USING btree ("accessLevel");


--
-- Name: PremiumResource_categorySlug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PremiumResource_categorySlug_idx" ON public."PremiumResource" USING btree ("categorySlug");


--
-- Name: PremiumResource_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PremiumResource_isActive_idx" ON public."PremiumResource" USING btree ("isActive");


--
-- Name: PremiumResource_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PremiumResource_slug_idx" ON public."PremiumResource" USING btree (slug);


--
-- Name: PremiumResource_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PremiumResource_slug_key" ON public."PremiumResource" USING btree (slug);


--
-- Name: ProjectMember_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProjectMember_userId_idx" ON public."ProjectMember" USING btree ("userId");


--
-- Name: Project_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_category_idx" ON public."Project" USING btree (category);


--
-- Name: Project_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_createdAt_idx" ON public."Project" USING btree ("createdAt");


--
-- Name: Project_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Project_ownerId_idx" ON public."Project" USING btree ("ownerId");


--
-- Name: ResourceCategory_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResourceCategory_slug_idx" ON public."ResourceCategory" USING btree (slug);


--
-- Name: ResourceCategory_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON public."ResourceCategory" USING btree (slug);


--
-- Name: ResumeAnalysis_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResumeAnalysis_createdAt_idx" ON public."ResumeAnalysis" USING btree ("createdAt");


--
-- Name: ResumeAnalysis_resumeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResumeAnalysis_resumeId_idx" ON public."ResumeAnalysis" USING btree ("resumeId");


--
-- Name: ResumeAnalysis_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ResumeAnalysis_userId_idx" ON public."ResumeAnalysis" USING btree ("userId");


--
-- Name: Resume_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Resume_userId_idx" ON public."Resume" USING btree ("userId");


--
-- Name: RoadmapPhase_roadmapId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RoadmapPhase_roadmapId_idx" ON public."RoadmapPhase" USING btree ("roadmapId");


--
-- Name: RoadmapTask_roadmapPhaseId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RoadmapTask_roadmapPhaseId_idx" ON public."RoadmapTask" USING btree ("roadmapPhaseId");


--
-- Name: Roadmap_isPublic_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Roadmap_isPublic_idx" ON public."Roadmap" USING btree ("isPublic");


--
-- Name: Roadmap_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Roadmap_userId_idx" ON public."Roadmap" USING btree ("userId");


--
-- Name: SavedJob_jobId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SavedJob_jobId_idx" ON public."SavedJob" USING btree ("jobId");


--
-- Name: SavedJob_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SavedJob_userId_idx" ON public."SavedJob" USING btree ("userId");


--
-- Name: SavedJob_userId_jobId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SavedJob_userId_jobId_key" ON public."SavedJob" USING btree ("userId", "jobId");


--
-- Name: SecurityLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SecurityLog_createdAt_idx" ON public."SecurityLog" USING btree ("createdAt");


--
-- Name: SecurityLog_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SecurityLog_eventType_idx" ON public."SecurityLog" USING btree ("eventType");


--
-- Name: SecurityLog_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SecurityLog_userId_idx" ON public."SecurityLog" USING btree ("userId");


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: Skill_categoryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Skill_categoryId_idx" ON public."Skill" USING btree ("categoryId");


--
-- Name: Skill_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Skill_category_idx" ON public."Skill" USING btree (category);


--
-- Name: Skill_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Skill_name_key" ON public."Skill" USING btree (name);


--
-- Name: UserMembership_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserMembership_expiresAt_idx" ON public."UserMembership" USING btree ("expiresAt");


--
-- Name: UserMembership_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserMembership_status_idx" ON public."UserMembership" USING btree (status);


--
-- Name: UserMembership_tier_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserMembership_tier_idx" ON public."UserMembership" USING btree (tier);


--
-- Name: UserMembership_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserMembership_userId_idx" ON public."UserMembership" USING btree ("userId");


--
-- Name: UserMembership_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserMembership_userId_key" ON public."UserMembership" USING btree ("userId");


--
-- Name: UserRoadmapProgress_roadmapSlug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserRoadmapProgress_roadmapSlug_idx" ON public."UserRoadmapProgress" USING btree ("roadmapSlug");


--
-- Name: UserRoadmapProgress_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserRoadmapProgress_userId_idx" ON public."UserRoadmapProgress" USING btree ("userId");


--
-- Name: UserRoadmapProgress_userId_roadmapSlug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserRoadmapProgress_userId_roadmapSlug_key" ON public."UserRoadmapProgress" USING btree ("userId", "roadmapSlug");


--
-- Name: UserSession_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSession_expiresAt_idx" ON public."UserSession" USING btree ("expiresAt");


--
-- Name: UserSession_revokedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSession_revokedAt_idx" ON public."UserSession" USING btree ("revokedAt");


--
-- Name: UserSession_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON public."UserSession" USING btree ("sessionToken");


--
-- Name: UserSession_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSession_userId_idx" ON public."UserSession" USING btree ("userId");


--
-- Name: UserSkill_skillId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSkill_skillId_idx" ON public."UserSkill" USING btree ("skillId");


--
-- Name: UserSkill_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "UserSkill_userId_idx" ON public."UserSkill" USING btree ("userId");


--
-- Name: UserSkill_userId_skillId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "UserSkill_userId_skillId_key" ON public."UserSkill" USING btree ("userId", "skillId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Issue Issue_assigneeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Issue Issue_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Issue Issue_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobApplication JobApplication_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobApplication JobApplication_resumeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES public."Resume"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: JobApplication JobApplication_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobApplication"
    ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobSkill JobSkill_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobSkill"
    ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JobSkill JobSkill_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobSkill"
    ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public."Skill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Job Job_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Job"
    ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipHistory MembershipHistory_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipHistory"
    ADD CONSTRAINT "MembershipHistory_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."MembershipPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MembershipHistory MembershipHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipHistory"
    ADD CONSTRAINT "MembershipHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipTransaction MembershipTransaction_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipTransaction"
    ADD CONSTRAINT "MembershipTransaction_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."UserMembership"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MembershipTransaction MembershipTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipTransaction"
    ADD CONSTRAINT "MembershipTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MentorProfile MentorProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MentorProfile"
    ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PremiumResource PremiumResource_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PremiumResource"
    ADD CONSTRAINT "PremiumResource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ResourceCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProjectMember ProjectMember_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProjectMember ProjectMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectMember"
    ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResumeAnalysis ResumeAnalysis_resumeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResumeAnalysis"
    ADD CONSTRAINT "ResumeAnalysis_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES public."Resume"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResumeAnalysis ResumeAnalysis_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResumeAnalysis"
    ADD CONSTRAINT "ResumeAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Resume Resume_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Resume"
    ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoadmapPhase RoadmapPhase_roadmapId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoadmapPhase"
    ADD CONSTRAINT "RoadmapPhase_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES public."Roadmap"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoadmapTask RoadmapTask_roadmapPhaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoadmapTask"
    ADD CONSTRAINT "RoadmapTask_roadmapPhaseId_fkey" FOREIGN KEY ("roadmapPhaseId") REFERENCES public."RoadmapPhase"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Roadmap Roadmap_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Roadmap"
    ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedJob SavedJob_jobId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."Job"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedJob SavedJob_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedJob"
    ADD CONSTRAINT "SavedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SecurityLog SecurityLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SecurityLog"
    ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Skill Skill_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserMembership UserMembership_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembership"
    ADD CONSTRAINT "UserMembership_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."MembershipPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserMembership UserMembership_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembership"
    ADD CONSTRAINT "UserMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserPreference UserPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserPreference"
    ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserProfile UserProfile_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRoadmapProgress UserRoadmapProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserRoadmapProgress"
    ADD CONSTRAINT "UserRoadmapProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSession UserSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSession"
    ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSkill UserSkill_skillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES public."Skill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSkill UserSkill_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserSkill"
    ADD CONSTRAINT "UserSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict u9JIrIMSpC6SqVKN3rvCei8SWdhzc0hULzNfWqmGRuqdch0G0jnwlMf5OWGWhjs

