const pool = require("../../../../config/db");

const respondToInvitation = async (req, res) => {
  const { invitation_id } = req.params;
  const { accept } = req.body;

  try {
    await pool.query("BEGIN");

    const invitation = await pool.query(
      "SELECT * FROM team_invitations WHERE id = $1 AND invited_user = $2 AND status = 'pending'",
      [invitation_id, req.user.id]
    );

    if (invitation.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Invitation not found or already processed" });
    }

    if (accept) {
      await pool.query(
        "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
        [invitation.rows[0].team_id, req.user.id]
      );

      await pool.query(
        "UPDATE teams SET member_count = member_count + 1 WHERE id = $1",
        [invitation.rows[0].team_id]
      );
    }

    await pool.query("UPDATE team_invitations SET status = $1 WHERE id = $2", [
      accept ? "accepted" : "declined",
      invitation_id,
    ]);

    await pool.query("COMMIT");

    res.json({
      message: accept
        ? "Invitation accepted successfully"
        : "Invitation declined successfully",
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error processing invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = respondToInvitation;
