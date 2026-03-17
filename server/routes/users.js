const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../db");

// Get all users
router.get("/", (req, res) => {
  const sql = `
    SELECT id, full_name, username, role, is_active, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch users", error: err });
    res.json(results);
  });
});

// Get single user
router.get("/:id", (req, res) => {
  const sql = `
    SELECT id, full_name, username, role, is_active, created_at
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch user", error: err });
    if (!results.length) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
});

// Create staff user only
router.post("/", async (req, res) => {
  try {
    const { full_name, username, password, is_active } = req.body;

    if (!full_name || !username || !password) {
      return res.status(400).json({ message: "full_name, username and password are required" });
    }

    db.query(`SELECT id FROM users WHERE username = ?`, [username], async (checkErr, checkRows) => {
      if (checkErr) {
        return res.status(500).json({ message: "Failed to validate username", error: checkErr });
      }

      if (checkRows.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (full_name, username, password_hash, role, is_active)
        VALUES (?, ?, ?, 'staff', ?)
      `;

      db.query(sql, [full_name, username, password_hash, is_active ? 1 : 0], (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create user", error: err });

        db.query(
          `SELECT id, full_name, username, role, is_active, created_at FROM users WHERE id = ?`,
          [result.insertId],
          (reloadErr, rows) => {
            if (reloadErr) {
              return res.status(500).json({ message: "User created but failed to reload", error: reloadErr });
            }

            res.status(201).json(rows[0]);
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Unexpected error", error });
  }
});

// Delete user
router.delete("/:id", (req, res) => {
  db.query(`DELETE FROM users WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to delete user", error: err });
    res.json({ success: true });
  });
});

module.exports = router;