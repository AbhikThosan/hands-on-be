const pool = require("../../../../config/db");

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.achievement_points,
        t.member_count,
        t.avatar_url,
        json_agg(
          DISTINCT jsonb_build_object(
            'title', ta.title,
            'points', ta.points,
            'achieved_at', ta.achieved_at
          )
        ) as recent_achievements
      FROM teams t
      LEFT JOIN team_achievements ta ON t.id = ta.team_id
      WHERE NOT t.is_private
      GROUP BY t.id
      ORDER BY t.achievement_points DESC
      LIMIT 10
    `);

    res.json({
      message: "Team leaderboard",
      leaderboard: leaderboard.rows,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getLeaderboard;
