const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../../../middleware/authMiddleware");
const roleMiddleware = require("../../../middleware/roleMiddleware");
const {
  register,
  login,
  getUsers,
  getProfile,
  updateProfile,
  updateUserRole,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("causes_supported")
      .optional()
      .isArray()
      .withMessage("Causes must be an array"),
  ],
  register
);

router.post("/login", login);

router.get("/users", authMiddleware, roleMiddleware("admin"), getUsers);

router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  [
    body("name").optional().isString().withMessage("Name must be a string"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("causes_supported")
      .optional()
      .isArray()
      .withMessage("Causes must be an array"),
  ],
  updateProfile
);

router.put(
  "/users/:id/role",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateUserRole
);

module.exports = router;
