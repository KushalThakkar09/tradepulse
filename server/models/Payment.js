const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  method: {
    type: String,
    enum: ['upi', 'netbanking', 'card'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  referenceCode: {
    type: String,
    required: true
  },
  upiId: { type: String },
  bankName: { type: String },
  cardLast4: { type: String },
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
