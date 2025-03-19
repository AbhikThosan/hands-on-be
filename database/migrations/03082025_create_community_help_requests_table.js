const pool = require("../../src/config/db");

const createCommunityHelpRequestsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS community_help_requests (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('low', 'medium', 'urgent')),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_by_role VARCHAR(50) NOT NULL,
      helper_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create a function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create a trigger to automatically update updated_at
    CREATE TRIGGER update_community_help_requests_updated_at
      BEFORE UPDATE ON community_help_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(query);
    console.log("✅ Community help requests table created successfully!");
  } catch (err) {
    console.error("❌ Error creating community help requests table:", err);
  } finally {
    pool.end();
  }
};

createCommunityHelpRequestsTable();
