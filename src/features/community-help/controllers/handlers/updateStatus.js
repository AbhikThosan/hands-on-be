const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    const helpRequest = await pool.query(
      "SELECT created_by FROM community_help_requests WHERE id = $1",
      [id]
    );

    if (helpRequest.rows.length === 0) {
      return res.status(404).json({ message: "Help request not found" });
    }

    if (helpRequest.rows[0].created_by !== req.user.id) {
      return res.status(403).json({
        message: "Only the creator can update the status of the help request",
      });
    }

    const updatedRequest = await pool.query(
      "UPDATE community_help_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    res.json({
      message: "Status updated successfully",
      help_request: updatedRequest.rows[0],
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = updateStatus;
