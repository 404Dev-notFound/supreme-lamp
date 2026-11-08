const { dsaService } = require("../services/dsa.service");
const { prisma } = require("../lib/prisma");
const { analyticsService } = require("../services/analytics.service");

class DsaController {
  async getAlgorithms(req, res, next) {
    try {
      const { category, difficulty, search, language } = req.query;
      const algorithms = dsaService.listAlgorithms({ category, difficulty, search, language });
      return res.status(200).json({
        success: true,
        count: algorithms.length,
        data: algorithms,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAlgorithmBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const algorithm = dsaService.getAlgorithmBySlug(slug);
      if (!algorithm) {
        return res.status(404).json({
          success: false,
          error: "Algorithm not found",
        });
      }
      return res.status(200).json({
        success: true,
        data: algorithm,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = dsaService.getCategories();
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLanguages(req, res, next) {
    try {
      const languages = dsaService.getLanguages();
      return res.status(200).json({
        success: true,
        count: languages.length,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const solved = await prisma.userDsaProgress.findMany({
        where: { userId, isSolved: true },
        select: { problemSlug: true, solvedAt: true },
      });
      const solvedSlugs = solved.map((s) => s.problemSlug);
      return res.status(200).json({
        success: true,
        count: solvedSlugs.length,
        data: {
          solvedSlugs,
          count: solvedSlugs.length,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleSolveProblem(req, res, next) {
    try {
      const userId = req.user.id;
      const { slug } = req.params;
      const { language } = req.body || {};

      const existing = await prisma.userDsaProgress.findUnique({
        where: {
          userId_problemSlug: {
            userId,
            problemSlug: slug,
          },
        },
      });

      const nextSolved = !existing?.isSolved;
      const updated = await prisma.userDsaProgress.upsert({
        where: {
          userId_problemSlug: {
            userId,
            problemSlug: slug,
          },
        },
        create: {
          userId,
          problemSlug: slug,
          language: language || null,
          isSolved: nextSolved,
          solvedAt: nextSolved ? new Date() : null,
          lastAttemptAt: new Date(),
        },
        update: {
          isSolved: nextSolved,
          solvedAt: nextSolved ? new Date() : null,
          lastAttemptAt: new Date(),
          ...(language ? { language } : {}),
        },
      });

      if (nextSolved) {
        await analyticsService.recordEvent({
          userId,
          eventType: "SOLVE",
          entityType: "DSA",
          entityId: slug,
          metadata: { language },
        });
      }

      const totalSolved = await prisma.userDsaProgress.count({
        where: { userId, isSolved: true },
      });

      return res.status(200).json({
        success: true,
        data: {
          slug,
          isSolved: updated.isSolved,
          solvedAt: updated.solvedAt,
          totalSolved,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

const dsaController = new DsaController();

module.exports = { dsaController };
