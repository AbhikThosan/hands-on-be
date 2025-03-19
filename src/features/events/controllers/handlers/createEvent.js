const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const createEvent = async (req, res) => {
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

module.exports = createEvent;
