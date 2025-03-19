const express = require("express");
const { body, query } = require("express-validator");
const authMiddleware = require("../../../middleware/authMiddleware");
const {
  createTeam,
  getTeams,
  joinTeam,
  getLeaderboard,
  getTeamDashboard,
  sendTeamInvitation,
  respondToInvitation,
  getPendingInvitations,
  getMyCreatedTeams,
} = require("../controllers/teamController");

const router = express.Router();

router.post(
  "/",
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

router.get(
  "/",
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

router.post("/:team_id/join", [authMiddleware], joinTeam);

router.get("/leaderboard", getLeaderboard);

router.get("/:team_id/dashboard", [authMiddleware], getTeamDashboard);

router.post(
  "/:team_id/invite",
  [
    authMiddleware,
    body("user_email")
      .trim()
      .isEmail()
      .withMessage("Valid email address is required"),
  ],
  sendTeamInvitation
);

router.post(
  "/invitations/:invitation_id/respond",
  [
    authMiddleware,
    body("accept").isBoolean().withMessage("accept must be true or false"),
  ],
  respondToInvitation
);

router.get("/invitations", [authMiddleware], getPendingInvitations);

router.get("/created", [authMiddleware], getMyCreatedTeams);

module.exports = router;
