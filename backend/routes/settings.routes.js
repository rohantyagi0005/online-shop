const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings');
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.key_name] = r.value_text;
    });

    // Make categories an array
    if (settingsMap.categories) {
      settingsMap.categories = settingsMap.categories.split(',').map(c => c.trim());
    } else {
      settingsMap.categories = [];
    }

    res.json(settingsMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Update settings (Admin only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  const settingsData = req.body;
  
  try {
    for (const [key, val] of Object.entries(settingsData)) {
      let finalVal = val;
      if (Array.isArray(val)) {
        finalVal = val.join(',');
      }
      await pool.query(
        'INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = ?',
        [key, String(finalVal), String(finalVal)]
      );
    }
    res.json({ message: "Settings updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
