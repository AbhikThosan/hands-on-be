const pool = require("../../src/db");

const createTeamInvitationsTable = async () => {
  const query = `
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');
    
    CREATE TABLE IF NOT EXISTS team_invitations (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      invited_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      invited_user INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status invitation_status DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, invited_user)
    );

    CREATE TRIGGER update_team_invitations_updated_at
      BEFORE UPDATE ON team_invitations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(query);
    console.log("✅ Team invitations table created successfully!");
  } catch (err) {
    console.error("❌ Error creating team invitations table:", err);
  } finally {
    pool.end();
  }
};

createTeamInvitationsTable();
