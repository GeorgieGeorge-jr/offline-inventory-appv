const express = require("express");
const router = express.Router();
const db = require("../db");

// Create sale
router.post("/", async (req, res, next) => {
  const client = await db.getClient();

  try {
    const { staff_user_id, items } = req.body || {};

    if (!staff_user_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "staff_user_id and items are required",
      });
    }

    await client.query("BEGIN");

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const productQuery = `
        SELECT *
        FROM products
        WHERE id = $1
        FOR UPDATE
      `;

      const productResult = await client.query(productQuery, [
        item.product_id,
      ]);

      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];
      const qty = Number(item.quantity);

      if (!qty || qty <= 0) {
        throw new Error(`Invalid quantity for ${product.name}`);
      }

      if (Number(product.quantity) < qty) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const unitPrice = Number(product.unit_price);
      const subtotal = unitPrice * qty;

      totalAmount += subtotal;

      validatedItems.push({
        product,
        qty,
        unitPrice,
        subtotal,
      });
    }

    const saleInsertQuery = `
      INSERT INTO sales (staff_user_id, total_amount)
      VALUES ($1, $2)
      RETURNING *
    `;

    const saleResult = await client.query(saleInsertQuery, [
      staff_user_id,
      totalAmount,
    ]);

    const sale = saleResult.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `
        INSERT INTO sale_items (
          sale_id,
          product_id,
          quantity,
          unit_price,
          subtotal
        )
        VALUES ($1,$2,$3,$4,$5)
      `,
        [
          sale.id,
          item.product.id,
          item.qty,
          item.unitPrice,
          item.subtotal,
        ]
      );

      await client.query(
        `
        UPDATE products
        SET
          quantity = quantity - $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [item.qty, item.product.id]
      );

      await client.query(
        `
        INSERT INTO stock_movements (
          product_id,
          user_id,
          movement_type,
          quantity,
          note
        )
        VALUES ($1, $2, 'SALE', $3, $4)
        `,
        [
          item.product.id,
          staff_user_id,
          item.qty,
          "Sold through sales terminal",
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      sale_id: sale.id,
      total_amount: totalAmount,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// Summary report
router.get("/reports/summary", async (req, res, next) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM products) AS total_inventory_value,
        (SELECT COUNT(*) FROM products WHERE quantity <= min_stock_level) AS low_stock_count,
        (SELECT COUNT(*) FROM products WHERE quantity = 0) AS out_of_stock_count
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      summary: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Stockout report
router.get("/reports/stockouts", async (req, res, next) => {
  try {
    const query = `
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

    const result = await db.query(query);

    res.json({
      success: true,
      stockouts: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Top sold products today
router.get("/reports/top-sold-today", async (req, res, next) => {
  try {
    const query = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.product_code,
        SUM(si.quantity) AS total_sold
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      JOIN products p ON p.id = si.product_id
      WHERE DATE(s.created_at) = CURRENT_DATE
      GROUP BY p.id, p.name, p.product_code
      ORDER BY total_sold DESC
      LIMIT 5
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      products: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
