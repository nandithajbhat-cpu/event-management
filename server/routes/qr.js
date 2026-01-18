const express = require('express');
const db = require('../db');
const { authenticateToken, requireClient } = require('../middleware/authMiddleware');
const QRCode = require('qrcode');

const router = express.Router();

// Generate QR code for booking (client only)
router.get('/:bookingId', authenticateToken, requireClient, (req, res) => {
  const bookingId = req.params.bookingId;
  const userId = req.user.id;

  // Get booking details with event and user info
  db.get(`
    SELECT b.id, b.created_at, u.name as client_name, e.name as event_name, e.date, e.type
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN events e ON b.event_id = e.id
    WHERE b.id = ? AND b.user_id = ?
  `, [bookingId, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Booking not found or access denied' });
    }

    // Create QR data
    const qrData = JSON.stringify({
      client_name: row.client_name,
      event_name: row.event_name,
      event_date: row.date,
      event_type: row.type,
      booking_id: row.id
    });

    // Generate QR code as base64
    QRCode.toDataURL(qrData, (err, url) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code' });
      }
      res.json({ qr_code: url });
    });
  });
});

module.exports = router;