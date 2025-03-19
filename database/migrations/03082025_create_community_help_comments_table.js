const pool = require("../../src/config/db");

const createCommunityHelpCommentsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS community_help_comments (
      id SERIAL PRIMARY KEY,
      help_request_id INTEGER REFERENCES community_help_requests(id) ON DELETE CASCADE,
      comment_text TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_by_role VARCHAR(50) NOT NULL,
      is_helper BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create a trigger to automatically update updated_at
    CREATE TRIGGER update_community_help_comments_updated_at
      BEFORE UPDATE ON community_help_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await pool.query(query);
    console.log("✅ Community help comments table created successfully!");
  } catch (err) {
    console.error("❌ Error creating community help comments table:", err);
  } finally {
    pool.end();
  }
};

createCommunityHelpCommentsTable();
