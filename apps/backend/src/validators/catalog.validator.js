/**
 * Catalog Validators (Categories, Skills, Career Paths, User Skills)
 */

function validateUserSkillInput(body = {}) {
  const errors = [];
  const { name, proficiency } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push("Skill name is required.");
  } else if (name.trim().length > 60) {
    errors.push("Skill name must not exceed 60 characters.");
  }

  const profNum = parseInt(proficiency, 10);
  if (isNaN(profNum) || profNum < 1 || profNum > 5) {
    errors.push("Proficiency must be an integer between 1 and 5.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: name ? name.trim().slice(0, 60) : "",
      proficiency: isNaN(profNum) ? 3 : profNum,
    },
  };
}

module.exports = {
  validateUserSkillInput,
};
