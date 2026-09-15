# TradePulse - Indian Stock Market (NSE/BSE) & Cryptocurrency Trading Platform

TradePulse is a full-stack, real-time trading platform engineered for the **Indian Financial Markets (NSE & BSE)** and **Cryptocurrencies (INR)**. Powered by a high-performance **Express + WebSocket** backend, **MongoDB** database, **JWT user authentication**, and a responsive **React + Tailwind CSS** frontend.

---

## Key Features

1. **Live Indian Market Streaming (NSE / BSE / Crypto)**
   - Live WebSocket price tick feed broadcasting real-time price updates, 24h highs/lows, percentage changes, and volumes.
   - Comprehensive universe covering top NSE equities (**RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, BHARTIARTL, ITC, SBIN, LT, TATAMOTORS, TATASTEEL, WIPRO**), benchmark index ETFs (**NIFTYBEES, BANKBEES, GOLDBEES, MON100**), and cryptocurrencies (**BTC, ETH, SOL**) priced in Indian Rupees (INR ₹).
   - Real-time time-series historical price charts across multiple timeframes (1D, 1W, 1M, 1Y, 5Y).

2. **Interactive Trading Desk & Order Execution Engine**
   - Interactive Recharts financial area chart with dynamic gradients and live WebSocket updates.
   - Level-2 Order Book Depth visualizer with real-time bid/ask spreads.
   - Order Ticket supporting **Market**, **Limit**, and **Stop** orders with instant margin balance validation, fractional share support, and execution receipts.

3. **User Authentication & Secure Session Management**
   - Secure account registration and login backed by **bcrypt password hashing** and **JSON Web Tokens (JWT)**.
   - Persistent authenticated sessions with protected user endpoints and automated token injection.

4. **Portfolio Analytics & Performance Metrics**
   - Real-time Total Net Worth, invested capital, and un-realized Profit & Loss (₹ and % return) metrics.
   - Dynamic Asset Allocation Breakdown (Pie chart visualization across Equities, Index ETFs, and Crypto).
   - Live mark-to-market position valuation and complete trade audit execution logs.

5. **Watchlists & Target Price Alerts**
   - User-specific custom watchlists stored in MongoDB with one-click management.
   - Configurable price threshold alerts (Rises Above ₹ or Drops Below ₹).
   - Real-time WebSocket animated popup alerts when market prices hit target thresholds.

6. **Indian Payment Gateway & Account Funding**
   - Instant fund deposits and bank withdrawals with customizable limits (up to ₹ 10,00,000).
   - Supports **UPI** (Google Pay, PhonePe, Paytm, BHIM with VPA verification), **NetBanking** (HDFC, SBI, ICICI, Axis, Kotak), and **RuPay / Debit Cards**.
   - 2-Factor Security PIN authorization prompt and digital transaction receipts with reference IDs.

7. **Financial Market News & Sentiment**
   - Curated financial news feed covering Reserve Bank of India (RBI) policy decisions, corporate earnings reports, and crypto developments with sentiment tags (Bullish, Bearish, Neutral).

---

## Project Structure

```
Stock trading platform/
├── server/
│   ├── server.js              # Express REST API & WebSocket server entry point
│   ├── models/                # MongoDB Mongoose schemas
│   │   ├── User.js            # User accounts & initial wallet balance
│   │   ├── Portfolio.js       # User positions & average cost basis
│   │   ├── Order.js           # Order execution audit history
│   │   ├── Watchlist.js       # User custom watchlists
│   │   ├── PriceAlert.js      # Active & triggered price alerts
│   │   └── Payment.js         # Deposit & withdrawal transaction logs
│   ├── middleware/
│   │   └── auth.js            # JWT Bearer token verification middleware
│   ├── services/
│   │   └── marketData.js      # Live NSE/BSE & Crypto quotes engine
│   └── routes/
│       ├── auth.js            # User registration & login routes
│       ├── trading.js         # Asset, portfolio, order execution, & alert routes
│       ├── payments.js        # Account deposit & withdrawal routes
│       └── news.js            # Financial news & market sentiment routes
└── client/
    ├── src/
    │   ├── App.jsx            # Main app shell, tabs, & WebSocket client
    │   ├── main.jsx           # React DOM entry point
    │   ├── index.css          # Tailwind CSS styles & animations
    │   ├── utils/
    │   │   └── api.js         # Shared authFetch & INR currency formatting
    │   └── components/
    │       ├── Navbar.jsx            # Header ticker tape, search, & user profile
    │       ├── TradingDashboard.jsx  # Chart room, order book, & order execution
    │       ├── PortfolioAnalytics.jsx# Performance cards, allocation chart, & trade log
    │       ├── WatchlistAlerts.jsx   # Custom watchlists & target price alerts
    │       ├── MarketNews.jsx        # Breaking financial news feed
    │       ├── PaymentModal.jsx      # UPI / NetBanking / RuPay payment gateway
    │       └── AuthModal.jsx         # Sign In & Register modal dialog
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Quick Start Guide

### Prerequisites
- **Node.js** (v18 or newer)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or via cloud URI configured in `.env`

### 1. Backend Server & WebSocket
```bash
cd server
npm install
npm start
```
*Server will start on `http://localhost:5000` (REST API) and `ws://localhost:5000/ws` (WebSocket)*.

### 2. Frontend React Client
```bash
cd client
npm install
npm run dev
```
*Frontend dev server will launch at `http://localhost:3000`*.

---

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Create new trading account (initial balance ₹ 5,00,000).
- `POST /api/auth/login` - Authenticate user & receive JWT token.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Market Data & Trading (Protected)
- `GET /api/market/assets` - Retrieve all tradeable Indian assets with 24h stats.
- `GET /api/market/chart/:symbol?tf=1D` - Get historical candle charts.
- `GET /api/market/portfolio` - Get user portfolio positions & buying power *(Protected)*.
- `POST /api/market/orders/place` - Execute Market, Limit, or Stop Buy/Sell orders *(Protected)*.
- `GET /api/market/orders/history` - Retrieve user trade execution audit log *(Protected)*.
- `GET /api/market/watchlists` - Get user custom watchlist *(Protected)*.
- `POST /api/market/watchlists/add` - Add ticker to watchlist *(Protected)*.
- `DELETE /api/market/watchlists/remove/:symbol` - Remove ticker from watchlist *(Protected)*.
- `GET /api/market/alerts` - Get active price alerts *(Protected)*.
- `POST /api/market/alerts/add` - Set target price alert *(Protected)*.

### Payments (Protected)
- `POST /api/payments/deposit` - Deposit funds via UPI, NetBanking, or RuPay *(Protected)*.
- `POST /api/payments/withdraw` - Withdraw cash balance to linked bank account *(Protected)*.
- `GET /api/payments/history` - Retrieve payment deposit/withdrawal history *(Protected)*.
