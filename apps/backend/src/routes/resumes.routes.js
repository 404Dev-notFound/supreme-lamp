const { Router } = require("express");
const multer = require("multer");
const resumesController = require("../controllers/resumes.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

// Configure memory storage with 8MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are allowed."), false);
    }
  },
});

// POST /api/resumes/upload - Upload resume PDF
router.post(
  "/upload",
  requireAuth,
  upload.single("resume"),
  resumesController.uploadResume,
);

// GET /api/resumes - List user's resumes
router.get("/", requireAuth, resumesController.listMyResumes);

// GET /api/resumes/:id - Get resume metadata
router.get("/:id", requireAuth, resumesController.getResumeById);

// GET /api/resumes/:id/download - Authorized secure file stream
router.get("/:id/download", requireAuth, resumesController.downloadResume);

// DELETE /api/resumes/:id - Delete resume
router.delete("/:id", requireAuth, resumesController.deleteResume);

// POST /api/resumes/:id/analyze - Trigger ATS evaluation
router.post("/:id/analyze", requireAuth, resumesController.analyzeResume);

// GET /api/resumes/:id/analyses - Get analysis history for resume
router.get("/:id/analyses", requireAuth, resumesController.listResumeAnalyses);

module.exports = { resumesRouter: router };
