const {
  validateProfileUpdate,
  validateUrl,
  isSafeUrl,
  maskIpAddress,
} = require("../utils/security");

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

function validateUserId(id) {
  if (!id || typeof id !== "string" || !SAFE_ID_REGEX.test(id.trim())) {
    return { isValid: false, error: "Valid user identifier format required." };
  }
  return { isValid: true, id: id.trim() };
}

function validateSessionId(id) {
  if (!id || typeof id !== "string" || !SAFE_ID_REGEX.test(id.trim())) {
    return { isValid: false, error: "Valid session identifier is required." };
  }
  return { isValid: true, id: id.trim() };
}

function validateAvatarId(id) {
  if (
    !id ||
    typeof id !== "string" ||
    !SAFE_ID_REGEX.test(id.replace(/\.[^.]+$/, ""))
  ) {
    return { isValid: false, error: "Invalid avatar identifier." };
  }
  return { isValid: true, id: id.trim() };
}

module.exports = {
  SAFE_ID_REGEX,
  validateUserId,
  validateSessionId,
  validateAvatarId,
  validateProfileUpdate,
  validateUrl,
  isSafeUrl,
  maskIpAddress,
};

