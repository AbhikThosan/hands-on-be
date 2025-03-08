const pool = require("../db");

const createTeamsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_private BOOLEAN DEFAULT false,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_by_role VARCHAR(50) NOT NULL,
      member_count INTEGER DEFAULT 1,
      achievement_points INTEGER DEFAULT 0,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TRIGGER update_teams_updated_at
      BEFORE UPDATE ON teams
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(query);
    console.log("✅ Teams table created successfully!");
  } catch (err) {
    console.error("❌ Error creating teams table:", err);
  } finally {
    pool.end();
  }
};

createTeamsTable();
