const pool = require("../db");

const createTeamEventsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS team_events (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      points_awarded INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, event_id)
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Team events table created successfully!");
  } catch (err) {
    console.error("❌ Error creating team events table:", err);
  } finally {
    pool.end();
  }
};

createTeamEventsTable();
