import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(255).trim().required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().trim().required(),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.",
      "string.min": "Password must be at least 8 characters long.",
      "any.required": "Password is required.",
    }),
  role: Joi.string().valid("admin", "student", "instructor").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})")
    )
    .invalid(Joi.ref("currentPassword"))
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.",
      "any.invalid": "New password cannot be the same as current password.",
      "string.min": "Password must be at least 8 characters long.",
      "any.required": "Password is required.",
    }),
});

// COURSE FINISHED
export const courseSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow(""),
  instructor_id: Joi.number().integer().required(),
  category: Joi.string().trim().required(),
  category_id: Joi.number().integer().allow(null),
  price: Joi.number().precision(2).min(0),
  thumbnail_url: Joi.string().uri().allow(null, ''),
  is_published: Joi.boolean(),
  is_approved: Joi.boolean(),
});
export const courseUpdateSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(""),
  category: Joi.string(),
  instructor_id: Joi.number().integer(),
});

// ENROLLMENT FINISHED
export const enrollmentSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  course_id: Joi.number().integer().required(),
  completed_at: Joi.date().optional().allow(null),
  progress: Joi.number().integer().min(0).max(100).optional(),
});

// MODULE FINISHED
export const moduleSchema = Joi.object({
  course_id: Joi.number().integer().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  order: Joi.number().integer().required(),
});

export const moduleUpdateSchema = Joi.object({
  course_id: Joi.number().integer(),
  title: Joi.string(),
  description: Joi.string().allow(""),
  order: Joi.number().integer(),
});

// LESSON FINISHED
export const lessonSchema = Joi.object({
  module_id: Joi.number().integer().required(),
  title: Joi.string().required(),
  content_type: Joi.string()
    .valid("video", "quiz", "text", "assignment")
    .required(),
  content_url: Joi.string().uri().allow(""),
  duration: Joi.number().integer().min(0).required(),
  order: Joi.number().integer().required(),
  is_free: Joi.boolean().default(false),
});

export const lessonUpdateSchema = Joi.object({
  module_id: Joi.number().integer(),
  title: Joi.string(),
  content_type: Joi.string().valid("video", "quiz", "text", "assignment"),
  content_url: Joi.string().uri().allow(""),
  duration: Joi.number().integer().min(0),
});

// QUIZ FINISHED
export const quizSchema = Joi.object({
  lesson_id: Joi.number().integer().required(),
  question: Joi.string().required(),
  options: Joi.array().items(Joi.string()).min(2).required(),
  correct_answer: Joi.string()
    .required()
    .custom((value, helpers) => {
      const { options } = helpers.state.ancestors[0];
      if (!options.includes(value)) {
        return helpers.message('"correct_answer" must be one of the options');
      }
      return value;
    }),
});

export const quizUpdateSchema = Joi.object({
  lesson_id: Joi.number().integer(),
  question: Joi.string(),
  options: Joi.array().items(Joi.string()).min(2),
  correct_answer: Joi.string(),
});

// ASSIGNMENT FINISHED
export const assignmentSchema = Joi.object({
  lesson_id: Joi.number().integer().required(),
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  deadline: Joi.date().iso().required(),
});
export const assignmentUpdateSchema = Joi.object({
  lesson_id: Joi.number().integer(),
  title: Joi.string(),
  description: Joi.string().allow(""),
  deadline: Joi.date().iso(),
});

// SUBMISSION FINISHED
export const submissionSchema = Joi.object({
  assignment_id: Joi.number().integer().required(),
  user_id: Joi.number().integer().required(),
  submission_url: Joi.string().uri().required(),
  grade: Joi.number().min(0).max(100).optional(),
});

// CATEGORY FINISHED
export const categorySchema = Joi.object({
  name: Joi.string().required(),
});

export const gradeSubmissionSchema = Joi.object({
  score: Joi.number().min(0).max(100).required(),
  feedback: Joi.string().max(1000).trim().allow(""),
});
