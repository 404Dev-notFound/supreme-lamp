const { z } = require("zod");

/**
 * Validation schemas for Project-Building Tutorials endpoints
 */

const listQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search query cannot exceed 100 characters")
    .optional()
    .transform((val) => (val ? val.replace(/[<>'"]/g, "") : undefined)),
  category: z
    .string()
    .trim()
    .max(50)
    .optional(),
  language: z
    .string()
    .trim()
    .max(50)
    .optional(),
  difficulty: z
    .enum(["Beginner", "Intermediate", "Advanced", "all"], {
      errorMap: () => ({ message: "Difficulty must be Beginner, Intermediate, or Advanced" }),
    })
    .optional(),
  page: z
    .coerce
    .number()
    .int()
    .positive()
    .default(1),
  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(12),
  sort: z
    .enum(["recommended", "newest", "difficulty_asc", "difficulty_desc", "duration_asc", "duration_desc"])
    .default("recommended"),
});

const stepProgressSchema = z.object({
  stepNumber: z
    .coerce
    .number()
    .int()
    .positive({ message: "stepNumber must be a positive integer" }),
  isCompleted: z
    .boolean({ required_error: "isCompleted boolean is required" }),
  notes: z
    .string()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional()
    .nullable(),
});

function validateListQuery(req, res, next) {
  const result = listQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validatedQuery = result.data;
  next();
}

function validateStepProgress(req, res, next) {
  const payload = {
    stepNumber: req.params.stepNumber ?? req.body.stepNumber,
    isCompleted: req.body.isCompleted,
    notes: req.body.notes,
  };

  const result = stepProgressSchema.safeParse(payload);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      errors: result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
  }
  req.validatedBody = result.data;
  next();
}

module.exports = {
  validateListQuery,
  validateStepProgress,
  listQuerySchema,
  stepProgressSchema,
};
