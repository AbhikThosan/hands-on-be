const express = require("express");
const { body, query } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  createEvent,
  getEvents,
  joinEvent,
  getSingleEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.post(
  "/events",
  [
    authMiddleware,
    roleMiddleware(["admin", "organization", "volunteer"]),
    // Validation middleware
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Event title is required")
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Event description is required"),
    body("date")
      .notEmpty()
      .withMessage("Event date is required")
      .isISO8601()
      .withMessage("Invalid date format")
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error("Event date must be in the future");
        }
        return true;
      }),
    body("time")
      .notEmpty()
      .withMessage("Event time is required")
      .isISO8601()
      .withMessage("Invalid time format"),
    body("location")
      .trim()
      .notEmpty()
      .withMessage("Event location is required")
      .isLength({ max: 255 })
      .withMessage("Location must be less than 255 characters"),
    body("category")
      .trim()
      .notEmpty()
      .withMessage("Event category is required")
      .isLength({ max: 100 })
      .withMessage("Category must be less than 100 characters"),
  ],
  createEvent
);

router.get(
  "/events",
  [
    query("category").optional().trim().isLength({ max: 100 }),
    query("location").optional().trim(),
    query("date").optional().isISO8601().withMessage("Invalid date format"),
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
  getEvents
);

router.get("/events/:event_id", getSingleEvent);

// Join Event Route (Only authenticated users can join events)
router.post(
  "/events/:eventId/join",
  [
    authMiddleware,
    roleMiddleware(["volunteer"]), // Only volunteers can join events
  ],
  joinEvent
);

module.exports = router;
