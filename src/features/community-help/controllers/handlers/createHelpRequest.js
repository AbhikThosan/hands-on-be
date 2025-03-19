const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const createHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, location, category, urgency_level } = req.body;

  try {
    const newRequest = await pool.query(
      `INSERT INTO community_help_requests 
        (title, description, location, category, urgency_level, created_by, created_by_role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        title,
        description,
        location,
        category,
        urgency_level,
        req.user.id,
        req.user.role,
      ]
    );

    res.status(201).json({
      message: "Help request created successfully",
      help_request: newRequest.rows[0],
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createHelpRequest;
