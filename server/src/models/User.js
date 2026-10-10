import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'rector', 'admin'], default: 'student' },
  hostel: { type: String, trim: true, default: '' }
}, { timestamps: true });
export default mongoose.model('User', userSchema);
