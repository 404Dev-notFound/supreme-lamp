const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgrespassword9555@localhost:5432/flowCTRL",
});

// Resilient memory fallback matching the database records
const FALLBACK_ANNOUNCEMENTS = [
  {
    id: "ann_interview_upcoming",
    title: "Upcoming Technical Interview",
    description:
      "Live technical evaluation scheduled with Senior Staff Architecture Panel. Review your verified system design blueprints, database internals, and concurrency patterns.",
    category: "INTERVIEW",
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "URGENT",
    status: "UPCOMING",
    actionLabel: "Prepare Blueprint",
    actionUrl: "/roadmaps/system-design-architecture",
    badge: "PRIORITY INTERVIEW",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: "ann_hackathon_codecollab",
    title: "CodeCollab Global Open-Source Buildathon 2026",
    description:
      "48-hour collaborative engineering sprint hosted across the flowCTRL ecosystem. Build developer tools, databases, and microservices from scratch with peer review.",
    category: "HACKATHON",
    dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "HIGH",
    status: "UPCOMING",
    actionLabel: "Join Buildathon",
    actionUrl: "https://opensource-projects.netlify.app",
    badge: "HACKATHON",
    isFeatured: false,
    sortOrder: 2,
  },
  {
    id: "ann_community_404_guild",
    title: "404 Tech Guild: Student Project Incubation & Offline Meetup",
    description:
      "Hands-on technical sprint and collaborative mentorship session under the 404 Community Agreement. Code reviews, architecture audits, and project showcases.",
    category: "COMMUNITY",
    dateTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "NORMAL",
    status: "UPCOMING",
    actionLabel: "View Guild Agreement",
    actionUrl: "/community-agreement",
    badge: "OFFLINE GUILD",
    isFeatured: false,
    sortOrder: 3,
  },
  {
    id: "ann_career_novascale_internship",
    title: "NovaScale Cloud Systems: Winter Engineering Opportunities",
    description:
      "Partner engineering teams are reviewing verified profiles for junior distributed infrastructure roles. Requires verified ATS resume score above 85%.",
    category: "CAREER",
    dateTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "HIGH",
    status: "UPCOMING",
    actionLabel: "Check ATS Resume Match",
    actionUrl: "/resume-screener",
    badge: "CAREER OPPORTUNITY",
    isFeatured: false,
    sortOrder: 4,
  },
  {
    id: "ann_platform_privacy_v16",
    title: "flowCTRL Ecosystem v1.6: Zero-Exposure Security & Resilient Cache",
    description:
      "Platform infrastructure upgraded with automated memory fallback, zero email leakage tokens, and unified multi-language DSA mastery tracking.",
    category: "PLATFORM",
    dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: "NORMAL",
    status: "LIVE",
    actionLabel: "Explore Ecosystem Hub",
    actionUrl: "/ecosystem",
    badge: "PLATFORM NOTICE",
    isFeatured: false,
    sortOrder: 5,
  },
  {
    id: "ann_ecosystem_dsa_expansion",
    title: "Learning Engine Update: 24 DSA Languages & 1,274 Build Guides",
    description:
      "Explore genuine algorithmic implementations across 24 programming languages and first-principles build guides for databases, compilers, OS, and web servers.",
    category: "ECOSYSTEM_UPDATE",
    dateTime: new Date().toISOString(),
    priority: "HIGH",
    status: "LIVE",
    actionLabel: "Explore DSA Engine",
    actionUrl: "/dsa",
    badge: "CATALOG UPDATE",
    isFeatured: false,
    sortOrder: 6,
  },
];

class AnnouncementsService {
  /**
   * List announcements from PostgreSQL with filtering and ordering
   */
  async listAnnouncements({ category, priority, status } = {}) {
    try {
      let query = 'SELECT * FROM "PlatformAnnouncement" WHERE 1=1';
      const params = [];

      if (category && category !== "all") {
        params.push(category);
        query += ` AND "category" = $${params.length}`;
      }

      if (priority && priority !== "all") {
        params.push(priority);
        query += ` AND "priority" = $${params.length}`;
      }

      if (status && status !== "all") {
        params.push(status);
        query += ` AND "status" = $${params.length}`;
      }

      query += ' ORDER BY "isFeatured" DESC, "sortOrder" ASC, "dateTime" ASC';

      const res = await pool.query(query, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
      return FALLBACK_ANNOUNCEMENTS;
    } catch (err) {
      console.warn("AnnouncementsService database query error, using fallback:", err.message);
      let list = [...FALLBACK_ANNOUNCEMENTS];
      if (category && category !== "all") {
        list = list.filter((a) => a.category === category);
      }
      if (priority && priority !== "all") {
        list = list.filter((a) => a.priority === priority);
      }
      if (status && status !== "all") {
        list = list.filter((a) => a.status === status);
      }
      return list;
    }
  }

  /**
   * Get Notice Board configuration and notices
   */
  async getNoticeBoard() {
    try {
      const announcements = await this.listAnnouncements({ category: "INTERVIEW" });
      const activeNotice = announcements && announcements.length > 0 ? announcements[0] : null;

      const formattedNotice = activeNotice
        ? {
            id: activeNotice.id,
            title: activeNotice.title.replace(/:.*$/, "").trim() || "Upcoming Technical Interview",
            description: activeNotice.description,
            dateTime: activeNotice.dateTime,
            actionLabel: activeNotice.actionLabel || "Prepare Blueprint",
            actionUrl: activeNotice.actionUrl || "/roadmaps/system-design-architecture",
            category: activeNotice.category || "INTERVIEW",
          }
        : {
            id: "notice_interview_upcoming",
            title: "Upcoming Technical Interview",
            description:
              "Live technical evaluation scheduled with Senior Staff Architecture Panel. Review your verified system design blueprints, database internals, and concurrency patterns.",
            dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            actionLabel: "Prepare Blueprint",
            actionUrl: "/roadmaps/system-design-architecture",
            category: "INTERVIEW",
          };

      return {
        title: "Notice Board",
        totalPages: 3,
        notices: [formattedNotice],
      };
    } catch (err) {
      console.warn("getNoticeBoard error, using fallback notice:", err.message);
      return {
        title: "Notice Board",
        totalPages: 3,
        notices: [
          {
            id: "notice_interview_upcoming",
            title: "Upcoming Technical Interview",
            description:
              "Live technical evaluation scheduled with Senior Staff Architecture Panel. Review your verified system design blueprints, database internals, and concurrency patterns.",
            dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            actionLabel: "Prepare Blueprint",
            actionUrl: "/roadmaps/system-design-architecture",
            category: "INTERVIEW",
          },
        ],
      };
    }
  }

  /**
   * Get single announcement by ID
   */
  async getAnnouncementById(id) {
    try {
      const res = await pool.query('SELECT * FROM "PlatformAnnouncement" WHERE "id" = $1', [id]);
      if (res.rows && res.rows.length > 0) {
        return res.rows[0];
      }
      return FALLBACK_ANNOUNCEMENTS.find((a) => a.id === id) || null;
    } catch (err) {
      console.warn("Error fetching announcement by ID, checking fallback:", err.message);
      return FALLBACK_ANNOUNCEMENTS.find((a) => a.id === id) || null;
    }
  }
}

module.exports = new AnnouncementsService();

