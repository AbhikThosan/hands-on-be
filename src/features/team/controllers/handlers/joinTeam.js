const pool = require("../../../../config/db");

const joinTeam = async (req, res) => {
  const { team_id } = req.params;

  try {
    const team = await pool.query("SELECT * FROM teams WHERE id = $1", [
      team_id,
    ]);

    if (team.rows.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.rows[0].is_private) {
      return res.status(403).json({
        message: "This is a private team. You need an invitation to join.",
      });
    }

    const existingMember = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
      [team_id, req.user.id]
    );

    if (existingMember.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "You are already a member of this team" });
    }

    await pool.query("BEGIN");

    await pool.query(
      "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
      [team_id, req.user.id]
    );

    await pool.query(
      "UPDATE teams SET member_count = member_count + 1 WHERE id = $1",
      [team_id]
    );

    await pool.query("COMMIT");

    res.json({ message: "Successfully joined the team" });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error joining team:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = joinTeam;
