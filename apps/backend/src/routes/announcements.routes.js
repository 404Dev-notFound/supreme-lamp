const { Router } = require("express");
const announcementsController = require("../controllers/announcements.controller");

const router = Router();

// GET /api/announcements - List platform announcements and notifications (Public)
router.get("/", announcementsController.listAnnouncements);

// GET /api/announcements/:id - Get single announcement detail (Public)
router.get("/:id", announcementsController.getAnnouncementById);

module.exports = { announcementsRouter: router };

