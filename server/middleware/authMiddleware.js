const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Attach user info to request
    next();
  });
};

// Middleware to check if user is organizer
const requireOrganizer = (req, res, next) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Access denied. Organizer role required.' });
  }
  next();
};

// Middleware to check if user is client
const requireClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({ message: 'Access denied. Client role required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireOrganizer,
  requireClient
};