const express = require("express");
const router = express.Router();
const db = require("../db");

const normalizeCode = (value) => String(value || "").trim();

// Lookup by barcode or product code
router.get("/lookup/:code", async (req, res, next) => {
  try {
    const code = normalizeCode(req.params.code);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Scan code is required",
      });
    }

    const query = `
      SELECT *
      FROM products
      WHERE barcode = $1
         OR product_code = $1
      LIMIT 1
    `;

    const result = await db.query(query, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Get all products
router.get("/", async (req, res, next) => {
  try {
    console.log("PRODUCT FETCH HIT");

    const query = `
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

    const result = await db.query(query);

    console.log("PRODUCTS RETURNED:");
    console.log(result.rows);

    res.json({
      success: true,
      products: result.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Get single product
router.get("/:id", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

    const result = await db.query(
      `SELECT * FROM products WHERE id = $1`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Create product
router.post("/", async (req, res, next) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "product_code and name are required",
      });
    }

    const duplicateQuery = `
      SELECT id, product_code, barcode
      FROM products
      WHERE product_code = $1
         OR ($2 <> '' AND barcode = $2)
      LIMIT 1
    `;

    const duplicateResult = await db.query(duplicateQuery, [
      cleanedProductCode,
      cleanedBarcode,
    ]);

    if (duplicateResult.rows.length > 0) {
      const existing = duplicateResult.rows[0];

      if (existing.product_code === cleanedProductCode) {
        return res.status(409).json({
          success: false,
          message: "Product code already exists",
        });
      }

      if (cleanedBarcode && existing.barcode === cleanedBarcode) {
        return res.status(409).json({
          success: false,
          message: "Barcode already exists",
        });
      }
    }

    const insertQuery = `
      INSERT INTO products (
        product_code,
        name,
        category,
        quantity,
        min_stock_level,
        unit_price,
        barcode,
        description
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;

    const insertResult = await db.query(insertQuery, [
      cleanedProductCode,
      name.trim(),
      category || null,
      Number(quantity) || 0,
      Number(min_stock_level) || 0,
      Number(unit_price) || 0,
      cleanedBarcode || null,
      description || null,
    ]);

    res.status(201).json({
      success: true,
      product: insertResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Update product
router.put("/:id", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

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
      return res.status(400).json({
        success: false,
        message: "product_code and name are required",
      });
    }

    const duplicateQuery = `
      SELECT id, product_code, barcode
      FROM products
      WHERE id <> $1
        AND (
          product_code = $2
          OR ($3 <> '' AND barcode = $3)
        )
      LIMIT 1
    `;

    const duplicateResult = await db.query(duplicateQuery, [
      productId,
      cleanedProductCode,
      cleanedBarcode,
    ]);

    if (duplicateResult.rows.length > 0) {
      const existing = duplicateResult.rows[0];

      if (existing.product_code === cleanedProductCode) {
        return res.status(409).json({
          success: false,
          message: "Another product already uses this product code",
        });
      }

      if (cleanedBarcode && existing.barcode === cleanedBarcode) {
        return res.status(409).json({
          success: false,
          message: "Another product already uses this barcode",
        });
      }
    }

    const updateQuery = `
      UPDATE products
      SET
        product_code = $1,
        name = $2,
        category = $3,
        quantity = $4,
        min_stock_level = $5,
        unit_price = $6,
        barcode = $7,
        description = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const updateResult = await db.query(updateQuery, [
      cleanedProductCode,
      name.trim(),
      category || null,
      Number(quantity) || 0,
      Number(min_stock_level) || 0,
      Number(unit_price) || 0,
      cleanedBarcode || null,
      description || null,
      productId,
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product: updateResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete("/:id", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);

    const saleCheck = await db.query(
      `SELECT id FROM sale_items WHERE product_id = $1 LIMIT 1`,
      [productId]
    );

    if (saleCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete product tied to sales history",
      });
    }

    const result = await db.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;