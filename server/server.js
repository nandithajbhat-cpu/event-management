const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import database
const db = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const qrRoutes = require('./routes/qr');
const vendorRoutes = require('./routes/vendors');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/feedback', feedbackRoutes);

// Default route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});