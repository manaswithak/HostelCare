import mongoose from 'mongoose';
const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: ['Maintenance', 'Cleanliness', 'Water', 'Electricity', 'Food', 'Internet', 'Security', 'Other'], default: 'Other' },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  hostel: { type: String, trim: true, default: '' },
  room: { type: String, trim: true, maxlength: 30, default: '' },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Submitted', 'In Progress', 'Resolved', 'Rejected'], default: 'Submitted' },
  resolutionNote: { type: String, trim: true, maxlength: 2000, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });
export default mongoose.model('Complaint', complaintSchema);
