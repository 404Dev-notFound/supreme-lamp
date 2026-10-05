/**
 * Authentication Input Validators
 * ---------------------------------
 * Enforces strict, production-grade schema validation for all auth endpoints.
 * Never trusts client-side validation alone.
 */

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

function validateSignup(data = {}) {
  const errors = [];
  const { name, email, password, confirmPassword } = data;

  // Name Validation
  if (!name || typeof name !== "string") {
    errors.push("Full name is required.");
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      errors.push("Full name must be at least 2 characters long.");
    } else if (trimmedName.length > 100) {
      errors.push("Full name must not exceed 100 characters.");
    }
  }

  // Email Validation
  if (!email || typeof email !== "string") {
    errors.push("Email address is required.");
  } else {
    const normalized = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalized)) {
      errors.push("Please provide a valid email address.");
    } else if (normalized.length > 255) {
      errors.push("Email address must not exceed 255 characters.");
    }
  }

  // Password Validation
  if (!password || typeof password !== "string") {
    errors.push("Password is required.");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    } else if (password.length > 128) {
      errors.push("Password must not exceed 128 characters.");
    }
  }

  // Confirm Password Check
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name: typeof name === "string" ? name.trim() : "",
      email: normalizeEmail(email),
      password: typeof password === "string" ? password : "",
    },
  };
}

function validateSignin(data = {}) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== "string") {
    errors.push("Email address is required.");
  } else {
    const normalized = normalizeEmail(email);
    if (!EMAIL_REGEX.test(normalized)) {
      errors.push("Please provide a valid email address.");
    }
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required.");
  } else if (password.length > 128) {
    errors.push("Invalid credentials.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email: normalizeEmail(email),
      password: typeof password === "string" ? password : "",
    },
  };
}

function validateChangePassword(data = {}) {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword || typeof currentPassword !== "string") {
    errors.push("Current password is required.");
  }

  if (!newPassword || typeof newPassword !== "string") {
    errors.push("New password is required.");
  } else {
    if (newPassword.length < 8) {
      errors.push("New password must be at least 8 characters long.");
    } else if (newPassword.length > 128) {
      errors.push("New password must not exceed 128 characters.");
    }
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push("New passwords do not match.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      currentPassword: typeof currentPassword === "string" ? currentPassword : "",
      newPassword: typeof newPassword === "string" ? newPassword : "",
    },
  };
}

module.exports = {
  validateSignup,
  validateSignin,
  validateChangePassword,
  normalizeEmail,
};
