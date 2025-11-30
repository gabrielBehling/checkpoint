const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  message: { type: String },
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['text', 'image', 'audio', 'comment', 'mixed'], default: 'text' },
  fileUrl: { type: String },
  teamId: { type: String, index: true }, 
  eventId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
});

module.exports = mongoose.model('Message', messageSchema);