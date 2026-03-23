const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const salesRoutes = require("./routes/sales");
const userRoutes = require("./routes/users");
const activityRoutes = require("./routes/activity");
const syncRoutes = require("./routes/sync");

const app = express();

app.use("/sync", syncRoutes);
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/sales", salesRoutes);
app.use("/users", userRoutes);
app.use("/activity", activityRoutes);

app.get("/", (req, res) => {
  res.status(200).send("RIMS backend running");
});

const PORT = 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});