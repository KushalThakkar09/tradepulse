const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

// Process Account Deposit (UPI / NetBanking / RuPay Card)
router.post('/deposit', protect, async (req, res) => {
  try {
    const { amount, method, upiId, bankName, cardNumber, pin } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid deposit amount' });
    }

    if (amount > 1000000) {
      return res.status(400).json({ success: false, error: 'Maximum deposit limit per transaction is ₹ 10,00,000' });
    }

    // PIN check
    if (pin && pin !== '1234' && pin.length < 4) {
      return res.status(401).json({ success: false, error: 'Security PIN verification failed' });
    }

    const user = await User.findById(req.user._id);
    user.cashBalance += parseFloat(amount);
    await user.save();

    const refCode = `UPI-IN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const cardLast4 = cardNumber ? cardNumber.slice(-4) : null;

    const paymentDoc = await Payment.create({
      userId: user._id,
      type: 'deposit',
      method: method || 'upi',
      amount: parseFloat(amount),
      referenceCode: refCode,
      upiId: upiId || 'trader@upi',
      bankName: bankName || 'HDFC Bank',
      cardLast4,
      status: 'completed'
    });

    res.json({
      success: true,
      message: `Successfully deposited ₹ ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} into your trading account!`,
      receipt: {
        transactionId: paymentDoc._id,
        referenceCode: refCode,
        type: 'deposit',
        method: method || 'upi',
        amount: parseFloat(amount),
        newCashBalance: parseFloat(user.cashBalance.toFixed(2)),
        timestamp: paymentDoc.createdAt
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Process Account Withdrawal to Bank / UPI
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { amount, upiId, bankName, pin } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid withdrawal amount' });
    }

    const user = await User.findById(req.user._id);
    if (user.cashBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: `Insufficient uninvested cash balance for withdrawal. Available: ₹ ${user.cashBalance.toFixed(2)}` 
      });
    }

    if (pin && pin !== '1234' && pin.length < 4) {
      return res.status(401).json({ success: false, error: 'Security PIN verification failed' });
    }

    user.cashBalance -= parseFloat(amount);
    await user.save();

    const refCode = `WTH-IN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const paymentDoc = await Payment.create({
      userId: user._id,
      type: 'withdrawal',
      method: 'netbanking',
      amount: parseFloat(amount),
      referenceCode: refCode,
      upiId: upiId || 'trader@upi',
      bankName: bankName || 'State Bank of India',
      status: 'completed'
    });

    res.json({
      success: true,
      message: `Withdrawal of ₹ ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} processed to your linked Indian bank account.`,
      receipt: {
        transactionId: paymentDoc._id,
        referenceCode: refCode,
        type: 'withdrawal',
        method: 'netbanking',
        amount: parseFloat(amount),
        newCashBalance: parseFloat(user.cashBalance.toFixed(2)),
        timestamp: paymentDoc.createdAt
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Payment History from MongoDB
router.get('/history', protect, async (req, res) => {
  try {
    const transactions = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
