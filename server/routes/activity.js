const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/stock-movements", async (req, res, next) => {
  try {
    const { product_id, user_id, movement_type, quantity, note, created_at } = req.body || {};
    const qty = Number(quantity);
    const movementType = String(movement_type || "").trim().toUpperCase();

    if (!product_id || !movementType || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "product_id, movement_type and a positive quantity are required",
      });
    }

    const result = await db.query(
      `
      INSERT INTO stock_movements (
        product_id,
        user_id,
        movement_type,
        quantity,
        note,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP))
      RETURNING *
      `,
      [
        product_id,
        user_id || null,
        movementType,
        qty,
        note || null,
        created_at || null,
      ]
    );

    res.status(201).json({
      success: true,
      movement: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.get("/recent-stock", async (req, res) => {
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

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch activity",
      error: err,
    });
  }
});

module.exports = router;
