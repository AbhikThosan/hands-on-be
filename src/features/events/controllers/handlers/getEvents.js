const pool = require("../../../../config/db");

const getEvents = async (req, res) => {
  const {
    category,
    location,
    date,
    page = 1,
    limit = 10,
    all = false,
  } = req.query;

  let queryString = `
    WITH filtered_events AS (
      SELECT 
        e.*,
        u.name as creator_name,
        (SELECT json_agg(json_build_object('id', u2.id, 'name', u2.name))
         FROM users u2
         WHERE u2.id = ANY(e.attendees)) as attendees_details
      FROM events e
      JOIN users u ON e.created_by = u.id
      WHERE date >= CURRENT_DATE
  `;

  const queryParams = [];
  let paramCount = 0;

  if (category) {
    paramCount++;
    queryParams.push(category);
    queryString += ` AND category = $${paramCount}`;
  }

  if (location) {
    paramCount++;
    queryParams.push(`%${location}%`);
    queryString += ` AND location ILIKE $${paramCount}`;
  }

  if (date) {
    paramCount++;
    queryParams.push(date);
    queryString += ` AND DATE(date) = $${paramCount}`;
  }

  queryString += ` ORDER BY date ASC)`;

  try {
    if (all === "true") {
      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_events) as total_count,
          1 as total_pages,
          (SELECT COUNT(*) FROM filtered_events) as items_per_page,
          0 as offset,
          1 as current_page,
          (
            SELECT json_agg(fe.*)
            FROM filtered_events fe
          ) as events
      `;
    } else {
      const offset = (page - 1) * limit;
      queryParams.push(limit, offset);

      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_events) as total_count,
          CEIL((SELECT COUNT(*) FROM filtered_events)::float / $${
            paramCount + 1
          }) as total_pages,
          $${paramCount + 1}::integer as items_per_page,
          $${paramCount + 2}::integer as offset,
          ${page}::integer as current_page,
          (
            SELECT json_agg(fe.*)
            FROM (
              SELECT *
              FROM filtered_events
              LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            ) fe
          ) as events
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
      events: result.rows[0].events || [],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getEvents;
