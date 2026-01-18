const express = require('express');
const db = require('../db');
const { authenticateToken, requireClient, requireOrganizer } = require('../middleware/authMiddleware');

const router = express.Router();

// Submit feedback (client only)
router.post('/', authenticateToken, requireClient, (req, res) => {
  const { event_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!event_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Event ID and rating (1-5) are required' });
  }

  // Check if user has booked this event
  db.get('SELECT * FROM bookings WHERE user_id = ? AND event_id = ?', [user_id, event_id], (err, booking) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!booking) {
      return res.status(403).json({ message: 'You can only provide feedback for events you have booked' });
    }

    // Check if feedback already exists
    db.get('SELECT * FROM feedback WHERE user_id = ? AND event_id = ?', [user_id, event_id], (err, existing) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (existing) {
        return res.status(400).json({ message: 'Feedback already submitted for this event' });
      }

      // Insert feedback
      db.run('INSERT INTO feedback (user_id, event_id, rating, comment) VALUES (?, ?, ?, ?)',
        [user_id, event_id, rating, comment], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error submitting feedback' });
          }
          res.status(201).json({ id: this.lastID, message: 'Feedback submitted successfully' });
        });
    });
  });
});

// Get my feedback (client only)
router.get('/my', authenticateToken, requireClient, (req, res) => {
  const user_id = req.user.id;

  db.all(`
    SELECT f.*, e.name as event_name, e.date
    FROM feedback f
    JOIN events e ON f.event_id = e.id
    WHERE f.user_id = ?
  `, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

// Get all feedback (organizer only)
router.get('/all', authenticateToken, requireOrganizer, (req, res) => {
  db.all(`
    SELECT f.*, u.name as client_name, u.email, e.name as event_name, e.date
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    JOIN events e ON f.event_id = e.id
    ORDER BY f.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;