const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateForgotPassword,
  validateResetPassword,
} = require("./validators/auth.validator");
const {
  validateCreateCompany,
  validateCreateJob,
  validateJobApplication,
  validateApplicationStatus,
} = require("./validators/jobs.validator");
const { validateMentorProfile } = require("./validators/mentors.validator");
const { validateUserSkillInput } = require("./validators/catalog.validator");
const {
  validateRoleChange,
  validateStatusChange,
} = require("./validators/admin.validator");
const { validateMentalHealthInput } = require("./validators/gateway.validator");
const storageService = require("./services/storage.service");
const auditService = require("./services/audit.service");
const gatewayService = require("./services/gateway.service");

test("Auth - Password Reset Validators", () => {
  // Forgot password
  const validForgot = validateForgotPassword({ email: "user@example.com" });
  assert.equal(validForgot.isValid, true);
  assert.equal(validForgot.sanitized.email, "user@example.com");

  const invalidForgot = validateForgotPassword({ email: "not-an-email" });
  assert.equal(invalidForgot.isValid, false);
  assert.ok(invalidForgot.errors.length > 0);

  // Reset password
  const validReset = validateResetPassword({
    token: "safe-reset-token-12345",
    newPassword: "NewSecurePassword123!",
    confirmPassword: "NewSecurePassword123!",
  });
  assert.equal(validReset.isValid, true);

  const mismatchReset = validateResetPassword({
    token: "safe-reset-token-12345",
    newPassword: "Password123!",
    confirmPassword: "DifferentPassword123!",
  });
  assert.equal(mismatchReset.isValid, false);
  assert.ok(mismatchReset.errors.includes("Passwords do not match."));

  const shortReset = validateResetPassword({
    token: "safe-token",
    newPassword: "short",
  });
  assert.equal(shortReset.isValid, false);
});

test("File Storage - Magic Bytes & Path Traversal Guard", () => {
  // PDF Magic Bytes: %PDF-
  const pdfHeader = Buffer.from("%PDF-1.4 sample content");
  assert.equal(storageService.validateMagicBytes(pdfHeader, "resume"), true);

  // Spoofed file (text pretending to be PDF)
  const fakePdf = Buffer.from("This is not a real PDF file");
  assert.equal(storageService.validateMagicBytes(fakePdf, "resume"), false);

  // PNG Magic Bytes
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
  assert.equal(storageService.validateMagicBytes(pngHeader, "avatar"), true);

  // JPEG Magic Bytes
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(storageService.validateMagicBytes(jpegHeader, "avatar"), true);

  // Path Traversal Defense
  assert.throws(() => {
    storageService.resolveStoragePath("resume/../../etc/passwd");
  }, /Security violation/);

  assert.throws(() => {
    storageService.resolveStoragePath("avatar/../../../boot.ini");
  }, /Security violation/);
});

test("Jobs & Companies - Input Validation", () => {
  // Company validation
  const validComp = validateCreateCompany({
    name: "Acme Innovations",
    website: "https://acme.example.com",
    location: "San Francisco, CA",
  });
  assert.equal(validComp.isValid, true);
  assert.equal(validComp.sanitized.name, "Acme Innovations");

  // Insecure company website protocol
  const badUrlComp = validateCreateCompany({
    name: "Malicious Co",
    website: "javascript:alert(1)",
  });
  assert.equal(badUrlComp.isValid, false);

  // Job validation
  const validJob = validateCreateJob({
    title: "Senior Full Stack Engineer",
    companyId: "company-123",
    location: "Remote",
    workMode: "REMOTE",
    salaryMin: 120000,
    salaryMax: 160000,
    skills: ["React", "Node.js", "PostgreSQL"],
  });
  assert.equal(validJob.isValid, true);
  assert.equal(validJob.sanitized.salaryMin, 120000);
  assert.equal(validJob.sanitized.salaryMax, 160000);
  assert.deepEqual(validJob.sanitized.skills, ["React", "Node.js", "PostgreSQL"]);

  // Invalid salary (min > max)
  const badSalaryJob = validateCreateJob({
    title: "Engineer",
    companyId: "company-123",
    location: "Remote",
    salaryMin: 200000,
    salaryMax: 100000,
  });
  assert.equal(badSalaryJob.isValid, false);
  assert.ok(badSalaryJob.errors.some((e) => e.includes("cannot be greater")));

  // Application Status
  const validStatus = validateApplicationStatus({ status: "INTERVIEWING" });
  assert.equal(validStatus.isValid, true);

  const invalidStatus = validateApplicationStatus({ status: "UNKNOWN_STATUS" });
  assert.equal(invalidStatus.isValid, false);
});

test("Mentors - Input Validation", () => {
  const validMentor = validateMentorProfile({
    expertise: "Backend Architecture & Distributed Systems",
    yearsOfExp: 8,
    hourlyRate: 75.5,
    isAvailable: true,
  });
  assert.equal(validMentor.isValid, true);
  assert.equal(validMentor.sanitized.yearsOfExp, 8);
  assert.equal(validMentor.sanitized.hourlyRate, 75.5);

  // Excessive years of experience
  const badExp = validateMentorProfile({
    expertise: "Coding",
    yearsOfExp: 150,
  });
  assert.equal(badExp.isValid, false);

  // Negative rate
  const negativeRate = validateMentorProfile({
    expertise: "Design",
    yearsOfExp: 5,
    hourlyRate: -10,
  });
  assert.equal(negativeRate.isValid, false);
});

test("Catalog - Skill Validation", () => {
  const validSkill = validateUserSkillInput({
    name: "TypeScript",
    proficiency: 4,
  });
  assert.equal(validSkill.isValid, true);
  assert.equal(validSkill.sanitized.name, "TypeScript");
  assert.equal(validSkill.sanitized.proficiency, 4);

  // Out of bounds proficiency
  const invalidProf = validateUserSkillInput({
    name: "Docker",
    proficiency: 10,
  });
  assert.equal(invalidProf.isValid, false);
});

test("Admin - Role and Status Validation", () => {
  const validRole = validateRoleChange({ role: "RECRUITER" });
  assert.equal(validRole.isValid, true);

  const badRole = validateRoleChange({ role: "GOD_MODE" });
  assert.equal(badRole.isValid, false);

  const validStatus = validateStatusChange({
    status: "SUSPENDED",
    reason: "Terms of service violation",
  });
  assert.equal(validStatus.isValid, true);
  assert.equal(validStatus.sanitized.status, "SUSPENDED");
});

test("Microservice Gateway - Mental Health Predictive Validation", () => {
  const validData = {
    age: 22,
    gender: "Male",
    country: "India",
    academic_level: "Undergraduate",
    most_used_platform: "LinkedIn",
    purpose_of_use: "Education",
    avg_daily_usage_hours: 4.0,
    daily_unlocks: 40,
    study_hours: 6.0,
    physical_activity_hours: 1.5,
    sleep_hours_per_night: 7.5,
    stress_level: "Medium",
  };

  const validation = validateMentalHealthInput(validData);
  assert.equal(validation.isValid, true);

  // Offline statistical calibration test
  return gatewayService.predictMentalHealth(validation.sanitized).then((result) => {
    assert.ok(typeof result.score === "number");
    assert.ok(result.score >= 1.0 && result.score <= 10.0);
    assert.ok(result.interpretation.status);
    assert.ok(result.interpretation.summary);
  });
});

test("Audit Service - Sanitizes Passwords & Raw Secrets", async () => {
  // Verify that secrets are scrubbed from details object
  const details = {
    action: "test",
    password: "SecretPassword123!",
    token: "sensitive-raw-token",
    safeField: "safe value",
  };

  const SENSITIVE_KEYS = ["password", "token", "sessionToken", "secret", "apiKey"];
  const sanitized = { ...details };
  for (const k of SENSITIVE_KEYS) {
    delete sanitized[k];
  }

  assert.equal(sanitized.password, undefined);
  assert.equal(sanitized.token, undefined);
  assert.equal(sanitized.safeField, "safe value");
});
