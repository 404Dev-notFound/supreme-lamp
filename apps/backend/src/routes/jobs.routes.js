const { Router } = require("express");
const jobsController = require("../controllers/jobs.controller");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const {
  validateCreateJob,
  validateCreateCompany,
  validateJobApplication,
  validateApplicationStatus,
} = require("../validators/jobs.validator");

const router = Router();

/**
 * 1. Company Endpoints
 */
// GET /api/jobs/companies - List companies
router.get("/companies", jobsController.listCompanies);

// GET /api/jobs/companies/:id - Get company detail
router.get("/companies/:id", jobsController.getCompanyById);

// POST /api/jobs/companies - Create company (Recruiter / Company Rep / Admin)
router.post(
  "/companies",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  validate(validateCreateCompany),
  jobsController.createCompany,
);

// PUT /api/jobs/companies/:id - Update company
router.put(
  "/companies/:id",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  validate(validateCreateCompany),
  jobsController.updateCompany,
);

/**
 * 2. Saved Jobs Endpoints
 */
// GET /api/jobs/saved/my - List current user's saved jobs
router.get("/saved/my", requireAuth, jobsController.listSavedJobs);

// POST /api/jobs/:id/save - Toggle saving a job
router.post("/:id/save", requireAuth, jobsController.toggleSaveJob);

/**
 * 3. Application Endpoints
 */
// GET /api/jobs/applications/my - List current user's job applications
router.get("/applications/my", requireAuth, jobsController.listMyApplications);

// POST /api/jobs/:id/apply - Apply for job
router.post(
  "/:id/apply",
  requireAuth,
  validate(validateJobApplication),
  jobsController.applyToJob,
);

// GET /api/jobs/:id/applications - List applications for job (Recruiter / Admin)
router.get(
  "/:id/applications",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  jobsController.listJobApplications,
);

// PATCH /api/jobs/applications/:applicationId/status - Update application status
router.patch(
  "/applications/:applicationId/status",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  validate(validateApplicationStatus),
  jobsController.updateApplicationStatus,
);

/**
 * 4. Job Listings Endpoints
 */
// GET /api/jobs - List active jobs with filtering & search
router.get("/", optionalAuth, jobsController.listJobs);

// GET /api/jobs/:id - Single job detail
router.get("/:id", optionalAuth, jobsController.getJobById);

// POST /api/jobs - Create job listing
router.post(
  "/",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  validate(validateCreateJob),
  jobsController.createJob,
);

// PUT /api/jobs/:id - Update job listing
router.put(
  "/:id",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  validate(validateCreateJob),
  jobsController.updateJob,
);

// DELETE /api/jobs/:id - Archive job listing
router.delete(
  "/:id",
  requireAuth,
  requireRole(["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"]),
  jobsController.deleteJob,
);

module.exports = { jobsRouter: router };
