require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const pool = require("./config/db");
const authRoutes = require("./features/auth/routes/authRoutes");
const eventRoutes = require("./features/events/routes/eventRoutes");
const communityHelpRoutes = require("./features/community-help/routes/communityHelpRoutes");
const teamRoutes = require("./features/teams/routes/teamRoutes");
const { getUserTeams } = require("./features/teams/controllers/teamController");
const authMiddleware = require("./middleware/authMiddleware");

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
app.use("/api/events", eventRoutes);
app.use("/api/community-help", communityHelpRoutes);
app.use("/api/teams", teamRoutes);

app.get("/api/user/teams", [authMiddleware], getUserTeams);

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
