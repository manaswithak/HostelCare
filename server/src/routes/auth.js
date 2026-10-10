import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, hostel: user.hostel });
const makeToken = user => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'development-secret-change-me', { expiresIn: '12h' });


router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, hostel } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters.'
      });
    }

    if (!hostel?.trim()) {
      return res.status(400).json({
        message: 'Please select or enter your hostel.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedHostel = hostel.trim();

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    // Public registration always creates a student account.
    // Never accept a role supplied by the frontend.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      hostel: normalizedHostel,
      role: 'student'
    });

    res.status(201).json({
      token: makeToken(user),
      user: publicUser(user)
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
