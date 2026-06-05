const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const userRoutes = require("./routes/users");
const activityRoutes = require("./routes/activity");
const syncRoutes = require("./routes/sync");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { protect, requireAdmin } = require("./middleware/authMiddleware");

const app = express();
//
const db = require("./db");

app.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
});
//
app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*"
      ? true
      : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(limiter);

app.get("/health", async (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRoutes);
app.use("/products", protect, productRoutes);
app.use("/sales", protect, salesRoutes);
app.use("/users", protect, requireAdmin, userRoutes);
app.use("/activity", protect, activityRoutes);
app.use("/sync", protect, syncRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RIMS backend running",
  });
});

app.use(notFound);
app.use(errorHandler);

(async () => {
  try {
    const result = await db.query("SELECT NOW()");
    console.log("Database connected:", result.rows[0]);
  } catch (err) {
    console.error("DATABASE CONNECTION FAILED");
    console.error(err);
  }
})();

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${env.PORT}`);
});
console.log("API_BASE_URL =", process.env.API_BASE_URL);