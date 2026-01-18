const express = require('express');
const db = require('../db');
const { authenticateToken, requireClient, requireOrganizer } = require('../middleware/authMiddleware');

const router = express.Router();

// Book an event (client only)
router.post('/', authenticateToken, requireClient, (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  if (!event_id) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  // Check if event exists
  db.get('SELECT * FROM events WHERE id = ?', [event_id], (err, event) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already booked
    db.get('SELECT * FROM bookings WHERE user_id = ? AND event_id = ?', [user_id, event_id], (err, booking) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (booking) {
        return res.status(400).json({ message: 'Already booked for this event' });
      }

      // Create booking
      db.run('INSERT INTO bookings (user_id, event_id) VALUES (?, ?)', [user_id, event_id], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error creating booking' });
        }
        res.status(201).json({ id: this.lastID, user_id, event_id });
      });
    });
  });
});

// Get my bookings (client only)
router.get('/my', authenticateToken, requireClient, (req, res) => {
  const user_id = req.user.id;

  db.all(`
    SELECT b.id, b.created_at, u.name as client_name, e.name as event_name, e.date, e.type
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN events e ON b.event_id = e.id
    WHERE b.user_id = ?
  `, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

// Get all bookings (organizer only)
router.get('/all', authenticateToken, requireOrganizer, (req, res) => {
  db.all(`
    SELECT b.id, b.created_at, u.name as client_name, u.email, e.name as event_name, e.date, e.type
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN events e ON b.event_id = e.id
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;