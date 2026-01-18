const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, requireOrganizer } = require('../middleware/authMiddleware');

const router = express.Router();

// Register route
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['organizer', 'client'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    // Check if user already exists
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating user' });
          }

          // Generate JWT
          const token = jwt.sign(
            { id: this.lastID, email, role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
          );

          res.status(201).json({ message: 'User registered successfully', token });
        });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token, role: user.role });
  });
});

// Logout route (optional, client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get all clients (organizer only)
router.get('/clients', authenticateToken, requireOrganizer, (req, res) => {
  db.all(`
    SELECT u.id, u.name, u.email, COUNT(b.id) as booking_count
    FROM users u
    LEFT JOIN bookings b ON u.id = b.user_id
    WHERE u.role = 'client'
    GROUP BY u.id, u.name, u.email
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;