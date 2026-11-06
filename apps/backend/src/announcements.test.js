const { test, describe } = require("node:test");
const assert = require("node:assert");
const announcementsService = require("./services/announcements.service");

describe("Platform Announcements & Notifications Service Suite", () => {
  test("1. listAnnouncements returns all announcements with required attributes", async () => {
    const items = await announcementsService.listAnnouncements();
    assert(Array.isArray(items), "Expected array of announcements");
    assert(items.length >= 6, `Expected at least 6 announcements, got ${items.length}`);

    const first = items[0];
    assert(first.title, "Announcement must have title");
    assert(first.description, "Announcement must have description");
    assert(first.category, "Announcement must have category");
    assert(first.dateTime, "Announcement must have dateTime");
    assert(first.priority, "Announcement must have priority");
    assert(first.status, "Announcement must have status");
  });

  test("2. Prominent Upcoming Interview announcement is present with URGENT priority", async () => {
    const items = await announcementsService.listAnnouncements({ category: "INTERVIEW" });
    assert(items.length >= 1, "Expected at least 1 interview announcement");
    const interview = items[0];
    assert.strictEqual(interview.category, "INTERVIEW");
    assert(interview.priority === "URGENT" || interview.priority === "HIGH");
    assert.strictEqual(interview.isFeatured, true);
    assert(interview.title.includes("Interview"), "Title should reference Interview");
  });

  test("3. Category filtering returns only matching category items", async () => {
    const hackathons = await announcementsService.listAnnouncements({ category: "HACKATHON" });
    assert(hackathons.length >= 1, "Expected at least 1 hackathon");
    hackathons.forEach((h) => assert.strictEqual(h.category, "HACKATHON"));

    const careers = await announcementsService.listAnnouncements({ category: "CAREER" });
    assert(careers.length >= 1, "Expected at least 1 career notice");
    careers.forEach((c) => assert.strictEqual(c.category, "CAREER"));
  });

  test("4. getAnnouncementById retrieves existing announcement and handles missing IDs", async () => {
    const item = await announcementsService.getAnnouncementById("ann_interview_upcoming");
    assert(item, "Expected to find ann_interview_upcoming");
    assert.strictEqual(item.id, "ann_interview_upcoming");

    const missing = await announcementsService.getAnnouncementById("non_existent_ann_id");
    assert.strictEqual(missing, null);
  });
});

