const pool = require("../../../../config/db");

const getHelpRequests = async (req, res) => {
  const {
    category,
    location,
    urgency_level,
    status,
    page = 1,
    limit = 10,
    all = false,
  } = req.query;

  let queryString = `
    WITH comments_agg AS (
      SELECT 
        help_request_id,
        json_agg(
          json_build_object(
            'id', id,
            'comment_text', comment_text,
            'created_by', created_by,
            'created_by_role', created_by_role,
            'is_helper', is_helper,
            'created_at', created_at,
            'commenter_name', (SELECT name FROM users WHERE id = created_by)
          ) ORDER BY created_at DESC
        ) as comments
      FROM community_help_comments
      GROUP BY help_request_id
    ),
    filtered_requests AS (
      SELECT 
        hr.*,
        u.name as creator_name,
        COALESCE(c.comments, '[]'::json) as comments
      FROM community_help_requests hr
      JOIN users u ON hr.created_by = u.id
      LEFT JOIN comments_agg c ON c.help_request_id = hr.id
      WHERE 1=1
  `;

  const queryParams = [];
  let paramCount = 0;

  if (category) {
    paramCount++;
    queryParams.push(category);
    queryString += ` AND hr.category = $${paramCount}`;
  }

  if (location) {
    paramCount++;
    queryParams.push(`%${location}%`);
    queryString += ` AND hr.location ILIKE $${paramCount}`;
  }

  if (urgency_level) {
    paramCount++;
    queryParams.push(urgency_level);
    queryString += ` AND hr.urgency_level = $${paramCount}`;
  }

  if (status) {
    paramCount++;
    queryParams.push(status);
    queryString += ` AND hr.status = $${paramCount}`;
  }

  queryString += ` ORDER BY 
    CASE 
      WHEN hr.urgency_level = 'urgent' THEN 1
      WHEN hr.urgency_level = 'medium' THEN 2
      WHEN hr.urgency_level = 'low' THEN 3
    END,
    hr.created_at DESC
  )`;

  try {
    if (all === "true") {
      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_requests) as total_count,
          1 as total_pages,
          (SELECT COUNT(*) FROM filtered_requests) as items_per_page,
          0 as offset,
          1 as current_page,
          (
            SELECT json_agg(fr.*)
            FROM filtered_requests fr
          ) as help_requests
      `;
    } else {
      const offset = (page - 1) * limit;
      queryParams.push(limit, offset);

      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_requests) as total_count,
          CEIL((SELECT COUNT(*) FROM filtered_requests)::float / $${
            paramCount + 1
          }) as total_pages,
          $${paramCount + 1}::integer as items_per_page,
          $${paramCount + 2}::integer as offset,
          ${page}::integer as current_page,
          (
            SELECT json_agg(fr.*)
            FROM (
              SELECT *
              FROM filtered_requests
              LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            ) fr
          ) as help_requests
      `;
    }

    const result = await pool.query(queryString, queryParams);
    const response = {
      pagination: {
        total_items: Number(result.rows[0].total_count),
        total_pages: Number(result.rows[0].total_pages),
        current_page: Number(result.rows[0].current_page),
        items_per_page: Number(result.rows[0].items_per_page),
        has_next:
          Number(result.rows[0].current_page) <
          Number(result.rows[0].total_pages),
        has_previous: Number(result.rows[0].current_page) > 1,
      },
      help_requests: result.rows[0].help_requests || [],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching help requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getHelpRequests;
