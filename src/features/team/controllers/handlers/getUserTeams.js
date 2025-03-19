const pool = require("../../../../config/db");

const getUserTeams = async (req, res) => {
  try {
    const teams = await pool.query(
      `
      SELECT 
        t.*,
        tm.role as member_role,
        tm.joined_at,
        tm.contribution_points,
        (
          SELECT COUNT(*) 
          FROM team_events te 
          WHERE te.team_id = t.id
        ) as total_events
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at DESC
    `,
      [req.user.id]
    );

    res.json({
      message: "User's team memberships",
      teams: teams.rows,
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getUserTeams;
