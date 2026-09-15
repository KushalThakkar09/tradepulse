const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { syncAllRealIndianMarketPrices, liveMarketPrices } = require('./services/marketData');
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');
const paymentRoutes = require('./routes/payments');
const newsRoutes = require('./routes/news');
const PriceAlert = require('./models/PriceAlert');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stock_trading_db';

// Connect MongoDB Database
mongoose.connect(MONGODB_URI)
  .then(() => console.log(`Connected to MongoDB Database at ${MONGODB_URI}`))
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', tradingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/news', newsRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    market: 'Indian Stock Market (NSE/BSE)',
    time: new Date().toISOString() 
  });
});

// Create HTTP Server & WebSocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Active WS Client Connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send current real market snapshot on connect
  ws.send(JSON.stringify({ type: 'snapshot', data: liveMarketPrices }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
    clients.delete(ws);
  });
});

// Broadcast live price updates every 3 seconds
setInterval(async () => {
  if (clients.size === 0) return;

  const payload = JSON.stringify({ type: 'snapshot', data: liveMarketPrices });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }

  // Check MongoDB Price Alerts
  try {
    const activeAlerts = await PriceAlert.find({ triggered: false });
    for (const alert of activeAlerts) {
      const liveAsset = liveMarketPrices[alert.symbol];
      if (liveAsset) {
        let isTriggered = false;
        if (alert.condition === 'above' && liveAsset.price >= alert.targetPrice) {
          isTriggered = true;
        } else if (alert.condition === 'below' && liveAsset.price <= alert.targetPrice) {
          isTriggered = true;
        }

        if (isTriggered) {
          alert.triggered = true;
          await alert.save();

          const alertPayload = JSON.stringify({
            type: 'alert_triggered',
            alert: {
              id: alert._id,
              symbol: alert.symbol,
              targetPrice: alert.targetPrice,
              condition: alert.condition,
              currentPrice: liveAsset.price,
              triggeredAt: new Date().toISOString()
            }
          });
          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(alertPayload);
            }
          }
        }
      }
    }
  } catch (err) {
    // Ignore alert check error
  }
}, 3000);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Indian Stock Trading Platform API (MongoDB & JWT Auth)`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`====================================================`);
});
