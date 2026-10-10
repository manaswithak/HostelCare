
import { Router } from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Return complaints according to the logged-in user's permissions.
router.get('/', async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (req.user.role === 'rector') {
      if (!req.user.hostel?.trim()) {
        return res.status(403).json({
          message: 'Your account has no hostel assigned. Contact the administrator.'
        });
      }

      filter.hostel = req.user.hostel.trim();
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email hostel')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (e) {
    next(e);
  }
});

// Students can submit complaints only for their own assigned hostel.
router.post('/', allowRoles('student'), async (req, res, next) => {
  try {
    const { title, category, description, room } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: 'Title and description are required.'
      });
    }

    if (!req.user.hostel?.trim()) {
      return res.status(400).json({
        message: 'No hostel is assigned to your account. Contact the administrator.'
      });
    }

    const complaint = await Complaint.create({
      title: title.trim(),
      category,
      description: description.trim(),
      hostel: req.user.hostel.trim(),
      room,
      student: req.user._id
    });

    const populated = await complaint.populate(
      'student',
      'name email hostel'
    );

    res.status(201).json({ complaint: populated });
  } catch (e) {
    next(e);
  }
});

// Rectors can update complaints from their own hostel.
// Admins can update complaints across all hostels.
router.patch('/:id', allowRoles('rector', 'admin'), async (req, res, next) => {
  try {
    const { status, resolutionNote } = req.body;
    const allowedStatuses = [
      'Submitted',
      'In Progress',
      'Resolved',
      'Rejected'
    ];

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID.' });
    }

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    if (
      resolutionNote !== undefined &&
      typeof resolutionNote !== 'string'
    ) {
      return res.status(400).json({
        message: 'Resolution note must be text.'
      });
    }

    // Scope the lookup BEFORE updating anything.
    const filter = { _id: req.params.id };

    if (req.user.role === 'rector') {
      if (!req.user.hostel?.trim()) {
        return res.status(403).json({
          message: 'Your account has no hostel assigned.'
        });
      }

      filter.hostel = req.user.hostel.trim();
    }

    const existing = await Complaint.findOne(filter);

    if (!existing) {
      return res.status(404).json({
        message: 'Complaint not found in your assigned hostel.'
      });
    }

    const note =
      resolutionNote !== undefined
        ? resolutionNote.trim()
        : existing.resolutionNote;

    if (status === 'Resolved' && !note) {
      return res.status(400).json({
        message: 'Add a resolution note before marking the complaint resolved.'
      });
    }

    const update = {};

    if (status) update.status = status;
    if (resolutionNote !== undefined) update.resolutionNote = note;

    if (status === 'Resolved') {
      update.resolvedBy = req.user._id;
      update.resolvedAt = new Date();
    } else if (status && status !== 'Resolved') {
      update.resolvedBy = null;
      update.resolvedAt = null;
    }

    const complaint = await Complaint.findOneAndUpdate(
      filter,
      update,
      { new: true, runValidators: true }
    )
      .populate('student', 'name email hostel')
      .populate('resolvedBy', 'name role');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }

    res.json({ complaint });
  } catch (e) {
    next(e);
  }
});

export default router;
