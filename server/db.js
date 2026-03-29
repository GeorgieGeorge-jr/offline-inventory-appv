const mysql = require("mysql2");
require("dotenv").config();

let dbConfig;

if (process.env.MYSQL_URL) {
  dbConfig = process.env.MYSQL_URL;
} else {
  dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rims_live",
    port: Number(process.env.DB_PORT || 3306),
  };
}

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("MySQL Connected");
});

module.exports = db;