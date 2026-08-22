import { Router, Request, Response } from "express";
import {
  getAllRoadmaps,
  getRoadmapBySlug,
  getTopicDetail,
  searchRoadmaps,
} from "@flowctrl/roadmap-data";

const router = Router();

// GET /api/roadmaps - List all roadmaps with optional search/filtering
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, category, level } = req.query;

    let results =
      typeof search === "string" ? searchRoadmaps(search) : getAllRoadmaps();

    if (typeof category === "string" && category.trim()) {
      results = results.filter(
        (r) => r.category.toLowerCase() === category.toLowerCase().trim(),
      );
    }

    if (typeof level === "string" && level.trim()) {
      results = results.filter(
        (r) => r.level.toLowerCase() === level.toLowerCase().trim(),
      );
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching roadmaps",
    });
  }
});

// GET /api/roadmaps/:slug - Get full roadmap detail, graph nodes, edges, topics
router.get("/:slug", (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const roadmap = getRoadmapBySlug(slug);

    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: `Roadmap track '${slug}' was not found.`,
      });
    }

    res.status(200).json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    console.error(`Error fetching roadmap:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching roadmap detail",
    });
  }
});

// GET /api/roadmaps/:slug/topics/:topicId - Get specific topic detail
router.get("/:slug/topics/:topicId", (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const topicId = String(req.params.topicId);
    const topic = getTopicDetail(slug, topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: `Topic '${topicId}' was not found in roadmap '${slug}'.`,
      });
    }

    res.status(200).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error(`Error fetching topic:`, error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching topic detail",
    });
  }
});

export { router as roadmapsRouter };
