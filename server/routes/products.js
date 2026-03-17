const express = require("express");
const router = express.Router();
const db = require("../db");

const normalizeCode = (value) => String(value || "").trim();

const findProductByCode = (code, callback) => {
  const normalized = normalizeCode(code);

  db.query(
    `
      SELECT *
      FROM products
      WHERE barcode = ? OR product_code = ?
      LIMIT 1
    `,
    [normalized, normalized],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0] || null);
    }
  );
};

// IMPORTANT: keep this BEFORE "/:id"
router.get("/lookup/:code", (req, res) => {
  const code = normalizeCode(req.params.code);

  if (!code) {
    return res.status(400).json({ message: "Scan code is required" });
  }

  findProductByCode(code, (err, product) => {
    if (err) {
      return res.status(500).json({ message: "Failed to look up product", error: err });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found for scanned code" });
    }

    res.json(product);
  });
});

// Get all products
router.get("/", (req, res) => {
  const sql = `
    SELECT 
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
    ORDER BY updated_at DESC, id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch products", error: err });
    res.json(results);
  });
});

// Get single product
router.get("/:id", (req, res) => {
  db.query(
    `SELECT * FROM products WHERE id = ?`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Failed to fetch product", error: err });
      if (!results.length) return res.status(404).json({ message: "Product not found" });
      res.json(results[0]);
    }
  );
});

// Add product
router.post("/", (req, res) => {
  const {
    product_code,
    name,
    category,
    quantity,
    min_stock_level,
    unit_price,
    barcode,
    description,
  } = req.body;

  const cleanedProductCode = normalizeCode(product_code);
  const cleanedBarcode = normalizeCode(barcode);

  if (!cleanedProductCode || !name?.trim()) {
    return res.status(400).json({ message: "product_code and name are required" });
  }

  db.query(
    `
      SELECT id, product_code, barcode
      FROM products
      WHERE product_code = ?
         OR (? <> '' AND barcode = ?)
      LIMIT 1
    `,
    [cleanedProductCode, cleanedBarcode, cleanedBarcode],
    (checkErr, existingRows) => {
      if (checkErr) {
        return res.status(500).json({ message: "Failed to validate product uniqueness", error: checkErr });
      }

      if (existingRows.length) {
        const existing = existingRows[0];

        if (existing.product_code === cleanedProductCode) {
          return res.status(409).json({ message: "A product with this product code already exists" });
        }

        if (cleanedBarcode && existing.barcode === cleanedBarcode) {
          return res.status(409).json({ message: "A product with this barcode already exists" });
        }
      }

      const sql = `
        INSERT INTO products
        (product_code, name, category, quantity, min_stock_level, unit_price, barcode, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          cleanedProductCode,
          name.trim(),
          category || null,
          Number(quantity) || 0,
          Number(min_stock_level) || 0,
          Number(unit_price) || 0,
          cleanedBarcode || null,
          description || null,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: "Failed to add product", error: err });
          }

          db.query(`SELECT * FROM products WHERE id = ?`, [result.insertId], (err2, rows) => {
            if (err2) {
              return res.status(500).json({ message: "Product added but failed to reload", error: err2 });
            }
            res.status(201).json(rows[0]);
          });
        }
      );
    }
  );
});

// Update product
router.put("/:id", (req, res) => {
  const {
    product_code,
    name,
    category,
    quantity,
    min_stock_level,
    unit_price,
    barcode,
    description,
  } = req.body;

  const cleanedProductCode = normalizeCode(product_code);
  const cleanedBarcode = normalizeCode(barcode);
  const productId = Number(req.params.id);

  if (!cleanedProductCode || !name?.trim()) {
    return res.status(400).json({ message: "product_code and name are required" });
  }

  db.query(
    `
      SELECT id, product_code, barcode
      FROM products
      WHERE id <> ?
        AND (
          product_code = ?
          OR (? <> '' AND barcode = ?)
        )
      LIMIT 1
    `,
    [productId, cleanedProductCode, cleanedBarcode, cleanedBarcode],
    (checkErr, existingRows) => {
      if (checkErr) {
        return res.status(500).json({ message: "Failed to validate product uniqueness", error: checkErr });
      }

      if (existingRows.length) {
        const existing = existingRows[0];

        if (existing.product_code === cleanedProductCode) {
          return res.status(409).json({ message: "Another product already uses this product code" });
        }

        if (cleanedBarcode && existing.barcode === cleanedBarcode) {
          return res.status(409).json({ message: "Another product already uses this barcode" });
        }
      }

      const sql = `
        UPDATE products
        SET
          product_code = ?,
          name = ?,
          category = ?,
          quantity = ?,
          min_stock_level = ?,
          unit_price = ?,
          barcode = ?,
          description = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.query(
        sql,
        [
          cleanedProductCode,
          name.trim(),
          category || null,
          Number(quantity) || 0,
          Number(min_stock_level) || 0,
          Number(unit_price) || 0,
          cleanedBarcode || null,
          description || null,
          req.params.id,
        ],
        (err) => {
          if (err) return res.status(500).json({ message: "Failed to update product", error: err });

          db.query(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err2, rows) => {
            if (err2) return res.status(500).json({ message: "Updated but failed to reload", error: err2 });
            if (!rows.length) return res.status(404).json({ message: "Product not found" });
            res.json(rows[0]);
          });
        }
      );
    }
  );
});

// Delete product
router.delete("/:id", (req, res) => {
  db.query(`DELETE FROM products WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to delete product", error: err });
    res.json({ success: true });
  });
});

// Stock movement
router.post("/:id/stock", (req, res) => {
  const { type, quantity, user_id } = req.body;
  const qty = Number(quantity);

  if (!["IN", "OUT"].includes(type)) {
    return res.status(400).json({ message: "type must be IN or OUT" });
  }

  if (!qty || qty <= 0) {
    return res.status(400).json({ message: "quantity must be greater than 0" });
  }

  db.query(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch product", error: err });
    if (!rows.length) return res.status(404).json({ message: "Product not found" });

    const product = rows[0];
    const newQty = type === "IN" ? Number(product.quantity) + qty : Number(product.quantity) - qty;

    if (newQty < 0) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    db.query(
      `UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newQty, req.params.id],
      (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Failed to update stock", error: updateErr });

        db.query(
          `INSERT INTO stock_movements (product_id, user_id, movement_type, quantity, note)
           VALUES (?, ?, ?, ?, ?)`,
          [req.params.id, user_id || null, type, qty, `Manual stock ${type === "IN" ? "in" : "out"}`],
          (logErr) => {
            if (logErr) {
              return res.status(500).json({ message: "Stock updated but failed to log movement", error: logErr });
            }

            db.query(`SELECT * FROM products WHERE id = ?`, [req.params.id], (reloadErr, reloadRows) => {
              if (reloadErr) return res.status(500).json({ message: "Stock updated but failed to reload", error: reloadErr });
              res.json(reloadRows[0]);
            });
          }
        );
      }
    );
  });
});

module.exports = router;