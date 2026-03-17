const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/recent-stock", (req, res) => {
  const sql = `
    SELECT
      sm.id,
      sm.movement_type,
      sm.quantity,
      sm.note,
      sm.created_at,
      p.id AS product_id,
      p.name AS product_name,
      p.product_code,
      u.id AS user_id,
      u.full_name,
      u.username
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    LEFT JOIN users u ON u.id = sm.user_id
    ORDER BY sm.created_at DESC
    LIMIT 8
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch activity", error: err });
    res.json(rows);
  });
});

module.exports = router;