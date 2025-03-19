const pool = require("../../../../config/db");

const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await pool.query(
      `
      SELECT 
        ti.*,
        t.name as team_name,
        t.description as team_description,
        t.member_count,
        u.name as invited_by_name
      FROM team_invitations ti
      JOIN teams t ON ti.team_id = t.id
      JOIN users u ON ti.invited_by = u.id
      WHERE ti.invited_user = $1 AND ti.status = 'pending'
      ORDER BY ti.created_at DESC
    `,
      [req.user.id]
    );

    res.json({
      message: "Pending team invitations",
      invitations: invitations.rows,
    });
  } catch (error) {
    console.error("Error fetching pending invitations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getPendingInvitations;
