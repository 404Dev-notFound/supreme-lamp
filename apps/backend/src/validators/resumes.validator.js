/**
 * Resumes Input Validators
 */

function validateResumeAnalysisData(body = {}) {
  const errors = [];
  const { overallScore, verdict, verdictReason, atsScore } = body;

  const scoreNum = parseInt(overallScore, 10);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    errors.push("overallScore must be an integer between 0 and 100.");
  }

  if (!verdict || typeof verdict !== "string") {
    errors.push("verdict is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      overallScore: isNaN(scoreNum) ? 0 : scoreNum,
      verdict: String(verdict || "").trim(),
      verdictReason: verdictReason ? String(verdictReason).trim() : null,
      atsScore: atsScore !== undefined ? parseInt(atsScore, 10) || null : null,
      atsIssues: body.atsIssues || [],
      topFixes: body.topFixes || [],
      strengths: body.strengths || [],
      flaws: body.flaws || [],
      sectionFeedback: body.sectionFeedback || {},
    },
  };
}

module.exports = {
  validateResumeAnalysisData,
};
