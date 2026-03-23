const express = require("express");
const router = express.Router();
const db = require("../db");

// Create a sale
router.post("/", (req, res) => {
  const { staff_user_id, items } = req.body || {};

  if (!staff_user_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "staff_user_id and items are required" });
  }

  const productIds = items.map((item) => item.product_id);

  db.query(
    `SELECT * FROM products WHERE id IN (?)`,
    [productIds],
    (err, products) => {
      if (err) {
        return res.status(500).json({ message: "Failed to fetch products", error: err });
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      let totalAmount = 0;

      for (const item of items) {
        const product = productMap.get(item.product_id);
        const qty = Number(item.quantity);

        if (!product) {
          return res.status(400).json({ message: `Product ${item.product_id} not found` });
        }

        if (!qty || qty <= 0) {
          return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
        }

        if (Number(product.quantity) < qty) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }

        totalAmount += Number(product.unit_price) * qty;
      }

      db.beginTransaction((txErr) => {
        if (txErr) {
          return res.status(500).json({ message: "Transaction start failed", error: txErr });
        }

        db.query(
          `INSERT INTO sales (staff_user_id, total_amount) VALUES (?, ?)`,
          [staff_user_id, totalAmount],
          (saleErr, saleResult) => {
            if (saleErr) {
              return db.rollback(() => {
                res.status(500).json({ message: "Failed to create sale", error: saleErr });
              });
            }

            const saleId = saleResult.insertId;
            let completed = 0;

            for (const item of items) {
              const product = productMap.get(item.product_id);
              const qty = Number(item.quantity);
              const unitPrice = Number(product.unit_price);
              const subtotal = unitPrice * qty;

              db.query(
                `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
                 VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, qty, unitPrice, subtotal],
                (itemErr) => {
                  if (itemErr) {
                    return db.rollback(() => {
                      res.status(500).json({ message: "Failed to create sale item", error: itemErr });
                    });
                  }

                  db.query(
                    `UPDATE products
                     SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [qty, item.product_id],
                    (updateErr) => {
                      if (updateErr) {
                        return db.rollback(() => {
                          res.status(500).json({ message: "Failed to reduce stock", error: updateErr });
                        });
                      }

                      db.query(
                        `INSERT INTO stock_movements (product_id, user_id, movement_type, quantity, note)
                         VALUES (?, ?, 'SALE', ?, ?)`,
                        [item.product_id, staff_user_id, qty, `Sold through sales terminal`],
                        (logErr) => {
                          if (logErr) {
                            return db.rollback(() => {
                              res.status(500).json({ message: "Failed to log stock movement", error: logErr });
                            });
                          }

                          completed += 1;

                          if (completed === items.length) {
                            db.commit((commitErr) => {
                              if (commitErr) {
                                return db.rollback(() => {
                                  res.status(500).json({ message: "Commit failed", error: commitErr });
                                });
                              }

                              res.status(201).json({
                                success: true,
                                sale_id: saleId,
                                total_amount: totalAmount,
                              });
                            });
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          }
        );
      });
    }
  );
});

// Reports summary
router.get("/reports/summary", (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM products) AS total_products,
      (SELECT IFNULL(SUM(quantity * unit_price), 0) FROM products) AS total_inventory_value,
      (SELECT COUNT(*) FROM products WHERE quantity <= min_stock_level) AS low_stock_count,
      (SELECT COUNT(*) FROM products WHERE quantity = 0) AS out_of_stock_count
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to load summary", error: err });
    }
    res.json(rows[0]);
  });
});

// Sold-out log with who sold
router.get("/reports/stockouts", (req, res) => {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.product_code,
      p.quantity AS current_quantity,
      s.id AS sale_id,
      s.created_at AS sold_at,
      u.id AS staff_user_id,
      u.full_name,
      u.username,
      si.quantity AS sold_quantity
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN users u ON u.id = s.staff_user_id
    JOIN products p ON p.id = si.product_id
    WHERE p.quantity = 0
    ORDER BY s.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to load stockout report", error: err });
    }
    res.json(rows);
  });
});

// Top sold products today
router.get("/reports/top-sold-today", (req, res) => {
  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.product_code,
      SUM(si.quantity) AS total_sold
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE DATE(s.created_at) = CURDATE()
    GROUP BY p.id, p.name, p.product_code
    ORDER BY total_sold DESC
    LIMIT 5
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to load top sold report", error: err });
    }
    res.json(rows);
  });
});

module.exports = router;