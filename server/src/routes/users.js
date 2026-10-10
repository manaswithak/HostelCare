import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect, allowRoles } from '../middleware/auth.js';
const router = Router();
router.use(protect, allowRoles('admin'));
router.post('/rectors', async (req, res, next) => {
  try {
    const { name, email, password, hostel } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'Email already exists.' });
    const user = await User.create({ name, email, hostel: hostel || '', passwordHash: await bcrypt.hash(password, 12), role: 'rector' });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, hostel: user.hostel } });
  } catch (e) { next(e); }
});
export default router;
