/**
 * Mentors Input Validator
 */

function validateMentorProfile(body = {}) {
  const errors = [];
  const { expertise, yearsOfExp, hourlyRate, isAvailable } = body;

  if (!expertise || typeof expertise !== "string" || !expertise.trim()) {
    errors.push("Primary expertise / domain is required.");
  } else if (expertise.trim().length > 200) {
    errors.push("Expertise summary must not exceed 200 characters.");
  }

  const expNum = parseInt(yearsOfExp, 10);
  if (isNaN(expNum) || expNum < 0 || expNum > 60) {
    errors.push("Years of experience must be an integer between 0 and 60.");
  }

  let rateNum = null;
  if (hourlyRate !== undefined && hourlyRate !== null && hourlyRate !== "") {
    rateNum = parseFloat(hourlyRate);
    if (isNaN(rateNum) || rateNum < 0) {
      errors.push("Hourly rate must be a non-negative number.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      expertise: expertise ? expertise.trim().slice(0, 200) : "",
      yearsOfExp: isNaN(expNum) ? 0 : expNum,
      hourlyRate: rateNum,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    },
  };
}

module.exports = {
  validateMentorProfile,
};
