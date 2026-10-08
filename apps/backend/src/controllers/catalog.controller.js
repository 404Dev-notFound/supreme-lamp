const catalogService = require("../services/catalog.service");
const { successResponse } = require("../utils/response");

async function listCategories(req, res, next) {
  try {
    const categories = await catalogService.listCategories();
    return successResponse(res, { data: categories, req });
  } catch (err) {
    next(err);
  }
}

async function listSkills(req, res, next) {
  try {
    const { category, search, page, limit } = req.query;
    const result = await catalogService.listSkills({
      category,
      search,
      page,
      limit,
    });
    return successResponse(res, {
      data: result.skills,
      meta: result.pagination,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function listCareerPaths(req, res, next) {
  try {
    const { level, search } = req.query;
    const paths = await catalogService.listCareerPaths({ level, search });
    return successResponse(res, { data: paths, req });
  } catch (err) {
    next(err);
  }
}

async function getCareerPathBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const path = await catalogService.getCareerPathBySlug(slug);
    return successResponse(res, { data: path, req });
  } catch (err) {
    next(err);
  }
}

async function getUserSkills(req, res, next) {
  try {
    const skills = await catalogService.getUserSkills(req.user.id);
    return successResponse(res, { data: skills, req });
  } catch (err) {
    next(err);
  }
}

async function addUserSkill(req, res, next) {
  try {
    const { name, proficiency } = req.validatedBody || req.body;
    const userSkill = await catalogService.addUserSkill({
      userId: req.user.id,
      skillName: name,
      proficiency,
    });
    return successResponse(res, {
      data: userSkill,
      message: "Skill saved to your profile.",
      statusCode: 201,
      req,
    });
  } catch (err) {
    next(err);
  }
}

async function removeUserSkill(req, res, next) {
  try {
    const { skillId } = req.params;
    const result = await catalogService.removeUserSkill({
      userId: req.user.id,
      skillId,
    });
    return successResponse(res, { message: result.message, req });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  listSkills,
  listCareerPaths,
  getCareerPathBySlug,
  getUserSkills,
  addUserSkill,
  removeUserSkill,
};
