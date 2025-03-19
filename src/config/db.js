require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Database connection error", err);
});

module.exports = pool;
