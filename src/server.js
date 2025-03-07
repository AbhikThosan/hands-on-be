require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const communityHelpRoutes = require("./routes/communityHelpRoutes");
const pool = require("./db");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", eventRoutes);
app.use("/api", communityHelpRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database connected!", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
