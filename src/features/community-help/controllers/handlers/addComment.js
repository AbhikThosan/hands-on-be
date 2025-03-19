const pool = require("../../../../config/db");
const { validationResult } = require("express-validator");

const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { help_request_id } = req.params;
  const { comment_text, is_helper = false } = req.body;

  try {
    await pool.query("BEGIN");

    const newComment = await pool.query(
      `INSERT INTO community_help_comments 
        (help_request_id, comment_text, created_by, created_by_role, is_helper) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [help_request_id, comment_text, req.user.id, req.user.role, is_helper]
    );

    if (is_helper) {
      await pool.query(
        `UPDATE community_help_requests 
         SET helper_count = helper_count + 1
         WHERE id = $1`,
        [help_request_id]
      );
    }

    await pool.query("COMMIT");

    const user = await pool.query("SELECT name FROM users WHERE id = $1", [
      req.user.id,
    ]);

    const commentWithUser = {
      ...newComment.rows[0],
      commenter_name: user.rows[0].name,
    };

    res.status(201).json({
      message: "Comment added successfully",
      comment: commentWithUser,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = addComment;
