const pool = require("../../../../config/db");

const getHelpRequestById = async (req, res) => {
  try {
    const { help_request_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM community_help_requests WHERE id = $1",
      [help_request_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Help request not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching help request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getHelpRequestById;
