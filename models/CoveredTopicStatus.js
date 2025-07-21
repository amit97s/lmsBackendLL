const mongoose = require('mongoose');

const coveredTopicStatusSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  course: { type: String, required: true },
  marked: { type: Object, required: true }, // { 0: true, 1: true, ... }
});

module.exports = mongoose.model('CoveredTopicStatus', coveredTopicStatusSchema); 