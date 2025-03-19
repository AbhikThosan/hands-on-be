const pool = require("../db");
const { validationResult } = require("express-validator");

// Create a new help request
const createHelpRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, location, category, urgency_level } = req.body;

  try {
    const newRequest = await pool.query(
      `INSERT INTO community_help_requests 
        (title, description, location, category, urgency_level, created_by, created_by_role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        title,
        description,
        location,
        category,
        urgency_level,
        req.user.id,
        req.user.role,
      ]
    );

    res.status(201).json({
      message: "Help request created successfully",
      help_request: newRequest.rows[0],
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all help requests with filters and pagination
const getHelpRequests = async (req, res) => {
  const {
    category,
    location,
    urgency_level,
    status,
    page = 1,
    limit = 10,
    all = false,
  } = req.query;

  // Build the base query
  let queryString = `
    WITH comments_agg AS (
      SELECT 
        help_request_id,
        json_agg(
          json_build_object(
            'id', id,
            'comment_text', comment_text,
            'created_by', created_by,
            'created_by_role', created_by_role,
            'is_helper', is_helper,
            'created_at', created_at,
            'commenter_name', (SELECT name FROM users WHERE id = created_by)
          ) ORDER BY created_at DESC
        ) as comments
      FROM community_help_comments
      GROUP BY help_request_id
    ),
    filtered_requests AS (
      SELECT 
        hr.*,
        u.name as creator_name,
        COALESCE(c.comments, '[]'::json) as comments
      FROM community_help_requests hr
      JOIN users u ON hr.created_by = u.id
      LEFT JOIN comments_agg c ON c.help_request_id = hr.id
      WHERE 1=1
  `;

  const queryParams = [];
  let paramCount = 0;

  // Add filters if provided
  if (category) {
    paramCount++;
    queryParams.push(category);
    queryString += ` AND hr.category = $${paramCount}`;
  }

  if (location) {
    paramCount++;
    queryParams.push(`%${location}%`);
    queryString += ` AND hr.location ILIKE $${paramCount}`;
  }

  if (urgency_level) {
    paramCount++;
    queryParams.push(urgency_level);
    queryString += ` AND hr.urgency_level = $${paramCount}`;
  }

  if (status) {
    paramCount++;
    queryParams.push(status);
    queryString += ` AND hr.status = $${paramCount}`;
  }

  queryString += ` ORDER BY 
    CASE 
      WHEN hr.urgency_level = 'urgent' THEN 1
      WHEN hr.urgency_level = 'medium' THEN 2
      WHEN hr.urgency_level = 'low' THEN 3
    END,
    hr.created_at DESC
  )`;

  try {
    if (all === "true") {
      // If all=true, return all requests without pagination
      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_requests) as total_count,
          1 as total_pages,
          (SELECT COUNT(*) FROM filtered_requests) as items_per_page,
          0 as offset,
          1 as current_page,
          (
            SELECT json_agg(fr.*)
            FROM filtered_requests fr
          ) as help_requests
      `;
    } else {
      // Add pagination
      const offset = (page - 1) * limit;
      queryParams.push(limit, offset);

      queryString += `
        SELECT 
          (SELECT COUNT(*) FROM filtered_requests) as total_count,
          CEIL((SELECT COUNT(*) FROM filtered_requests)::float / $${
            paramCount + 1
          }) as total_pages,
          $${paramCount + 1}::integer as items_per_page,
          $${paramCount + 2}::integer as offset,
          ${page}::integer as current_page,
          (
            SELECT json_agg(fr.*)
            FROM (
              SELECT *
              FROM filtered_requests
              LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            ) fr
          ) as help_requests
      `;
    }

    const result = await pool.query(queryString, queryParams);
    const response = {
      pagination: {
        total_items: Number(result.rows[0].total_count),
        total_pages: Number(result.rows[0].total_pages),
        current_page: Number(result.rows[0].current_page),
        items_per_page: Number(result.rows[0].items_per_page),
        has_next:
          Number(result.rows[0].current_page) <
          Number(result.rows[0].total_pages),
        has_previous: Number(result.rows[0].current_page) > 1,
      },
      help_requests: result.rows[0].help_requests || [],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching help requests:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single help request by ID
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

// Add a comment to a help request
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { help_request_id } = req.params;
  const { comment_text, is_helper = false } = req.body;

  try {
    // Start a transaction
    await pool.query("BEGIN");

    // Add the comment
    const newComment = await pool.query(
      `INSERT INTO community_help_comments 
        (help_request_id, comment_text, created_by, created_by_role, is_helper) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [help_request_id, comment_text, req.user.id, req.user.role, is_helper]
    );

    // If this is a helper comment, update only the helper_count
    if (is_helper) {
      await pool.query(
        `UPDATE community_help_requests 
         SET helper_count = helper_count + 1
         WHERE id = $1`,
        [help_request_id]
      );
    }

    // Commit the transaction
    await pool.query("COMMIT");

    // Get the commenter's name
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

// Get all comments for a specific help request
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

// Update help request status
const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  try {
    // Check if the user is the creator of the help request
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

module.exports = {
  createHelpRequest,
  getHelpRequests,
  getHelpRequestById,
  addComment,
  getCommentsByHelpRequestId,
  updateStatus,
};
