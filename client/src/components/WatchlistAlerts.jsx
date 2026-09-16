import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Star,
  Lock
} from 'lucide-react';
import { authFetch, formatINR } from '../utils/api';

export default function WatchlistAlerts({ 
  assets = [], 
  onSelectSymbol,
  user,
  onLoginClick
}) {
  const [watchlist, setWatchlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Alert form state
  const defaultAsset = assets[0] || { symbol: 'RELIANCE.NS', price: 2980 };
  const [alertSymbol, setAlertSymbol] = useState(defaultAsset.symbol);
  const [targetPrice, setTargetPrice] = useState(defaultAsset.price?.toString() || '3000');
  const [condition, setCondition] = useState('above'); // above, below
  const [addMsg, setAddMsg] = useState('');

  const fetchWatchlistAndAlerts = async () => {
    if (!user) {
      setWatchlist([]);
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      const [wRes, aRes] = await Promise.all([
        authFetch('/api/market/watchlists').then(r => r.json()),
        authFetch('/api/market/alerts').then(r => r.json())
      ]);

      if (wRes.success) setWatchlist(wRes.data || []);
      if (aRes.success) setAlerts(aRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching watchlists & alerts:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlistAndAlerts();
  }, [user]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    if (!user) {
      onLoginClick();
      return;
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) return;

    try {
      const res = await authFetch('/api/market/alerts/add', {
        method: 'POST',
        body: JSON.stringify({
          symbol: alertSymbol,
          targetPrice: parseFloat(targetPrice),
          condition
        })
      }).then(r => r.json());

      if (res.success) {
        setAddMsg(`Alert created: Notify when ${alertSymbol} is ${condition} ${formatINR(parseFloat(targetPrice))}`);
        setTimeout(() => setAddMsg(''), 4000);
        fetchWatchlistAndAlerts();
      } else {
        setAddMsg(`Error: ${res.error || 'Failed to create alert'}`);
      }
    } catch (err) {
      console.error('Error adding alert:', err);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await authFetch(`/api/market/alerts/delete/${id}`, { method: 'DELETE' });
      setAlerts(alerts.filter(a => (a._id || a.id) !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await authFetch(`/api/market/watchlists/remove/${symbol}`, { method: 'DELETE' });
      setWatchlist(watchlist.filter(w => w.symbol !== symbol));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Custom Watchlist (7 cols) */}
        <div className="lg:col-span-7 bg-[#121721] rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              Watchlist Assets ({watchlist.length})
            </h2>
            <span className="text-xs text-slate-400">NSE / BSE Live Monitoring</span>
          </div>

          {!user ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-3">
              <p>Sign in to sync your custom asset watchlist across devices.</p>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In to Access Watchlist</span>
              </button>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading watchlist...</div>
          ) : watchlist.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No assets in your watchlist yet.</div>
          ) : (
            <div className="space-y-2">
              {watchlist.map(item => {
                const liveAsset = assets.find(a => a.symbol === item.symbol) || item;
                const isUp = (liveAsset.changePercent || 0) >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="bg-[#0b0e14]/50 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div 
                      onClick={() => onSelectSymbol(item.symbol)}
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400">
                        {item.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          {item.symbol}
                          <span className="text-[10px] text-slate-400 font-normal">{liveAsset.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          52W Range: {formatINR(liveAsset.low52 || 0)} - {formatINR(liveAsset.high52 || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right font-mono">
                        <div className="font-bold text-sm text-slate-100">
                          {formatINR(liveAsset.price || 0)}
                        </div>
                        <div className={`text-xs font-semibold flex items-center justify-end ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isUp ? '+' : ''}{liveAsset.changePercent}%
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFromWatchlist(item.symbol)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Price Alerts Setup & Active Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Create Alert Form Card */}
          <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                Set Price Alert (INR)
              </h2>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Select Asset</label>
                <select
                  value={alertSymbol}
                  onChange={(e) => {
                    setAlertSymbol(e.target.value);
                    const match = assets.find(a => a.symbol === e.target.value);
                    if (match) setTargetPrice(match.price.toString());
                  }}
                  className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                >
                  {assets.map(a => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} - {a.name} ({formatINR(a.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Trigger Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  >
                    <option value="above">Rises Above (₹)</option>
                    <option value="below">Drops Below (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {addMsg && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{addMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Target Alert</span>
              </button>
            </form>
          </div>

          {/* Active Alerts List Card */}
          <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Active Alerts ({alerts.length})
            </h3>
            {!user ? (
              <div className="text-center py-4 text-slate-500 text-xs">Sign in to view and manage your alerts.</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">No active price alerts set.</div>
            ) : (
              <div className="space-y-2 text-xs">
                {alerts.map(alt => {
                  const targetP = alt.targetPrice || alt.target_price || 0;
                  const alertId = alt._id || alt.id;
                  return (
                    <div
                      key={alertId}
                      className={`p-3 rounded-xl border flex items-center justify-between font-mono ${
                        alt.triggered 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-[#0b0e14] border-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{alt.symbol}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            alt.condition === 'above' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {alt.condition.toUpperCase()} {formatINR(targetP)}
                          </span>
                        </div>
                        {alt.triggered ? (
                          <div className="text-[10px] text-emerald-400 font-sans mt-0.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Target Price Triggered!
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">Monitoring live feed...</div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(alertId)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
