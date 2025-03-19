const express = require("express");
const { body, query } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createHelpRequest,
  getHelpRequests,
  getHelpRequestById,
  addComment,
  updateStatus,
  getCommentsByHelpRequestId,
} = require("../controllers/communityHelpController");

const router = express.Router();

// Create a new help request (authenticated users only)
router.post(
  "/community-help",
  [
    authMiddleware,
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("location")
      .trim()
      .notEmpty()
      .withMessage("Location is required")
      .isLength({ max: 255 })
      .withMessage("Location must be less than 255 characters"),
    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ max: 100 })
      .withMessage("Category must be less than 100 characters"),
    body("urgency_level")
      .trim()
      .notEmpty()
      .withMessage("Urgency level is required")
      .isIn(["low", "medium", "urgent"])
      .withMessage("Invalid urgency level"),
  ],
  createHelpRequest
);

// Get all help requests with filters and pagination
router.get(
  "/community-help",
  [
    query("category").optional().trim().isLength({ max: 100 }),
    query("location").optional().trim(),
    query("urgency_level")
      .optional()
      .isIn(["low", "medium", "urgent"])
      .withMessage("Invalid urgency level"),
    query("status")
      .optional()
      .isIn(["open", "in_progress", "completed", "closed"])
      .withMessage("Invalid status"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("all")
      .optional()
      .isBoolean()
      .withMessage("All parameter must be true or false"),
  ],
  getHelpRequests
);

// Get a single help request by ID
router.get("/community-help/:help_request_id", getHelpRequestById);

// Get all comments for a specific help request (public access)
router.get(
  "/community-help/:help_request_id/comments",
  getCommentsByHelpRequestId
);

// Add a comment to a help request (authenticated users only)
router.post(
  "/community-help/:help_request_id/comments",
  [
    authMiddleware,
    body("comment_text")
      .trim()
      .notEmpty()
      .withMessage("Comment text is required"),
    body("is_helper")
      .optional()
      .isBoolean()
      .withMessage("is_helper must be true or false"),
  ],
  addComment
);

// Update help request status (only creator can update)
router.patch(
  "/community-help/:id/status",
  [
    authMiddleware,
    body("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["open", "in_progress", "completed", "closed"])
      .withMessage("Invalid status"),
  ],
  updateStatus
);

module.exports = router;
