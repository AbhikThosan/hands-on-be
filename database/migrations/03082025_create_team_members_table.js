const pool = require("../../src/db");

const createTeamMembersTable = async () => {
  const query = `
    CREATE TYPE team_member_role AS ENUM ('admin', 'moderator', 'member');
    
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role team_member_role DEFAULT 'member',
      contribution_points INTEGER DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Team members table created successfully!");
  } catch (err) {
    console.error("❌ Error creating team members table:", err);
  } finally {
    pool.end();
  }
};

createTeamMembersTable();
