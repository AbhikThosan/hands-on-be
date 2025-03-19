const pool = require("../../../../config/db");

const getMyCreatedTeams = async (req, res) => {
  const { is_private } = req.query;

  try {
    let queryString = `
      SELECT 
        t.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', tm.user_id,
            'role', tm.role,
            'joined_at', tm.joined_at,
            'name', u.name
          )
        ) FILTER (WHERE tm.user_id IS NOT NULL) as members,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', te.event_id,
            'title', e.title,
            'date', e.date,
            'points_awarded', te.points_awarded
          )
        ) FILTER (WHERE te.event_id IS NOT NULL) as events,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ta.id,
            'title', ta.title,
            'points', ta.points,
            'achieved_at', ta.achieved_at
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as achievements
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      LEFT JOIN team_events te ON t.id = te.team_id
      LEFT JOIN events e ON te.event_id = e.id
      LEFT JOIN team_achievements ta ON t.id = ta.team_id
      WHERE t.created_by = $1
    `;

    const queryParams = [req.user.id];

    if (is_private !== undefined) {
      queryString += ` AND t.is_private = $2`;
      queryParams.push(is_private === "true");
    }

    queryString += ` GROUP BY t.id ORDER BY t.created_at DESC`;

    const result = await pool.query(queryString, queryParams);

    res.json({
      message: "Your created teams",
      teams: result.rows,
    });
  } catch (error) {
    console.error("Error fetching created teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getMyCreatedTeams;
