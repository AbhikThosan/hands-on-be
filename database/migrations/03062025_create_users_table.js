const pool = require("../../src/config/db");

const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      skills TEXT[],
      causes_supported TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      volunteer_hours INTEGER DEFAULT 0,
      volunteer_history JSONB DEFAULT '[]',
      total_contributions JSONB DEFAULT '{}',
      role VARCHAR(50) NOT NULL DEFAULT 'volunteer'
    );
  `;

  try {
    await pool.query(query);
    console.log("✅ Users table created successfully!");
  } catch (err) {
    console.error("❌ Error creating users table:", err);
  } finally {
    pool.end();
  }
};

createUsersTable();
