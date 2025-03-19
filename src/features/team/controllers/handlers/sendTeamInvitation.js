const pool = require("../../../../config/db");

const sendTeamInvitation = async (req, res) => {
  const { team_id } = req.params;
  const { user_email } = req.body;

  try {
    const memberRole = await pool.query(
      "SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2",
      [team_id, req.user.id]
    );

    if (
      !memberRole.rows[0] ||
      !["admin", "moderator"].includes(memberRole.rows[0].role)
    ) {
      return res.status(403).json({
        message: "Only team admins and moderators can send invitations",
      });
    }

    const user = await pool.query("SELECT id FROM users WHERE email = $1", [
      user_email,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingMember = await pool.query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
      [team_id, user.rows[0].id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: "User is already a team member" });
    }

    const existingInvitation = await pool.query(
      "SELECT 1 FROM team_invitations WHERE team_id = $1 AND invited_user = $2 AND status = 'pending'",
      [team_id, user.rows[0].id]
    );

    if (existingInvitation.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already has a pending invitation" });
    }

    await pool.query(
      "INSERT INTO team_invitations (team_id, invited_by, invited_user) VALUES ($1, $2, $3)",
      [team_id, req.user.id, user.rows[0].id]
    );

    res.json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error sending team invitation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = sendTeamInvitation;
