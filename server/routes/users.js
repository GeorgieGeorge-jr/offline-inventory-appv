const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  const sql = `
    SELECT id, full_name, username, role, is_active, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: err,
    });
  }
});

router.get("/:id", async (req, res) => {
  const sql = `
    SELECT id, full_name, username, role, is_active, created_at
    FROM users
    WHERE id = $1
  `;

  try {
    const result = await db.query(sql, [req.params.id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: err,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { full_name, username, password, is_active } = req.body;

    if (!full_name || !username || !password) {
      return res.status(400).json({
        message: "full_name, username and password are required",
      });
    }

    const checkResult = await db.query(
      `SELECT id FROM users WHERE username = $1`,
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users
      (full_name, username, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'staff', $4)
      RETURNING id, full_name, username, role, is_active, created_at
      `,
      [full_name, username, password_hash, is_active ? true : false]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      message: "Failed to create user",
      error: err,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({
      message: "Failed to delete user",
      error: err,
    });
  }
});

module.exports = router;