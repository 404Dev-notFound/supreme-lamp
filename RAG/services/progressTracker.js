/**
 * Progress Calculation & Dashboard Metrics Tracker.
 * Manages topic states, percentage metrics, milestones, and dashboard summaries.
 */
class ProgressTracker {
  /**
   * Calculates dashboard analytics from roadmap data and completed topic identifiers
   */
  static calculateDashboardMetrics({ roadmap, completedTopicIds = [], activeTopicId = null }) {
    if (!roadmap || !Array.isArray(roadmap.stages)) {
      return {
        overallProgress: 0,
        completedCount: 0,
        totalTopics: 0,
        remainingCount: 0,
        currentStage: "Not Started",
        currentSkillLevel: "Beginner",
        recommendedNextTopic: null,
        stageProgress: [],
        completedLearningPaths: [],
        inProgressLearningPaths: [],
        upcomingMilestones: [],
      };
    }

    const completedSet = new Set(
      completedTopicIds.map((id) => String(id).toLowerCase().trim())
    );

    let totalTopics = 0;
    let completedCount = 0;
    let currentStage = "Foundation";
    let recommendedNextTopic = null;
    const stageProgress = [];
    const upcomingMilestones = [];

    for (let sIdx = 0; sIdx < roadmap.stages.length; sIdx++) {
      const stage = roadmap.stages[sIdx];
      const stageItems = stage.items || [];
      let stageCompletedCount = 0;

      for (const item of stageItems) {
        totalTopics++;
        const itemId = String(item.id || item.topic).toLowerCase().trim();
        const isCompleted = completedSet.has(itemId) || completedSet.has(String(item.topic).toLowerCase().trim());

        if (isCompleted) {
          completedCount++;
          stageCompletedCount++;
        } else if (!recommendedNextTopic) {
          recommendedNextTopic = {
            id: item.id,
            topic: item.topic,
            stage: stage.stageName,
            difficulty: item.difficulty,
            estimatedEffort: item.estimatedEffort,
            whyRecommended: item.whyRecommended,
          };
          currentStage = stage.stageName;
        }
      }

      const stagePercent = stageItems.length > 0
        ? Math.round((stageCompletedCount / stageItems.length) * 100)
        : 0;

      stageProgress.push({
        stageId: stage.stageId || `stage_${sIdx + 1}`,
        stageName: stage.stageName,
        totalTopics: stageItems.length,
        completedTopics: stageCompletedCount,
        progressPercent: stagePercent,
        status: stagePercent === 100 ? "Completed" : stagePercent > 0 ? "In Progress" : "Not Started",
      });

      if (stagePercent < 100) {
        upcomingMilestones.push({
          milestoneName: stage.stageName,
          topicsRemaining: stageItems.length - stageCompletedCount,
          targetCompletionWeeks: Math.max(1, Math.ceil((stageItems.length - stageCompletedCount) / 2)),
        });
      }
    }

    const overallProgress = totalTopics > 0
      ? Math.min(100, Math.round((completedCount / totalTopics) * 100))
      : 0;

    const remainingCount = Math.max(0, totalTopics - completedCount);

    // Determine current effective skill level based on progression
    let currentSkillLevel = "Beginner";
    if (overallProgress >= 70) {
      currentSkillLevel = "Advanced";
    } else if (overallProgress >= 30) {
      currentSkillLevel = "Intermediate";
    }

    return {
      overallProgress,
      completedCount,
      totalTopics,
      remainingCount,
      currentStage: recommendedNextTopic ? recommendedNextTopic.stage : "Completed",
      currentSkillLevel,
      recommendedNextTopic,
      stageProgress,
      upcomingMilestones: upcomingMilestones.slice(0, 3),
      lastActivity: new Date().toISOString(),
    };
  }

  /**
   * Toggles topic completion status and updates timestamps
   */
  static toggleTopicProgress({ roadmap, completedTopicIds = [], topicId }) {
    if (!topicId) {
      throw new Error("topicId is required to toggle progress.");
    }

    const cleanTopicId = String(topicId).toLowerCase().trim();
    let updatedCompleted = [...completedTopicIds];

    if (updatedCompleted.map((t) => String(t).toLowerCase().trim()).includes(cleanTopicId)) {
      // Unmark completed -> Not Started
      updatedCompleted = updatedCompleted.filter(
        (t) => String(t).toLowerCase().trim() !== cleanTopicId
      );
    } else {
      // Mark as completed
      updatedCompleted.push(topicId);
    }

    const metrics = this.calculateDashboardMetrics({
      roadmap,
      completedTopicIds: updatedCompleted,
      activeTopicId: topicId,
    });

    return {
      completedTopicIds: updatedCompleted,
      metrics,
    };
  }
}

module.exports = {
  ProgressTracker,
};
