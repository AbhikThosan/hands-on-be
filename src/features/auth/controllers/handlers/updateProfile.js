const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
};

module.exports = updateProfile;
