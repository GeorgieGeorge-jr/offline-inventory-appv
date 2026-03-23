const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/pull", (req, res) => {
  db.query(
    `SELECT
      id,
      product_code,
      name,
      category,
      quantity,
      min_stock_level,
      unit_price,
      barcode,
      description,
      created_at,
      updated_at
    FROM products
    ORDER BY updated_at DESC, id DESC`,
    (err, products) => {
      if (err) {
        return res.status(500).json({ message: "Failed to pull sync data", error: err });
      }

      res.json({ products });
    }
  );
});

module.exports = router;