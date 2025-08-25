const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String },
  type: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  fileUrl: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);