const pool = require("../../../../config/db");

const getTeams = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sort_by = "achievement_points",
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryString = `
      WITH team_data AS (
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
              'points', te.points_awarded
            )
          ) FILTER (WHERE te.event_id IS NOT NULL) as events,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ta.id,
              'title', ta.title,
              'points', ta.points
            )
          ) FILTER (WHERE ta.id IS NOT NULL) as achievements
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN users u ON tm.user_id = u.id
        LEFT JOIN team_events te ON t.id = te.team_id
        LEFT JOIN team_achievements ta ON t.id = ta.team_id
        WHERE (NOT t.is_private OR t.created_by = $1)
    `;

    const queryParams = [req.user?.id || 0];

    if (search) {
      queryString += ` AND t.name ILIKE $2`;
      queryParams.push(`%${search}%`);
    }

    queryString += `
        GROUP BY t.id
        ORDER BY 
          CASE WHEN $${
            queryParams.length + 1
          } = 'achievement_points' THEN t.achievement_points END DESC,
          CASE WHEN $${
            queryParams.length + 1
          } = 'member_count' THEN t.member_count END DESC,
          CASE WHEN $${
            queryParams.length + 1
          } = 'created_at' THEN t.created_at END DESC
        LIMIT $${queryParams.length + 2} 
        OFFSET $${queryParams.length + 3}
      )
      SELECT 
        (SELECT COUNT(*) FROM teams WHERE NOT is_private OR created_by = $1) as total_count,
        COALESCE(json_agg(
          json_build_object(
            'id', td.id,
            'name', td.name,
            'description', td.description,
            'is_private', td.is_private,
            'created_by', td.created_by,
            'member_count', td.member_count,
            'achievement_points', td.achievement_points,
            'avatar_url', td.avatar_url,
            'created_at', td.created_at,
            'members', td.members,
            'events', td.events,
            'achievements', td.achievements
          )
        ), '[]') as teams
      FROM team_data td;
    `;

    queryParams.push(sort_by, limit, offset);

    const result = await pool.query(queryString, queryParams);

    const response = {
      pagination: {
        total_items: Number(result.rows[0].total_count),
        total_pages: Math.ceil(Number(result.rows[0].total_count) / limit),
        current_page: Number(page),
        items_per_page: Number(limit),
      },
      teams: result.rows[0].teams || [],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getTeams;
