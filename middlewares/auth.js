import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Check if the user is logged in
export const isAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // contains { id, role, iat, exp }

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Check if the logged-in user is an admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Access denied: admin only', role: req.user.role });
  }

  next();
};
