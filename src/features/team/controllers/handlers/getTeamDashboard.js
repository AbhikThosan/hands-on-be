const pool = require("../../../../config/db");

const getTeamDashboard = async (req, res) => {
  const { team_id } = req.params;

  try {
    const team = await pool.query(
      `
      SELECT t.*, 
        (SELECT tm.role FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $1) as user_role
      FROM teams t 
      WHERE t.id = $2 AND (
        NOT t.is_private OR 
        t.created_by = $1 OR 
        EXISTS (SELECT 1 FROM team_members WHERE team_id = t.id AND user_id = $1)
      )
    `,
      [req.user.id, team_id]
    );

    if (team.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Team not found or access denied" });
    }

    const dashboard = await pool.query(
      `
      WITH member_data AS (
        SELECT 
          tm.team_id,
          json_agg(
            json_build_object(
              'id', tm.user_id,
              'role', tm.role,
              'joined_at', tm.joined_at,
              'name', u.name,
              'contribution_points', tm.contribution_points
            )
          ) as members
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1
        GROUP BY tm.team_id
      ),
      event_data AS (
        SELECT 
          te.team_id,
          json_agg(
            json_build_object(
              'id', e.id,
              'title', e.title,
              'date', e.date,
              'points_awarded', te.points_awarded
            ) ORDER BY e.date DESC
          ) as recent_events
        FROM team_events te
        JOIN events e ON te.event_id = e.id
        WHERE te.team_id = $1
        GROUP BY te.team_id
      ),
      achievement_data AS (
        SELECT 
          team_id,
          json_agg(
            json_build_object(
              'id', id,
              'title', title,
              'points', points,
              'achieved_at', achieved_at
            ) ORDER BY achieved_at DESC
          ) as recent_achievements
        FROM team_achievements
        WHERE team_id = $1
        GROUP BY team_id
      )
      SELECT 
        t.*,
        COALESCE(md.members, '[]'::json) as members,
        COALESCE(ed.recent_events, '[]'::json) as recent_events,
        COALESCE(ad.recent_achievements, '[]'::json) as recent_achievements
      FROM teams t
      LEFT JOIN member_data md ON t.id = md.team_id
      LEFT JOIN event_data ed ON t.id = ed.team_id
      LEFT JOIN achievement_data ad ON t.id = ad.team_id
      WHERE t.id = $1
    `,
      [team_id]
    );

    res.json({
      message: "Team dashboard",
      dashboard: {
        ...dashboard.rows[0],
        user_role: team.rows[0].user_role,
      },
    });
  } catch (error) {
    console.error("Error fetching team dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getTeamDashboard;
