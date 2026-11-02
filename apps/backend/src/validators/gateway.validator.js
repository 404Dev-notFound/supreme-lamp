/**
 * Microservice Gateway Input Validators
 */

const VALID_GENDERS = ["Male", "Female"];
const VALID_ACADEMIC_LEVELS = ["Undergraduate", "Graduate", "High School"];
const VALID_PLATFORMS = [
  "Facebook",
  "LinkedIn",
  "Instagram",
  "Snapchat",
  "Twitter",
  "YouTube",
  "TikTok",
  "LINE",
  "KakaoTalk",
  "VKontakte",
  "WhatsApp",
  "WeChat",
];
const VALID_PURPOSES = ["Networking", "Education", "Entertainment", "News"];
const VALID_STRESS_LEVELS = ["Low", "Medium", "High", "Very High"];

function validateMentalHealthInput(body = {}) {
  const errors = [];
  const {
    age,
    gender,
    country,
    academic_level,
    most_used_platform,
    purpose_of_use,
    avg_daily_usage_hours,
    daily_unlocks,
    study_hours,
    physical_activity_hours,
    sleep_hours_per_night,
    stress_level,
  } = body;

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
    errors.push("Age must be an integer between 10 and 100.");
  }

  if (!gender || !VALID_GENDERS.includes(gender)) {
    errors.push(`Gender must be one of: ${VALID_GENDERS.join(", ")}`);
  }

  if (!country || typeof country !== "string" || !country.trim()) {
    errors.push("Country is required.");
  }

  if (!academic_level || !VALID_ACADEMIC_LEVELS.includes(academic_level)) {
    errors.push(
      `Academic level must be one of: ${VALID_ACADEMIC_LEVELS.join(", ")}`,
    );
  }

  if (!most_used_platform || !VALID_PLATFORMS.includes(most_used_platform)) {
    errors.push(
      `Most used platform must be one of: ${VALID_PLATFORMS.join(", ")}`,
    );
  }

  if (!purpose_of_use || !VALID_PURPOSES.includes(purpose_of_use)) {
    errors.push(`Purpose of use must be one of: ${VALID_PURPOSES.join(", ")}`);
  }

  const dailyUsage = parseFloat(avg_daily_usage_hours);
  if (isNaN(dailyUsage) || dailyUsage < 0 || dailyUsage > 24) {
    errors.push("Daily usage hours must be between 0 and 24.");
  }

  const unlocks = parseInt(daily_unlocks, 10);
  if (isNaN(unlocks) || unlocks < 0) {
    errors.push("Daily unlocks must be a non-negative integer.");
  }

  const study = parseFloat(study_hours);
  if (isNaN(study) || study < 0 || study > 24) {
    errors.push("Study hours must be between 0 and 24.");
  }

  const activity = parseFloat(physical_activity_hours);
  if (isNaN(activity) || activity < 0 || activity > 24) {
    errors.push("Physical activity hours must be between 0 and 24.");
  }

  const sleep = parseFloat(sleep_hours_per_night);
  if (isNaN(sleep) || sleep < 0 || sleep > 24) {
    errors.push("Sleep hours per night must be between 0 and 24.");
  }

  if (!stress_level || !VALID_STRESS_LEVELS.includes(stress_level)) {
    errors.push(`Stress level must be one of: ${VALID_STRESS_LEVELS.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      age: ageNum,
      gender,
      country: String(country || "").trim().slice(0, 80),
      academic_level,
      most_used_platform,
      purpose_of_use,
      avg_daily_usage_hours: dailyUsage,
      daily_unlocks: unlocks,
      study_hours: study,
      physical_activity_hours: activity,
      sleep_hours_per_night: sleep,
      stress_level,
    },
  };
}

module.exports = {
  validateMentalHealthInput,
};
