const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Register — email OR phone required (at least one)
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name and password are required." });
  }
  if (!email && !phone) {
    return res.status(400).json({ message: "Please provide at least an email address or a phone number." });
  }

  try {
    // Check for duplicate email (if provided)
    if (email) {
      const [byEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
      if (byEmail.length > 0) {
        return res.status(400).json({ message: "This email address is already registered." });
      }
    }

    // Check for duplicate phone (if provided)
    if (phone) {
      const [byPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (byPhone.length > 0) {
        return res.status(400).json({ message: "This phone number is already registered." });
      }
    }

    const hashedPW = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, hashedPW, phone || null, 'customer']
    );

    const token = jwt.sign(
      { id: result.insertId, name, email: email || null, role: 'customer' },
      process.env.JWT_SECRET || 'supersecretjwtkeyforstationerygiftshop',
      { expiresIn: '7d' }
    );

    // Notification
    const identifier = email || phone;
    await pool.query(
      'INSERT INTO notifications (type, message) VALUES (?, ?)',
      ['new_customer', `New customer registered: ${name} (${identifier})`]
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, name, email: email || null, phone: phone || null, role: 'customer' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Login — accepts email OR phone number
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ message: "Email/Phone and password are required." });
  }

  try {
    // Match against both email and phone columns
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [identifier, identifier]
    );
    if (users.length === 0) {
      return res.status(400).json({ message: "No account found with that email or phone number." });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect password. Please try again." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecretjwtkeyforstationerygiftshop',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Forgot Password (Mock reset instructions for local shop simplicity)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const [users] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: "No account found with this email." });
    }

    // In a production app, you would send an email. For this local shop, we return instructions.
    res.json({
      message: "Password reset request submitted successfully. Since this is a local shop pickup site, please contact the store owner or show your ID at the counter to reset your password, or contact shop support."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Change Credentials (Admin/Owner only — updates their own email and/or password)
router.put('/change-credentials', verifyToken, async (req, res) => {
  const { current_password, new_email, new_password, new_name } = req.body;

  if (!current_password) {
    return res.status(400).json({ message: "Current password is required to make changes." });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: "User not found." });

    const user = users[0];
    const match = await bcrypt.compare(current_password, user.password);
    if (!match) {
      return res.status(403).json({ message: "Current password is incorrect. Please try again." });
    }

    const updates = [];
    const values = [];

    if (new_name && new_name !== user.name) {
      updates.push('name = ?');
      values.push(new_name);
    }

    if (new_email && new_email !== user.email) {
      // Check if email is taken by someone else
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [new_email, req.user.id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "That email is already in use by another account." });
      }
      updates.push('email = ?');
      values.push(new_email);
    }

    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
      }
      const hashed = await bcrypt.hash(new_password, 10);
      updates.push('password = ?');
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No changes provided. Please enter a new email or new password." });
    }

    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    // Issue fresh token with updated info
    const [updated] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    const freshUser = updated[0];
    const token = jwt.sign(
      { id: freshUser.id, name: freshUser.name, email: freshUser.email, role: freshUser.role },
      process.env.JWT_SECRET || 'supersecretjwtkeyforstationerygiftshop',
      { expiresIn: '7d' }
    );

    res.json({
      message: "Credentials updated successfully.",
      token,
      user: freshUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
