import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import TradingDashboard from './components/TradingDashboard';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import WatchlistAlerts from './components/WatchlistAlerts';
import MarketNews from './components/MarketNews';
import PaymentModal from './components/PaymentModal';
import AuthModal from './components/AuthModal';
import { BellRing, X, LogOut } from 'lucide-react';

// Helper: get stored JWT token
function getToken() {
  return localStorage.getItem('trade_pulse_token');
}

// Helper: authenticated fetch wrapper
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('trading');
  const [assets, setAssets] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [portfolioData, setPortfolioData] = useState({
    cashBalance: 500000,
    portfolioValue: 0,
    netWorth: 500000,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    holdings: []
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  // Auth State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const wsRef = useRef(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('trade_pulse_token');
    const storedUser = localStorage.getItem('trade_pulse_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else {
      // Not logged in — show auth modal
      setAuthModalOpen(true);
    }
  }, []);

  // Fetch assets (public, no auth) + portfolio (requires auth)
  const fetchAssetsAndPortfolio = async () => {
    try {
      const assetRes = await fetch('/api/market/assets').then(r => r.json());
      if (assetRes.success) setAssets(assetRes.data);

      if (getToken()) {
        const portRes = await authFetch('/api/market/portfolio').then(r => r.json());
        if (portRes.success) setPortfolioData(portRes.data);
      }
    } catch (err) {
      console.error('Error fetching app state:', err);
    }
  };

  useEffect(() => {
    fetchAssetsAndPortfolio();
  }, [token]);

  // WebSocket real-time price feed
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch(e) {
      return;
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'snapshot') {
          setAssets(Object.values(msg.data));
        } else if (msg.type === 'alert_triggered') {
          setTriggeredAlerts(prev => [msg.alert, ...prev]);
        }
      } catch (err) { /* skip */ }
    };

    ws.onclose = () => {
      console.log('WebSocket closed. Reconnecting in 5s...');
      setTimeout(() => {
        // reconnect logic handled by re-mount
      }, 5000);
    };

    return () => { if (ws) ws.close(); };
  }, []);

  // Update portfolio calculations when asset prices move
  useEffect(() => {
    if (assets.length === 0 || portfolioData.holdings.length === 0) return;

    let currentVal = 0;
    let costBasisVal = 0;

    const updatedHoldings = portfolioData.holdings.map(h => {
      const match = assets.find(a => a.symbol === h.symbol);
      const curPrice = match ? match.price : h.currentPrice;
      const cVal = h.quantity * curPrice;
      const cBasis = h.quantity * h.avg_price;
      currentVal += cVal;
      costBasisVal += cBasis;

      return {
        ...h,
        currentPrice: curPrice,
        currentValue: parseFloat(cVal.toFixed(2)),
        costBasis: parseFloat(cBasis.toFixed(2)),
        profitLoss: parseFloat((cVal - cBasis).toFixed(2)),
        profitLossPercent: parseFloat((cBasis > 0 ? ((cVal - cBasis) / cBasis) * 100 : 0).toFixed(2))
      };
    });

    const netWorth = portfolioData.cashBalance + currentVal;
    const totalPL = currentVal - costBasisVal;
    const totalPLPct = costBasisVal > 0 ? (totalPL / costBasisVal) * 100 : 0;

    setPortfolioData(prev => ({
      ...prev,
      portfolioValue: parseFloat(currentVal.toFixed(2)),
      netWorth: parseFloat(netWorth.toFixed(2)),
      totalProfitLoss: parseFloat(totalPL.toFixed(2)),
      totalProfitLossPercent: parseFloat(totalPLPct.toFixed(2)),
      holdings: updatedHoldings
    }));
  }, [assets]);

  const handleAuthSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('trade_pulse_token');
    localStorage.removeItem('trade_pulse_user');
    setUser(null);
    setToken(null);
    setPortfolioData({
      cashBalance: 0, portfolioValue: 0, netWorth: 0,
      totalProfitLoss: 0, totalProfitLossPercent: 0, holdings: []
    });
    setAuthModalOpen(true);
  };

  const dismissAlert = (id) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
  };

  // INR formatter
  const formatINR = (val) => {
    return '₹ ' + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        walletBalance={portfolioData.cashBalance}
        portfolioValue={portfolioData.portfolioValue}
        openPaymentModal={() => user ? setPaymentModalOpen(true) : setAuthModalOpen(true)}
        assets={assets}
        alertsCount={triggeredAlerts.length}
        onSelectSymbol={setSelectedSymbol}
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setAuthModalOpen(true)}
      />

      {/* Triggered Price Alerts Banner Popups */}
      {triggeredAlerts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
          {triggeredAlerts.map(alt => (
            <div 
              key={alt.id}
              className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400/30 flex items-center justify-between animate-bounce"
            >
              <div className="flex items-center space-x-3">
                <BellRing className="w-6 h-6 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Target Price Alert Hit!</div>
                  <div className="text-xs text-emerald-100 font-mono">
                    {alt.symbol} reached {formatINR(alt.currentPrice)} ({alt.condition} {formatINR(alt.target_price || alt.targetPrice)})
                  </div>
                </div>
              </div>
              <button onClick={() => dismissAlert(alt.id)} className="p-1 hover:bg-emerald-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'trading' && (
          <TradingDashboard
            assets={assets}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            walletBalance={portfolioData.cashBalance}
            holdings={portfolioData.holdings}
            onOrderExecuted={fetchAssetsAndPortfolio}
            user={user}
            onLoginClick={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioAnalytics
            portfolioData={portfolioData}
            openPaymentModal={() => user ? setPaymentModalOpen(true) : setAuthModalOpen(true)}
            onSelectSymbol={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('trading');
            }}
          />
        )}

        {activeTab === 'watchlists' && (
          <WatchlistAlerts
            assets={assets}
            user={user}
            onSelectSymbol={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('trading');
            }}
            onLoginClick={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'news' && (
          <MarketNews selectedSymbol={selectedSymbol} />
        )}
      </main>

      {/* Secure Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        walletBalance={portfolioData.cashBalance}
        onPaymentSuccess={() => {
          fetchAssetsAndPortfolio();
        }}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => { if (user) setAuthModalOpen(false); }}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}
