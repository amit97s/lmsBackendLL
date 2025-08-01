const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  course: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  startDate: { type: String }, // or Date if you want strict date
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  duration: { type: Number, default: 3 }, // duration in months
  frequency: { type: String, enum: ['weekday', 'weekend'], default: 'weekday' },
  isRecurring: { type: Boolean, default: false }, // true for recurring class templates
  recurringId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // reference to parent recurring class
  live: { type: Boolean, default: false },
  meetLink: { type: String, default: '' },
}, {
  timestamps: true
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class; 