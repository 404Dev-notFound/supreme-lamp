const { Router } = require("express");
const gatewayController = require("../controllers/gateway.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validation.middleware");
const { validateMentalHealthInput } = require("../validators/gateway.validator");

const router = Router();

// POST /api/services/mental-health/predict - Mental wellness score prediction
router.post(
  "/mental-health/predict",
  requireAuth,
  validate(validateMentalHealthInput),
  gatewayController.predictMentalHealth,
);

// GET /api/services/health - Status of internal AI microservices
router.get("/health", gatewayController.checkServicesHealth);

module.exports = { gatewayRouter: router };
