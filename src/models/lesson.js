const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true }, // in minutes
  type: { type: String, enum: ['theory', 'practice'], required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);