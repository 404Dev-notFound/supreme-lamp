const jobsService = require("../services/jobs.service");
const { successResponse, errorResponse } = require("../utils/response");

async function listJobs(req, res, next) {
  try {
    const {
      page,
      limit,
      search,
      workMode,
      location,
      minSalary,
      maxSalary,
      companyId,
      isFeatured,
      sort,
    } = req.query;

    const result = await jobsService.listJobs({
      page,
      limit,
      search,
      workMode,
      location,
      minSalary,
      maxSalary,
      companyId,
      isFeatured,
      sort,
    });

    return successResponse(res, {
      data: result.jobs,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const { id } = req.params;
    const job = await jobsService.getJobById(id);
    return successResponse(res, { data: job, req });
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const data = req.validatedBody || req.body;
    const job = await jobsService.createJob({
      data,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: job,
      message: "Job listing created successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.validatedBody || req.body;
    const updated = await jobsService.updateJob({
      id,
      data,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: "Job listing updated successfully.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { id } = req.params;
    const result = await jobsService.deleteJob({
      id,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, { message: result.message, req });
  } catch (err) {
    next(err);
  }
}

async function toggleSaveJob(req, res, next) {
  try {
    const { id } = req.params;
    const result = await jobsService.toggleSaveJob({
      userId: req.user.id,
      jobId: id,
    });
    return successResponse(res, {
      data: { saved: result.saved },
      message: result.message,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listSavedJobs(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await jobsService.listSavedJobs({
      userId: req.user.id,
      page,
      limit,
    });
    return successResponse(res, {
      data: result.savedJobs,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function applyToJob(req, res, next) {
  try {
    const { id } = req.params;
    const { resumeId, notes } = req.validatedBody || req.body;
    const application = await jobsService.applyToJob({
      userId: req.user.id,
      jobId: id,
      resumeId,
      notes,
      req,
    });
    return successResponse(res, {
      data: application,
      message: "Job application submitted successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listMyApplications(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await jobsService.listMyApplications({
      userId: req.user.id,
      page,
      limit,
    });
    return successResponse(res, {
      data: result.applications,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listJobApplications(req, res, next) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const result = await jobsService.listJobApplications({
      jobId: id,
      userId: req.user.id,
      userRole: req.user.role,
      page,
      limit,
    });
    return successResponse(res, {
      data: result.applications,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.validatedBody || req.body;
    const updated = await jobsService.updateApplicationStatus({
      applicationId,
      status,
      notes,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: "Application status updated successfully.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listCompanies(req, res, next) {
  try {
    const { page, limit, search, isVerified } = req.query;
    const result = await jobsService.listCompanies({
      page,
      limit,
      search,
      isVerified: isVerified !== undefined ? isVerified === "true" : null,
    });
    return successResponse(res, {
      data: result.companies,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function getCompanyById(req, res, next) {
  try {
    const { id } = req.params;
    const company = await jobsService.getCompanyById(id);
    return successResponse(res, { data: company, req });
  } catch (err) {
    next(err);
  }
}

async function createCompany(req, res, next) {
  try {
    const data = req.validatedBody || req.body;
    const company = await jobsService.createCompany({
      data,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: company,
      message: "Company profile created successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function updateCompany(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.validatedBody || req.body;
    const updated = await jobsService.updateCompany({
      id,
      data,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: updated,
      message: "Company profile updated successfully.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  toggleSaveJob,
  listSavedJobs,
  applyToJob,
  listMyApplications,
  listJobApplications,
  updateApplicationStatus,
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
};
