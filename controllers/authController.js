import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import CartService from '../services/cartService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Token validity\

// Register
export const register = async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'Email already in use' });

    // Vérifier si c'est le premier utilisateur
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user'; // premier -> admin, sinon user

    const user = new User({ fullname, email, password, role });
    await user.save();

    // generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Merge guest cart if sessionId exists
    const sessionId = req.headers['session-id'];
    if (sessionId) {
      await CartService.mergeCarts(user._id, sessionId);
    }
    res.status(201).json({
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    // Forward to centralized error handler
    next(error);
  }
};


// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    // generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Merge guest cart if sessionId exists
    const sessionId = req.headers['session-id'];
    if (sessionId) {
      await CartService.mergeCarts(user._id, sessionId);
    }

    res.json({
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};