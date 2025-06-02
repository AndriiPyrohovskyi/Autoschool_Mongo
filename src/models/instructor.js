const mongoose = require('mongoose');

const instructorSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  categories: [{ type: String, enum: ['A', 'B', 'C', 'D'] }],
  hourlyRate: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Instructor', instructorSchema);