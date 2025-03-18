const express = require("express");
const { body, query } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTeam,
  getTeams,
  joinTeam,
  getLeaderboard,
  getTeamDashboard,
  sendTeamInvitation,
  respondToInvitation,
  getUserTeams,
  getPendingInvitations,
  getMyCreatedTeams,
} = require("../controllers/teamController");

const router = express.Router();

// Create a new team (authenticated users only)
router.post(
  "/teams",
  [
    authMiddleware,
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Team name is required")
      .isLength({ max: 255 })
      .withMessage("Team name must be less than 255 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Team description is required"),
    body("is_private")
      .optional()
      .isBoolean()
      .withMessage("is_private must be true or false"),
    body("avatar_url").optional().isURL().withMessage("Invalid avatar URL"),
  ],
  createTeam
);

// Get all teams with filters and pagination
router.get(
  "/teams",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search").optional().trim(),
    query("sort_by")
      .optional()
      .isIn(["achievement_points", "member_count", "created_at"])
      .withMessage("Invalid sort field"),
  ],
  getTeams
);

// Join a team (authenticated users only)
router.post("/teams/:team_id/join", [authMiddleware], joinTeam);

// Get team leaderboard
router.get("/teams/leaderboard", getLeaderboard);

// Get team dashboard (authenticated users only)
router.get("/teams/:team_id/dashboard", [authMiddleware], getTeamDashboard);

// Send team invitation (authenticated users only)
router.post(
  "/teams/:team_id/invite",
  [
    authMiddleware,
    body("user_email")
      .trim()
      .isEmail()
      .withMessage("Valid email address is required"),
  ],
  sendTeamInvitation
);

// Respond to team invitation (authenticated users only)
router.post(
  "/teams/invitations/:invitation_id/respond",
  [
    authMiddleware,
    body("accept").isBoolean().withMessage("accept must be true or false"),
  ],
  respondToInvitation
);

// Get user's team memberships (authenticated users only)
router.get("/user/teams", [authMiddleware], getUserTeams);

// Get user's pending invitations (authenticated users only)
router.get("/teams/invitations", [authMiddleware], getPendingInvitations);

// Get teams created by the authenticated user
router.get("/teams/created", [authMiddleware], getMyCreatedTeams);

module.exports = router;
