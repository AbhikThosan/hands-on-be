const pool = require("../../../../config/db");

const joinEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [
      eventId,
    ]);

    if (event.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.rows[0].attendees.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

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

module.exports = joinEvent;
