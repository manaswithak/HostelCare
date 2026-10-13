import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import userRoutes from './routes/users.js';

dotenv.config();
const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://hostel-care-khaki.vercel.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    message:
      status >= 500
        ? 'Server error. Please try again later.'
        : err.message || 'Request failed.'
  });
});


const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_complaints')
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
