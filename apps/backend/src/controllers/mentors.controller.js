const mentorsService = require("../services/mentors.service");
const { successResponse } = require("../utils/response");

async function listMentors(req, res, next) {
  try {
    const { page, limit, search, minExp, maxRate, isAvailable } = req.query;
    const result = await mentorsService.listMentors({
      page,
      limit,
      search,
      minExp,
      maxRate,
      isAvailable: isAvailable !== undefined ? isAvailable === "true" : null,
    });
    return successResponse(res, {
      data: result.mentors,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function getMentorById(req, res, next) {
  try {
    const { id } = req.params;
    const mentor = await mentorsService.getMentorById(id);
    return successResponse(res, { data: mentor, req });
  } catch (err) {
    next(err);
  }
}

async function upsertMentorProfile(req, res, next) {
  try {
    const data = req.validatedBody || req.body;
    const profile = await mentorsService.upsertMentorProfile({
      userId: req.user.id,
      data,
      req,
    });
    return successResponse(res, {
      data: profile,
      message: "Mentor profile updated successfully.",
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMentorProfile(req, res, next) {
  try {
    const { id } = req.params;
    const result = await mentorsService.deleteMentorProfile({
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

module.exports = {
  listMentors,
  getMentorById,
  upsertMentorProfile,
  deleteMentorProfile,
};
