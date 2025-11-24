import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { userSchema } from '../validations/userSchema.js';
import User from '../models/User.js';
const router = express.Router();

const loginSchema = userSchema.pick(['email', 'password']);

router.post('/register', validate(userSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', isAuthenticated, logout);

// Example of protected route
// Example of protected route
// Example of protected route
// Example of protected route
// Example of protected route
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `Welcome, user ${user.fullname}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
