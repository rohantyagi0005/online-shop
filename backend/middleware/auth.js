const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  if (!tokenHeader) {
    return res.status(403).json({ message: "No token provided." });
  }

  const token = tokenHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: "Malformatted token." });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforstationerygiftshop', (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized token." });
    }
    req.user = decoded;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Admin role required." });
  }
};

module.exports = { verifyToken, isAdmin };
