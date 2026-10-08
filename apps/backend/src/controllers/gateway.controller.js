const gatewayService = require("../services/gateway.service");
const { successResponse } = require("../utils/response");

async function predictMentalHealth(req, res, next) {
  try {
    const data = req.validatedBody || req.body;
    const result = await gatewayService.predictMentalHealth(data);
    return successResponse(res, { data: result, req });
  } catch (err) {
    next(err);
  }
}

async function checkServicesHealth(req, res, next) {
  try {
    const health = await gatewayService.checkServicesHealth();
    return successResponse(res, { data: health, req });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  predictMentalHealth,
  checkServicesHealth,
};
