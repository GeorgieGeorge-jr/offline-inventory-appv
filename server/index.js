const express = require("express");
const cors = require("cors");
const db = require("./db");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).send("RIMS backend running");
});

const PORT = 5001;

app.listen(5001, "0.0.0.0", () => {
  console.log(`Server running on http://127.0.0.1:${5001}`);
});

