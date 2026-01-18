const express = require('express');
const db = require('../db');
const { authenticateToken, requireOrganizer } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all vendors
router.get('/', authenticateToken, requireOrganizer, (req, res) => {
  db.all('SELECT * FROM vendors', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(rows);
  });
});

// Add vendor
router.post('/', authenticateToken, requireOrganizer, (req, res) => {
  const { name, service_type, contact } = req.body;

  if (!name || !service_type || !contact) {
    return res.status(400).json({ message: 'Name, service type, and contact are required' });
  }

  db.run('INSERT INTO vendors (name, service_type, contact) VALUES (?, ?, ?)',
    [name, service_type, contact], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error adding vendor' });
      }
      res.status(201).json({ id: this.lastID, name, service_type, contact });
    });
});

// Delete vendor
router.delete('/:id', authenticateToken, requireOrganizer, (req, res) => {
  const vendorId = req.params.id;

  db.run('DELETE FROM vendors WHERE id = ?', [vendorId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting vendor' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  });
});

module.exports = router;