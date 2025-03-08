const pool = require("../db");
const { validationResult } = require("express-validator");

// Create a new team
const createTeam = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, is_private = false, avatar_url } = req.body;

  try {
    await pool.query("BEGIN");

    // Create the team
    const newTeam = await pool.query(
      `INSERT INTO teams 
        (name, description, is_private, created_by, created_by_role, avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, is_private, req.user.id, req.user.role, avatar_url]
    );

    // Add creator as team admin
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) 
       VALUES ($1, $2, 'admin')`,
      [newTeam.rows[0].id, req.user.id]
    );

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all teams (with filters for public/private)
const getTeams = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    sort_by = "achievement_points",
  } = req.query;
  const offset = (page - 1) * limit;

  try {
    let queryString = `
      WITH team_data AS (
        SELECT 
          t.*,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', tm.user_id,
              'role', tm.role,
              'joined_at', tm.joined_at,
              'name', u.name
            )
          ) FILTER (WHERE tm.user_id IS NOT NULL) as members,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', te.event_id,
              'points', te.points_awarded
            )
          ) FILTER (WHERE te.event_id IS NOT NULL) as events,
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ta.id,
              'title', ta.title,
              'points', ta.points
            )
          ) FILTER (WHERE ta.id IS NOT NULL) as achievements
        FROM teams t
        LEFT JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN users u ON tm.user_id = u.id
        LEFT JOIN team_events te ON t.id = te.team_id
        LEFT JOIN team_achievements ta ON t.id = ta.team_id
        WHERE (NOT t.is_private OR t.created_by = $1)
    `;

    const queryParams = [req.user?.id || 0];

    if (search) {
      queryString += ` AND t.name ILIKE $2`;
      queryParams.push(`%${search}%`);
    }

    queryString += `
        GROUP BY t.id
        ORDER BY 
          CASE WHEN $${
            queryParams.length + 1
          } = 'achievement_points' THEN t.achievement_points END DESC,
          CASE WHEN $${
            queryParams.length + 1
          } = 'member_count' THEN t.member_count END DESC,
          CASE WHEN $${
            queryParams.length + 1
          } = 'created_at' THEN t.created_at END DESC
        LIMIT $${queryParams.length + 2} 
        OFFSET $${queryParams.length + 3}
      )
      SELECT 
        (SELECT COUNT(*) FROM teams WHERE NOT is_private OR created_by = $1) as total_count,
        COALESCE(json_agg(
          json_build_object(
            'id', td.id,
            'name', td.name,
            'description', td.description,
            'is_private', td.is_private,
            'created_by', td.created_by,
            'member_count', td.member_count,
            'achievement_points', td.achievement_points,
            'avatar_url', td.avatar_url,
            'created_at', td.created_at,
            'members', td.members,
            'events', td.events,
            'achievements', td.achievements
          )
        ), '[]') as teams
      FROM team_data td;
    `;

    queryParams.push(sort_by, limit, offset);

    const result = await pool.query(queryString, queryParams);

    const response = {
      pagination: {
        total_items: Number(result.rows[0].total_count),
        total_pages: Math.ceil(Number(result.rows[0].total_count) / limit),
        current_page: Number(page),
        items_per_page: Number(limit),
      },
      teams: result.rows[0].teams || [],
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Join a team
const joinTeam = async (req, res) => {
  const { team_id } = req.params;

  try {
    // Check if team exists and is public
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

    // Check if user is already a member
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

    // Add user as team member
    await pool.query(
      "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
      [team_id, req.user.id]
    );

    // Update member count
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

// Get team leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.achievement_points,
        t.member_count,
        t.avatar_url,
        json_agg(
          DISTINCT jsonb_build_object(
            'title', ta.title,
            'points', ta.points,
            'achieved_at', ta.achieved_at
          )
        ) as recent_achievements
      FROM teams t
      LEFT JOIN team_achievements ta ON t.id = ta.team_id
      WHERE NOT t.is_private
      GROUP BY t.id
      ORDER BY t.achievement_points DESC
      LIMIT 10
    `);

    res.json({
      message: "Team leaderboard",
      leaderboard: leaderboard.rows,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get team dashboard
const getTeamDashboard = async (req, res) => {
  const { team_id } = req.params;

  try {
    // Check if team exists and user has access
    const team = await pool.query(
      `
      SELECT t.*, 
        (SELECT tm.role FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $1) as user_role
      FROM teams t 
      WHERE t.id = $2 AND (
        NOT t.is_private OR 
        t.created_by = $1 OR 
        EXISTS (SELECT 1 FROM team_members WHERE team_id = t.id AND user_id = $1)
      )
    `,
      [req.user.id, team_id]
    );

    if (team.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Team not found or access denied" });
    }

    // Get team details with members, events, and achievements
    const dashboard = await pool.query(
      `
      WITH member_data AS (
        SELECT 
          tm.team_id,
          json_agg(
            json_build_object(
              'id', tm.user_id,
              'role', tm.role,
              'joined_at', tm.joined_at,
              'name', u.name,
              'contribution_points', tm.contribution_points
            )
          ) as members
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = $1
        GROUP BY tm.team_id
      ),
      event_data AS (
        SELECT 
          te.team_id,
          json_agg(
            json_build_object(
              'id', e.id,
              'title', e.title,
              'date', e.date,
              'points_awarded', te.points_awarded
            ) ORDER BY e.date DESC
          ) as recent_events
        FROM team_events te
        JOIN events e ON te.event_id = e.id
        WHERE te.team_id = $1
        GROUP BY te.team_id
      ),
      achievement_data AS (
        SELECT 
          team_id,
          json_agg(
            json_build_object(
              'id', id,
              'title', title,
              'points', points,
              'achieved_at', achieved_at
            ) ORDER BY achieved_at DESC
          ) as recent_achievements
        FROM team_achievements
        WHERE team_id = $1
        GROUP BY team_id
      )
      SELECT 
        t.*,
        COALESCE(md.members, '[]'::json) as members,
        COALESCE(ed.recent_events, '[]'::json) as recent_events,
        COALESCE(ad.recent_achievements, '[]'::json) as recent_achievements
      FROM teams t
      LEFT JOIN member_data md ON t.id = md.team_id
      LEFT JOIN event_data ed ON t.id = ed.team_id
      LEFT JOIN achievement_data ad ON t.id = ad.team_id
      WHERE t.id = $1
    `,
      [team_id]
    );

    res.json({
      message: "Team dashboard",
      dashboard: {
        ...dashboard.rows[0],
        user_role: team.rows[0].user_role,
      },
    });
  } catch (error) {
    console.error("Error fetching team dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send team invitation
const sendTeamInvitation = async (req, res) => {
  const { team_id } = req.params;
  const { user_email } = req.body;

  try {
    // Check if sender is team admin or moderator
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

    // Get user by email
    const user = await pool.query("SELECT id FROM users WHERE email = $1", [
      user_email,
    ]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    const existingMember = await pool.query(
      "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
      [team_id, user.rows[0].id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ message: "User is already a team member" });
    }

    // Check for existing pending invitation
    const existingInvitation = await pool.query(
      "SELECT 1 FROM team_invitations WHERE team_id = $1 AND invited_user = $2 AND status = 'pending'",
      [team_id, user.rows[0].id]
    );

    if (existingInvitation.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already has a pending invitation" });
    }

    // Create invitation
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

// Respond to team invitation
const respondToInvitation = async (req, res) => {
  const { invitation_id } = req.params;
  const { accept } = req.body;

  try {
    await pool.query("BEGIN");

    // Get invitation details
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
      // Add user as team member
      await pool.query(
        "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)",
        [invitation.rows[0].team_id, req.user.id]
      );

      // Update team member count
      await pool.query(
        "UPDATE teams SET member_count = member_count + 1 WHERE id = $1",
        [invitation.rows[0].team_id]
      );
    }

    // Update invitation status
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

// Get user's team memberships
const getUserTeams = async (req, res) => {
  try {
    const teams = await pool.query(
      `
      SELECT 
        t.*,
        tm.role as member_role,
        tm.joined_at,
        tm.contribution_points,
        (
          SELECT COUNT(*) 
          FROM team_events te 
          WHERE te.team_id = t.id
        ) as total_events
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at DESC
    `,
      [req.user.id]
    );

    res.json({
      message: "User's team memberships",
      teams: teams.rows,
    });
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's pending invitations
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

// Get user's created teams
const getMyCreatedTeams = async (req, res) => {
  const { is_private } = req.query;

  try {
    let queryString = `
      SELECT 
        t.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', tm.user_id,
            'role', tm.role,
            'joined_at', tm.joined_at,
            'name', u.name
          )
        ) FILTER (WHERE tm.user_id IS NOT NULL) as members,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', te.event_id,
            'title', e.title,
            'date', e.date,
            'points_awarded', te.points_awarded
          )
        ) FILTER (WHERE te.event_id IS NOT NULL) as events,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ta.id,
            'title', ta.title,
            'points', ta.points,
            'achieved_at', ta.achieved_at
          )
        ) FILTER (WHERE ta.id IS NOT NULL) as achievements
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      LEFT JOIN team_events te ON t.id = te.team_id
      LEFT JOIN events e ON te.event_id = e.id
      LEFT JOIN team_achievements ta ON t.id = ta.team_id
      WHERE t.created_by = $1
    `;

    const queryParams = [req.user.id];

    if (is_private !== undefined) {
      queryString += ` AND t.is_private = $2`;
      queryParams.push(is_private === "true");
    }

    queryString += ` GROUP BY t.id ORDER BY t.created_at DESC`;

    const result = await pool.query(queryString, queryParams);

    res.json({
      message: "Your created teams",
      teams: result.rows,
    });
  } catch (error) {
    console.error("Error fetching created teams:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  joinTeam,
  getLeaderboard,
  getTeamDashboard,
  sendTeamInvitation,
  respondToInvitation,
  getUserTeams,
  getPendingInvitations,
  getMyCreatedTeams,
};
