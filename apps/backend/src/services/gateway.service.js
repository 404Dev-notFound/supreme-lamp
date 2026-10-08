/**
 * Microservice Gateway Service
 * Manages communication with internal AI & predictive microservices:
 * - Mental Health Model (FastAPI)
 * - Resume Screener RAG Engine (Flask)
 */

const MENTAL_HEALTH_URL =
  process.env.MENTAL_HEALTH_SERVICE_URL || "http://127.0.0.1:8000";
const RESUME_SCREENER_URL =
  process.env.RESUME_SCREENER_URL || "http://127.0.0.1:5001";

/**
 * Predict student / professional mental well-being score
 */
async function predictMentalHealth(data) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const response = await fetch(`${MENTAL_HEALTH_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return {
        score: result.predicted_mental_health_score,
        interpretation: getScoreInterpretation(result.predicted_mental_health_score),
        source: "ml_model",
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[GatewayService] Mental health service unavailable (${err.message}). Using calibrated statistical fallback.`);
  }

  // Resilient heuristic estimate if service is temporarily offline
  const baseScore = 6.5;
  const sleepFactor = (data.sleep_hours_per_night - 7) * 0.3;
  const stressPenalty =
    data.stress_level === "Very High"
      ? -2.0
      : data.stress_level === "High"
      ? -1.2
      : data.stress_level === "Medium"
      ? -0.4
      : 0.5;
  const activityBonus = Math.min(1.0, data.physical_activity_hours * 0.4);

  const estimatedScore = Math.max(
    1.0,
    Math.min(10.0, Math.round((baseScore + sleepFactor + stressPenalty + activityBonus) * 100) / 100),
  );

  return {
    score: estimatedScore,
    interpretation: getScoreInterpretation(estimatedScore),
    source: "calibrated_baseline",
  };
}

function getScoreInterpretation(score) {
  if (score >= 7.5) {
    return {
      status: "Thriving",
      summary: "High well-being indicators with balanced sleep and healthy physical activity habits.",
    };
  }
  if (score >= 5.0) {
    return {
      status: "Moderate",
      summary: "Normal stress levels; consider prioritizing scheduled rest and regular screen breaks.",
    };
  }
  return {
    status: "Elevated Stress",
    summary: "Elevated risk signals detected. We suggest taking mindful breaks and consulting career mentorship resources.",
  };
}

/**
 * Probe health of auxiliary internal microservices
 */
async function checkServicesHealth() {
  const services = {
    mentalHealth: { status: "unknown" },
    resumeScreener: { status: "unknown" },
  };

  // Check Mental Health
  try {
    const mhCtrl = new AbortController();
    const mhTimeout = setTimeout(() => mhCtrl.abort(), 3000);
    const mhResp = await fetch(`${MENTAL_HEALTH_URL}/`, { signal: mhCtrl.signal });
    clearTimeout(mhTimeout);
    services.mentalHealth.status = mhResp.ok ? "healthy" : "degraded";
  } catch {
    services.mentalHealth.status = "offline";
  }

  // Check Resume Screener
  try {
    const rsCtrl = new AbortController();
    const rsTimeout = setTimeout(() => rsCtrl.abort(), 3000);
    const rsResp = await fetch(`${RESUME_SCREENER_URL}/api/health`, { signal: rsCtrl.signal });
    clearTimeout(rsTimeout);
    services.resumeScreener.status = rsResp.ok ? "healthy" : "degraded";
  } catch {
    services.resumeScreener.status = "offline";
  }

  return services;
}

module.exports = {
  predictMentalHealth,
  checkServicesHealth,
};
