const resumesService = require("../services/resumes.service");
const { successResponse } = require("../utils/response");

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: "NO_FILE_UPLOADED",
        error: "Please upload a valid PDF resume file.",
      });
    }

    const result = await resumesService.uploadResume({
      userId: req.user.id,
      fileBuffer: req.file.buffer,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      req,
    });

    return successResponse(res, {
      data: result,
      message: "Resume uploaded successfully.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listMyResumes(req, res, next) {
  try {
    const resumes = await resumesService.listUserResumes({ userId: req.user.id });
    return successResponse(res, { data: resumes, req });
  } catch (err) {
    next(err);
  }
}

async function getResumeById(req, res, next) {
  try {
    const { id } = req.params;
    const resume = await resumesService.getResumeById({
      id,
      userId: req.user.id,
      userRole: req.user.role,
    });
    return successResponse(res, { data: resume, req });
  } catch (err) {
    next(err);
  }
}

async function downloadResume(req, res, next) {
  try {
    const { id } = req.params;
    const { stream, fileName, mimeType, fileSize } =
      await resumesService.getResumeFileStream({
        id,
        userId: req.user.id,
        userRole: req.user.role,
      });

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader("Content-Length", fileSize);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

async function deleteResume(req, res, next) {
  try {
    const { id } = req.params;
    const result = await resumesService.deleteResume({
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

async function analyzeResume(req, res, next) {
  try {
    const { id } = req.params;
    const analysis = await resumesService.analyzeResume({
      resumeId: id,
      userId: req.user.id,
      userRole: req.user.role,
      req,
    });
    return successResponse(res, {
      data: analysis,
      message: "Resume ATS analysis completed.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listResumeAnalyses(req, res, next) {
  try {
    const { id } = req.params;
    const analyses = await resumesService.listResumeAnalyses({
      resumeId: id,
      userId: req.user.id,
      userRole: req.user.role,
    });
    return successResponse(res, { data: analyses, req });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  uploadResume,
  listMyResumes,
  getResumeById,
  downloadResume,
  deleteResume,
  analyzeResume,
  listResumeAnalyses,
};
