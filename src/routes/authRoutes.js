const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { register, login } = require("../controllers/authController");
const pool = require("../db");

const router = express.Router();

// User Registration Route
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

// User Login Route (Generate JWT)
router.post("/login", login);

// Only "admin" can get a list of all users
router.get(
  "/users",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const users = await pool.query("SELECT id, name, email, role FROM users");
      res.json(users.rows);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Protected Profile Route
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT id, name, email, skills, causes_supported, volunteer_hours, 
              volunteer_history, total_contributions, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Profile Route
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
  async (req, res) => {
    const { name, skills, causes_supported } = req.body;

    try {
      const updateQuery = `
        UPDATE users 
        SET name = COALESCE($1, name), 
            skills = COALESCE($2, skills), 
            causes_supported = COALESCE($3, causes_supported) 
        WHERE id = $4 
        RETURNING id, name, email, skills, causes_supported, volunteer_hours, 
                  volunteer_history, total_contributions, created_at;
      `;

      const updatedUser = await pool.query(updateQuery, [
        name || null,
        skills || null,
        causes_supported || null,
        req.user.id,
      ]);

      res.json(updatedUser.rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.put(
  "/users/:id/role",
  authMiddleware,
  roleMiddleware(["admin"]), // Only admins can update roles
  async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // Only allow specific roles
    const validRoles = ["admin", "organization", "volunteer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    try {
      const result = await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User role updated successfully",
        user: result.rows[0],
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;
