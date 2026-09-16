const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  assetType: {
    type: String,
    enum: ['stock', 'etf', 'crypto'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['market', 'limit', 'stop'],
    required: true
  },
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  targetPrice: {
    type: Number
  },
  status: {
    type: String,
    enum: ['executed', 'pending', 'cancelled'],
    default: 'executed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
