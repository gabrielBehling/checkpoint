// Em models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['text', 'image', 'audio'], default: 'text' },
  fileUrl: { type: String },
  teamId: { type: String, required: true, index: true }, 
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);