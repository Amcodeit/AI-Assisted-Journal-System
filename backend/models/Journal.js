const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'userId is required'],
    index: true
  },
  ambience: {
    type: String,
    required: [true, 'ambience is required'],
    enum: {
      values: ['forest', 'ocean', 'mountain'],
      message: 'ambience must be forest, ocean, or mountain'
    }
  },
  text: {
    type: String,
    required: [true, 'text is required'],
    maxlength: [5000, 'text must be at most 5000 characters']
  },
  emotion: {
    type: String,
    default: null
  },
  keywords: {
    type: [String],
    default: []
  },
  summary: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

journalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Journal', journalSchema);
