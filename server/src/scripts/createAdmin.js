import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
dotenv.config();
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) {
  console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env first.');
  process.exit(1);
}
if (process.env.ADMIN_PASSWORD.length < 12) {
  console.error('For initial admin, use a password of at least 12 characters.');
  process.exit(1);
}
await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_complaints');
const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
const existing = await User.findOne({ email });
if (existing) console.log(`Account already exists for ${email}; no changes made.`);
else {
  await User.create({ name: process.env.ADMIN_NAME, email, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' });
  console.log(`Admin created: ${email}`);
}
await mongoose.disconnect();
