const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Order = require('../models/Order');
const Watchlist = require('../models/Watchlist');
const PriceAlert = require('../models/PriceAlert');
const { protect } = require('../middleware/auth');
const { getAllAssets, getAsset, getRealChartHistory, liveMarketPrices } = require('../services/marketData');

// 1. Public: Get all tradeable assets
router.get('/assets', (req, res) => {
  try {
    const assets = getAllAssets();
    res.json({ success: true, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Public: Get single asset detail
router.get('/asset/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const asset = getAsset(symbol);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Public: Get real NSE chart history
router.get('/chart/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const timeframe = req.query.tf || '1D';
    const data = await getRealChartHistory(symbol, timeframe);
    res.json({ success: true, symbol, timeframe, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Protected: Get User Portfolio & Wallet Balance (MongoDB)
router.get('/portfolio', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const holdings = await Portfolio.find({ userId: req.user._id });

    let totalCurrentValue = 0;
    let totalCostBasis = 0;

    const enrichedHoldings = holdings.map(item => {
      const liveAsset = liveMarketPrices[item.symbol];
      const currentPrice = liveAsset ? liveAsset.price : item.avgPrice;
      const currentValue = item.quantity * currentPrice;
      const costBasis = item.quantity * item.avgPrice;
      const profitLoss = currentValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

      totalCurrentValue += currentValue;
      totalCostBasis += costBasis;

      return {
        id: item._id,
        symbol: item.symbol,
        name: item.name,
        asset_type: item.assetType,
        quantity: item.quantity,
        avg_price: item.avgPrice,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        costBasis: parseFloat(costBasis.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2))
      };
    });

    const cashBalance = user ? user.cashBalance : 500000;
    const netWorth = cashBalance + totalCurrentValue;
    const overallProfitLoss = totalCurrentValue - totalCostBasis;
    const overallProfitLossPercent = totalCostBasis > 0 ? (overallProfitLoss / totalCostBasis) * 100 : 0;

    res.json({
      success: true,
      data: {
        cashBalance: parseFloat(cashBalance.toFixed(2)),
        portfolioValue: parseFloat(totalCurrentValue.toFixed(2)),
        netWorth: parseFloat(netWorth.toFixed(2)),
        totalProfitLoss: parseFloat(overallProfitLoss.toFixed(2)),
        totalProfitLossPercent: parseFloat(overallProfitLossPercent.toFixed(2)),
        holdings: enrichedHoldings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Protected: Order Execution in MongoDB
router.post('/orders/place', protect, async (req, res) => {
  try {
    const { symbol, side, orderType, quantity, targetPrice } = req.body;

    if (!symbol || !side || !orderType || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order parameters' });
    }

    const cleanSymbol = symbol.toUpperCase();
    const asset = getAsset(cleanSymbol);
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Asset symbol not found' });
    }

    const user = await User.findById(req.user._id);
    let cashBalance = user.cashBalance;

    const executionPrice = orderType === 'market' ? asset.price : (targetPrice || asset.price);
    const totalOrderCost = executionPrice * quantity;

    if (side === 'buy') {
      if (cashBalance < totalOrderCost) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient cash balance. Required: ₹ ${totalOrderCost.toFixed(2)}, Available: ₹ ${cashBalance.toFixed(2)}` 
        });
      }

      // Deduct cash balance
      user.cashBalance -= totalOrderCost;
      await user.save();

      // Update or insert holding in MongoDB
      let existingHolding = await Portfolio.findOne({ userId: user._id, symbol: cleanSymbol });
      if (existingHolding) {
        const newQty = existingHolding.quantity + quantity;
        const newAvgPrice = ((existingHolding.quantity * existingHolding.avgPrice) + totalOrderCost) / newQty;
        existingHolding.quantity = newQty;
        existingHolding.avgPrice = newAvgPrice;
        existingHolding.updatedAt = new Date();
        await existingHolding.save();
      } else {
        await Portfolio.create({
          userId: user._id,
          symbol: cleanSymbol,
          name: asset.name,
          assetType: asset.type,
          quantity,
          avgPrice: executionPrice
        });
      }
    } else if (side === 'sell') {
      const existingHolding = await Portfolio.findOne({ userId: user._id, symbol: cleanSymbol });
      if (!existingHolding || existingHolding.quantity < quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient shares/crypto to sell. Available: ${existingHolding ? existingHolding.quantity : 0}` 
        });
      }

      // Add cash balance
      user.cashBalance += totalOrderCost;
      await user.save();

      const remainingQty = existingHolding.quantity - quantity;
      if (remainingQty <= 0.000001) {
        await Portfolio.deleteOne({ _id: existingHolding._id });
      } else {
        existingHolding.quantity = remainingQty;
        existingHolding.updatedAt = new Date();
        await existingHolding.save();
      }
    }

    // Save Order Document in MongoDB
    const orderDoc = await Order.create({
      userId: user._id,
      symbol: cleanSymbol,
      name: asset.name,
      assetType: asset.type,
      orderType,
      side,
      quantity,
      price: executionPrice,
      targetPrice: targetPrice || null,
      status: 'executed'
    });

    res.json({
      success: true,
      message: `Successfully executed ${orderType.toUpperCase()} ${side.toUpperCase()} order for ${quantity} ${cleanSymbol} at ₹ ${executionPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      order: {
        id: orderDoc._id,
        symbol: cleanSymbol,
        name: asset.name,
        side,
        orderType,
        quantity,
        price: executionPrice,
        totalCost: parseFloat(totalOrderCost.toFixed(2)),
        status: 'executed'
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Protected: Get Order History from MongoDB
router.get('/orders/history', protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Protected: Watchlist routes (MongoDB)
router.get('/watchlists', protect, async (req, res) => {
  try {
    const list = await Watchlist.find({ userId: req.user._id }).sort({ addedAt: -1 });
    const enriched = list.map(item => {
      const asset = liveMarketPrices[item.symbol] || { symbol: item.symbol, name: item.symbol, price: 0, changePercent: 0 };
      return { id: item._id, ...asset };
    });
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/watchlists/add', protect, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ success: false, error: 'Symbol required' });

    const cleanSymbol = symbol.toUpperCase();
    await Watchlist.updateOne(
      { userId: req.user._id, symbol: cleanSymbol },
      { userId: req.user._id, symbol: cleanSymbol },
      { upsert: true }
    );

    res.json({ success: true, message: `Added ${cleanSymbol} to watchlist` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/watchlists/remove/:symbol', protect, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    await Watchlist.deleteOne({ userId: req.user._id, symbol });
    res.json({ success: true, message: `Removed ${symbol} from watchlist` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Protected: Price Alerts routes (MongoDB)
router.get('/alerts', protect, async (req, res) => {
  try {
    const alerts = await PriceAlert.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/alerts/add', protect, async (req, res) => {
  try {
    const { symbol, targetPrice, condition } = req.body;
    if (!symbol || !targetPrice || !condition) {
      return res.status(400).json({ success: false, error: 'Missing alert fields' });
    }
    const cleanSymbol = symbol.toUpperCase();
    const alertDoc = await PriceAlert.create({
      userId: req.user._id,
      symbol: cleanSymbol,
      targetPrice,
      condition
    });
    res.json({ success: true, data: alertDoc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/alerts/delete/:id', protect, async (req, res) => {
  try {
    await PriceAlert.deleteOne({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
