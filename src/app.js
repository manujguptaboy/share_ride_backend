const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/authRoutes");
const placeRouter = require("./routes/placeRoutes");
const otpRouter = require("./routes/otpRoutes");
const mapRouter = require("./routes/mapRoutes");
const aadhaarRouter = require("./routes/aadhaarRoutes");
const pool = require("./config/db");

const app = express();

app.use((req, res, next) => {
  const start = Date.now();

  console.log(`[REQ] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[RES] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "share_ride backend is running",
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    console.log("[DB] Health check successful");
    return res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    console.error("[DB] Health check failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/places", placeRouter);
app.use("/api/otp", otpRouter);
app.use("/api/maps", mapRouter);
app.use("/api/aadhaar", aadhaarRouter);

module.exports = app;

// When started directly (e.g. Render: `node src/app.js`), bind and listen.
// When imported (e.g. tests), only export the app.
if (require.main === module) {
  const env = require("./config/env");
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Server running on port ${env.port}`);
  });
}
