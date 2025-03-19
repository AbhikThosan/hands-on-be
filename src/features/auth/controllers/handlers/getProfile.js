const pool = require("../../../../config/db");

const getProfile = async (req, res) => {
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
};

module.exports = getProfile;
