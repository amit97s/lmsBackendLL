const mongoose = require('mongoose');

const CareerApplicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  resume: { type: String, required: true }, // file path
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CareerApplication', CareerApplicationSchema); 