import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';

// @desc  Verify JWT and attach user to request
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_PASSWORD);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });

    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

// @desc  Restrict route to admin only (use after protect)
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied, admins only' });
  }
  next();
};