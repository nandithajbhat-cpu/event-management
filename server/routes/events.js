const express = require('express');
const db = require('../db');
const { authenticateToken, requireOrganizer } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all events
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

// Create event (organizer only)
router.post('/', authenticateToken, requireOrganizer, (req, res) => {
  const { name, date, type } = req.body;
  const created_by = req.user.id;

  if (!name || !date || !type) {
    return res.status(400).json({ message: 'Name, date, and type are required' });
  }

  db.run('INSERT INTO events (name, date, type, created_by) VALUES (?, ?, ?, ?)',
    [name, date, type, created_by], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating event' });
      }
      res.status(201).json({ id: this.lastID, name, date, type, created_by });
    });
});

// Delete event (organizer only)
router.delete('/:id', authenticateToken, requireOrganizer, (req, res) => {
  const eventId = req.params.id;

  db.run('DELETE FROM events WHERE id = ?', [eventId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting event' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  });
});

// Search events (authenticated users)
router.get('/search', authenticateToken, (req, res) => {
  const query = req.query.q || '';
  const sql = `
    SELECT * FROM events
    WHERE name LIKE ? OR type LIKE ?
  `;
  const params = [`%${query}%`, `%${query}%`];

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

module.exports = router;