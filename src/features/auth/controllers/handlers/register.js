const bcrypt = require("bcryptjs");
const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const register = async (req, res) => {
  const { name, email, password, skills, causes_supported } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, skills, causes_supported, volunteer_hours, role) 
       VALUES ($1, $2, $3, $4, $5, 0, 'volunteer') 
       RETURNING id, name, email, skills, causes_supported, volunteer_hours, role, created_at`,
      [name, email, hashedPassword, skills || [], causes_supported || []]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = register;
