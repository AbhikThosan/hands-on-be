const pool = require("../db");

const createEventsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      time TIMESTAMP NOT NULL,
      location VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_by_role VARCHAR(50) NOT NULL,
      attendees INTEGER[] DEFAULT '{}'::INTEGER[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Events table created successfully!");
  } catch (err) {
    console.error("❌ Error creating events table:", err);
  } finally {
    pool.end();
  }
};

createEventsTable();
