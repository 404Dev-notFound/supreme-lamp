const { prisma } = require("../lib/prisma");
const { recordAuditLog } = require("./audit.service");

class JobError extends Error {
  constructor(message, statusCode = 400, code = "JOB_ERROR") {
    super(message);
    this.name = "JobError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * List jobs with pagination, filtering and sorting
 */
async function listJobs({
  page = 1,
  limit = 20,
  search = "",
  workMode = null,
  location = "",
  minSalary = null,
  maxSalary = null,
  companyId = null,
  isFeatured = null,
  sort = "newest",
} = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    isActive: true,
  };

  if (companyId) {
    where.companyId = companyId;
  }

  if (workMode) {
    where.workMode = workMode;
  }

  if (isFeatured !== null) {
    where.isFeatured = Boolean(isFeatured);
  }

  if (location && typeof location === "string" && location.trim()) {
    where.location = {
      contains: location.trim(),
      mode: "insensitive",
    };
  }

  if (search && typeof search === "string" && search.trim()) {
    const q = search.trim().slice(0, 100);
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (minSalary !== null && !isNaN(minSalary)) {
    where.salaryMin = { gte: parseInt(minSalary, 10) };
  }

  if (maxSalary !== null && !isNaN(maxSalary)) {
    where.salaryMax = { lte: parseInt(maxSalary, 10) };
  }

  let orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (sort === "salary_high") {
    orderBy = [{ salaryMax: "desc" }, { createdAt: "desc" }];
  } else if (sort === "oldest") {
    orderBy = [{ createdAt: "asc" }];
  }

  const [total, jobs] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            location: true,
            isVerified: true,
          },
        },
        jobSkills: {
          include: {
            skill: {
              select: { id: true, name: true, category: true },
            },
          },
        },
        _count: {
          select: {
            applications: true,
            savedJobs: true,
          },
        },
      },
    }),
  ]);

  return {
    jobs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Get single job by ID
 */
async function getJobById(id) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      jobSkills: {
        include: {
          skill: true,
        },
      },
      _count: {
        select: {
          applications: true,
          savedJobs: true,
        },
      },
    },
  });

  if (!job || !job.isActive) {
    throw new JobError("Job not found or no longer active.", 404, "JOB_NOT_FOUND");
  }

  return job;
}

/**
 * Create a new job listing
 */
async function createJob({ data, userId, userRole, req = null }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Only recruiters, company representatives, or admins can post jobs.", 403, "FORBIDDEN");
  }

  const company = await prisma.company.findUnique({
    where: { id: data.companyId },
  });

  if (!company) {
    throw new JobError("Associated company does not exist.", 404, "COMPANY_NOT_FOUND");
  }

  const { skills = [], ...jobData } = data;

  const newJob = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        ...jobData,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (Array.isArray(skills) && skills.length > 0) {
      for (const skillName of skills) {
        const cleanSkillName = String(skillName).trim();
        if (!cleanSkillName) continue;

        const skillRecord = await tx.skill.upsert({
          where: { name: cleanSkillName },
          create: { name: cleanSkillName, category: "General" },
          update: {},
        });

        await tx.jobSkill.create({
          data: {
            jobId: job.id,
            skillId: skillRecord.id,
            isRequired: true,
          },
        });
      }
    }

    return tx.job.findUnique({
      where: { id: job.id },
      include: {
        company: true,
        jobSkills: { include: { skill: true } },
      },
    });
  });

  await recordAuditLog({
    userId,
    action: "JOB_CREATED",
    targetType: "Job",
    targetId: newJob.id,
    details: { title: newJob.title, companyId: newJob.companyId },
    req,
  });

  return newJob;
}

/**
 * Update job listing
 */
async function updateJob({ id, data, userId, userRole, req = null }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Insufficient permissions to update job listing.", 403, "FORBIDDEN");
  }

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    throw new JobError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  const { skills, ...jobFields } = data;

  const updatedJob = await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id },
      data: jobFields,
    });

    if (Array.isArray(skills)) {
      await tx.jobSkill.deleteMany({ where: { jobId: id } });
      for (const skillName of skills) {
        const cleanSkill = String(skillName).trim();
        if (!cleanSkill) continue;

        const skillRecord = await tx.skill.upsert({
          where: { name: cleanSkill },
          create: { name: cleanSkill, category: "General" },
          update: {},
        });

        await tx.jobSkill.create({
          data: {
            jobId: id,
            skillId: skillRecord.id,
            isRequired: true,
          },
        });
      }
    }

    return tx.job.findUnique({
      where: { id },
      include: {
        company: true,
        jobSkills: { include: { skill: true } },
      },
    });
  });

  await recordAuditLog({
    userId,
    action: "JOB_UPDATED",
    targetType: "Job",
    targetId: id,
    details: { updatedFields: Object.keys(data) },
    req,
  });

  return updatedJob;
}

/**
 * Delete / Archive job
 */
async function deleteJob({ id, userId, userRole, req = null }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Insufficient permissions to delete job listing.", 403, "FORBIDDEN");
  }

  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) {
    throw new JobError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  // Soft deactivate
  await prisma.job.update({
    where: { id },
    data: { isActive: false },
  });

  await recordAuditLog({
    userId,
    action: "JOB_ARCHIVED",
    targetType: "Job",
    targetId: id,
    req,
  });

  return { message: "Job listing archived successfully." };
}

/**
 * Toggle Saved Job
 */
async function toggleSaveJob({ userId, jobId }) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || !job.isActive) {
    throw new JobError("Job not found or inactive.", 404, "JOB_NOT_FOUND");
  }

  const existingSave = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId,
        jobId,
      },
    },
  });

  if (existingSave) {
    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });
    return { saved: false, message: "Job removed from saved listings." };
  } else {
    await prisma.savedJob.create({
      data: {
        userId,
        jobId,
      },
    });
    return { saved: true, message: "Job saved successfully." };
  }
}

/**
 * List User Saved Jobs
 */
async function listSavedJobs({ userId, page = 1, limit = 20 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = { userId, job: { isActive: true } };

  const [total, saved] = await prisma.$transaction([
    prisma.savedJob.count({ where }),
    prisma.savedJob.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            company: true,
            jobSkills: { include: { skill: true } },
          },
        },
      },
    }),
  ]);

  return {
    savedJobs: saved.map((s) => ({
      savedAt: s.createdAt,
      job: s.job,
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Apply to Job
 */
async function applyToJob({ userId, jobId, resumeId = null, notes = null, req = null }) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { company: true },
  });

  if (!job || !job.isActive) {
    throw new JobError("Job not found or no longer accepting applications.", 404, "JOB_NOT_FOUND");
  }

  // Prevent duplicate application
  const existingApp = await prisma.jobApplication.findFirst({
    where: { userId, jobId },
  });

  if (existingApp) {
    throw new JobError("You have already submitted an application for this position.", 409, "APPLICATION_EXISTS");
  }

  // Verify resume belongs to user if specified
  if (resumeId) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) {
      throw new JobError("Invalid resume selection. Resume must belong to your profile.", 400, "INVALID_RESUME");
    }
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      jobId,
      resumeId: resumeId || null,
      notes: notes || null,
      status: "APPLIED",
    },
    include: {
      job: { include: { company: true } },
      resume: true,
    },
  });

  // Create notification for user
  await prisma.notification.create({
    data: {
      userId,
      title: "Application Submitted",
      message: `Your application for ${job.title} at ${job.company.name} has been received.`,
      type: "job",
      link: `/jobs/${job.id}`,
    },
  });

  await recordAuditLog({
    userId,
    action: "JOB_APPLICATION_SUBMITTED",
    targetType: "JobApplication",
    targetId: application.id,
    details: { jobId, companyId: job.companyId },
    req,
  });

  return application;
}

/**
 * List My Applications
 */
async function listMyApplications({ userId, page = 1, limit = 20 }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = { userId };

  const [total, applications] = await prisma.$transaction([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { appliedAt: "desc" },
      include: {
        job: {
          include: {
            company: true,
          },
        },
        resume: {
          select: { id: true, fileName: true, mimeType: true },
        },
      },
    }),
  ]);

  return {
    applications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * List Applications for a specific Job (Recruiter / Admin view)
 */
async function listJobApplications({ jobId, userId, userRole, page = 1, limit = 20 }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Access denied. Recruiter or Admin role required.", 403, "FORBIDDEN");
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new JobError("Job not found.", 404, "JOB_NOT_FOUND");
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = { jobId };

  const [total, applications] = await prisma.$transaction([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { appliedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        resume: {
          select: { id: true, fileName: true, fileSize: true, mimeType: true },
        },
      },
    }),
  ]);

  return {
    applications,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Update application status (Recruiter / Admin)
 */
async function updateApplicationStatus({
  applicationId,
  status,
  notes = null,
  userId,
  userRole,
  req = null,
}) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Access denied.", 403, "FORBIDDEN");
  }

  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { include: { company: true } } },
  });

  if (!application) {
    throw new JobError("Job application not found.", 404, "APPLICATION_NOT_FOUND");
  }

  const updated = await prisma.jobApplication.update({
    where: { id: applicationId },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
    },
  });

  // Notify candidate
  await prisma.notification.create({
    data: {
      userId: application.userId,
      title: "Application Status Update",
      message: `Your application status for ${application.job.title} was updated to: ${status}.`,
      type: "job",
      link: `/applications`,
    },
  });

  await recordAuditLog({
    userId,
    action: "APPLICATION_STATUS_UPDATED",
    targetType: "JobApplication",
    targetId: applicationId,
    details: { status, previousStatus: application.status },
    req,
  });

  return updated;
}

/**
 * List Companies
 */
async function listCompanies({ page = 1, limit = 20, search = "", isVerified = null }) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {};
  if (isVerified !== null) {
    where.isVerified = Boolean(isVerified);
  }

  if (search && typeof search === "string" && search.trim()) {
    where.name = { contains: search.trim(), mode: "insensitive" };
  }

  const [total, companies] = await prisma.$transaction([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { jobs: { where: { isActive: true } } },
        },
      },
    }),
  ]);

  return {
    companies,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

/**
 * Get Company By ID
 */
async function getCompanyById(id) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { jobs: true },
      },
    },
  });

  if (!company) {
    throw new JobError("Company not found.", 404, "COMPANY_NOT_FOUND");
  }

  return company;
}

/**
 * Create Company
 */
async function createCompany({ data, userId, userRole, req = null }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Permission denied. Recruiter or Admin role required.", 403, "FORBIDDEN");
  }

  const existing = await prisma.company.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new JobError("A company with this name already exists.", 409, "COMPANY_EXISTS");
  }

  const company = await prisma.company.create({
    data: {
      ...data,
      isVerified: ["ADMIN", "SUPER_ADMIN"].includes(userRole),
    },
  });

  await recordAuditLog({
    userId,
    action: "COMPANY_CREATED",
    targetType: "Company",
    targetId: company.id,
    details: { name: company.name },
    req,
  });

  return company;
}

/**
 * Update Company
 */
async function updateCompany({ id, data, userId, userRole, req = null }) {
  const isAuthorized = ["RECRUITER", "COMPANY_REP", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isAuthorized) {
    throw new JobError("Permission denied.", 403, "FORBIDDEN");
  }

  const existing = await prisma.company.findUnique({ where: { id } });
  if (!existing) {
    throw new JobError("Company not found.", 404, "COMPANY_NOT_FOUND");
  }

  const updated = await prisma.company.update({
    where: { id },
    data,
  });

  await recordAuditLog({
    userId,
    action: "COMPANY_UPDATED",
    targetType: "Company",
    targetId: id,
    details: { updatedFields: Object.keys(data) },
    req,
  });

  return updated;
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
  JobError,
};
