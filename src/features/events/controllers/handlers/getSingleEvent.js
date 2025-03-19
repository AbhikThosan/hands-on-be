const pool = require("../../../../config/db");

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

module.exports = getSingleEvent;
