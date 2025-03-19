const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const createTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, is_private = false, avatar_url } = req.body;

  try {
    await pool.query("BEGIN");

    const newTeam = await pool.query(
      `INSERT INTO teams 
        (name, description, is_private, created_by, created_by_role, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, is_private, req.user.id, req.user.role, avatar_url]
    );

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) 
       VALUES ($1, $2, 'admin')`,
      [newTeam.rows[0].id, req.user.id]
    );

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = createTeam;
