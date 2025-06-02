const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  enrollmentDate: { type: Date, default: Date.now },
  category: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  status: { type: String, enum: ['active', 'completed', 'suspended'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);