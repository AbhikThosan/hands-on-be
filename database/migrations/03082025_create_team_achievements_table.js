const pool = require("../../src/config/db");

const createTeamAchievementsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS team_achievements (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      points INTEGER DEFAULT 0,
      achievement_type VARCHAR(50) NOT NULL,
      achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Team achievements table created successfully!");
  } catch (err) {
    console.error("❌ Error creating team achievements table:", err);
  } finally {
    pool.end();
  }
};

createTeamAchievementsTable();
