const { Router } = require("express");
const { dsaController } = require("../controllers/dsa.controller");

const router = Router();

router.get("/languages", (req, res, next) => dsaController.getLanguages(req, res, next));
router.get("/categories", (req, res, next) => dsaController.getCategories(req, res, next));
router.get("/:slug", (req, res, next) => dsaController.getAlgorithmBySlug(req, res, next));
router.get("/", (req, res, next) => dsaController.getAlgorithms(req, res, next));

module.exports = { dsaRouter: router };
