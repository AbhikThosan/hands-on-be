const pool = require("../../../../config/db");

const getCommentsByHelpRequestId = async (req, res) => {
  try {
    const { help_request_id } = req.params;

    const comments = await pool.query(
      `SELECT chc.id, chc.comment_text, chc.created_by, chc.created_by_role, chc.is_helper, chc.created_at, 
              u.name AS commenter_name
       FROM community_help_comments chc
       JOIN users u ON chc.created_by = u.id
       WHERE chc.help_request_id = $1
       ORDER BY chc.created_at DESC`,
      [help_request_id]
    );

    res.json({
      help_request_id,
      comments: comments.rows,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = getCommentsByHelpRequestId;
