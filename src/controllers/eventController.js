const pool = require("../db");
const { validationResult } = require("express-validator");

// Event Creation Handler
const createEvent = async (req, res) => {
  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, date, time, location, category } = req.body;

  try {
    const newEvent = await pool.query(
      `INSERT INTO events (title, description, date, time, location, category, created_by, created_by_role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, title, description, date, time, location, category, created_by, created_by_role, created_at`,
      [
        title,
        description,
        date,
        time,
        location,
        category,
        req.user.id,
        req.user.role,
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent.rows[0],
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Event Listing Handler with Filters and Pagination
const getEvents = async (req, res) => {
  const {
    category,
    location,
    date,
    page = 1,
    limit = 10,
    all = false,
  } = req.query;

  // Build the base query
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

  // Add filters if provided
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
      // If all=true, return all events without pagination
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
      // Add pagination
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

// Get a single event by ID
const getSingleEvent = async (req, res) => {
  try {
    const { event_id } = req.params;
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [
      event_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join Event Handler
const joinEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Check if event exists
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [
      eventId,
    ]);

    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is already registered
    if (event.rows[0].attendees.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    // Add user to the attendees list
    const updatedEvent = await pool.query(
      `UPDATE events 
       SET attendees = array_append(attendees, $1) 
       WHERE id = $2 
       RETURNING *, 
         (SELECT json_agg(json_build_object('id', u.id, 'name', u.name))
          FROM users u
          WHERE u.id = ANY(attendees)) as attendees_details`,
      [userId, eventId]
    );

    res.json({
      message: "Successfully joined the event",
      event: updatedEvent.rows[0],
    });
  } catch (error) {
    console.error("Error joining event:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createEvent, getEvents, getSingleEvent, joinEvent };
