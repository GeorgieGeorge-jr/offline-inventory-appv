const mysql = require("mysql2");
require("dotenv").config();

let db;

if (process.env.MYSQL_URL) {
  db = mysql.createConnection(process.env.MYSQL_URL);
} else {
  db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rims_live",
    port: Number(process.env.DB_PORT || 3306),
  });
}

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("MySQL Connected");
});

module.exports = db;