import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';
import { authFetch, formatINR } from '../utils/api';

export default function TradingDashboard({ 
  assets, 
  selectedSymbol, 
  setSelectedSymbol, 
  walletBalance, 
  holdings, 
  onOrderExecuted,
  user,
  onLoginClick
}) {
  const [assetFilter, setAssetFilter] = useState('all'); // all, stock, etf, crypto
  const [timeframe, setTimeframe] = useState('1D'); // 1D, 1W, 1M, 1Y, 5Y
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  // Order Ticket state
  const [side, setSide] = useState('buy'); // buy, sell
  const [orderType, setOrderType] = useState('market'); // market, limit, stop
  const [quantity, setQuantity] = useState('1');
  const [targetPrice, setTargetPrice] = useState('');
  const [orderStatusMsg, setOrderStatusMsg] = useState(null);
  const [executingOrder, setExecutingOrder] = useState(false);

  const activeAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0] || {
    symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', price: 2980.50, change: 24.50, changePercent: 0.83, type: 'stock'
  };

  const userHolding = (holdings || []).find(h => h.symbol === activeAsset.symbol);
  const ownedQty = userHolding ? userHolding.quantity : 0;

  // Fetch chart history when symbol or timeframe changes
  useEffect(() => {
    let isMounted = true;
    setLoadingChart(true);

    fetch(`/api/market/chart/${encodeURIComponent(activeAsset.symbol)}?tf=${timeframe}`)
      .then(res => res.json())
      .then(res => {
        if (isMounted && res.success) {
          setChartData(res.data);
          setLoadingChart(false);
        }
      })
      .catch(err => {
        console.error('Error loading chart:', err);
        if (isMounted) setLoadingChart(false);
      });

    return () => { isMounted = false; };
  }, [activeAsset.symbol, timeframe]);

  // Set default target price on symbol change
  useEffect(() => {
    if (activeAsset) {
      setTargetPrice(activeAsset.price.toString());
    }
  }, [activeAsset?.symbol]);

  // Filtered Assets list
  const filteredAssets = assets.filter(a => {
    if (assetFilter === 'stock') return a.type === 'stock';
    if (assetFilter === 'etf') return a.type === 'etf';
    if (assetFilter === 'crypto') return a.type === 'crypto';
    return true;
  });

  const parsedQty = parseFloat(quantity) || 0;
  const unitPrice = orderType === 'market' ? activeAsset.price : (parseFloat(targetPrice) || activeAsset.price);
  const totalCost = parsedQty * unitPrice;

  // Handle Order Submit
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!user) {
      setOrderStatusMsg({ type: 'error', text: 'Please sign in to execute trading orders' });
      onLoginClick();
      return;
    }

    if (parsedQty <= 0) {
      setOrderStatusMsg({ type: 'error', text: 'Please enter a valid order quantity' });
      return;
    }

    if (side === 'buy' && totalCost > walletBalance) {
      setOrderStatusMsg({ 
        type: 'error', 
        text: `Insufficient buying power (${formatINR(walletBalance)}). Total order cost: ${formatINR(totalCost)}` 
      });
      return;
    }

    if (side === 'sell' && parsedQty > ownedQty) {
      setOrderStatusMsg({ 
        type: 'error', 
        text: `You only own ${ownedQty} shares/units of ${activeAsset.symbol}` 
      });
      return;
    }

    setExecutingOrder(true);
    setOrderStatusMsg(null);

    try {
      const response = await authFetch('/api/market/orders/place', {
        method: 'POST',
        body: JSON.stringify({
          symbol: activeAsset.symbol,
          side,
          orderType,
          quantity: parsedQty,
          targetPrice: orderType !== 'market' ? parseFloat(targetPrice) : null
        })
      });

      const res = await response.json();
      setExecutingOrder(false);

      if (res.success) {
        setOrderStatusMsg({ type: 'success', text: res.message });
        if (onOrderExecuted) onOrderExecuted(); // Refresh parent portfolio state
      } else {
        setOrderStatusMsg({ type: 'error', text: res.error || 'Failed to execute order' });
      }
    } catch (err) {
      setExecutingOrder(false);
      setOrderStatusMsg({ type: 'error', text: 'Network connection error executing order' });
    }
  };

  const isPositive = activeAsset.change >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Asset Universe & Selector (3 cols) */}
        <div className="lg:col-span-3 bg-[#121721] rounded-2xl border border-slate-800 p-4 flex flex-col h-[750px]">
          
          {/* Asset Category Tabs */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Markets
            </h2>
            <div className="flex bg-[#0b0e14] p-1 rounded-lg border border-slate-800 text-[11px]">
              {['all', 'stock', 'etf', 'crypto'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setAssetFilter(tab)}
                  className={`px-2 py-1 rounded capitalize font-medium transition-all ${
                    assetFilter === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Asset List Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredAssets.map(asset => {
              const isSelected = asset.symbol === activeAsset.symbol;
              const isUp = asset.change >= 0;
              return (
                <div
                  key={asset.symbol}
                  onClick={() => {
                    setSelectedSymbol(asset.symbol);
                    setOrderStatusMsg(null);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? 'bg-blue-900/20 border-blue-500/50 shadow-md shadow-blue-500/5' 
                      : 'bg-[#0b0e14]/40 border-slate-800/60 hover:border-slate-700 hover:bg-[#0b0e14]'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-100">{asset.symbol}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                        asset.type === 'crypto' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        asset.type === 'etf' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {asset.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[120px]">{asset.name}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-slate-100">
                      {formatINR(asset.price)}
                    </div>
                    <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isUp ? '+' : ''}{asset.changePercent}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COLUMN: Chart & Financial Metrics (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Active Asset Header */}
          <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-black text-white tracking-tight">{activeAsset.symbol}</h1>
                  <span className="text-sm text-slate-400 font-medium">{activeAsset.name}</span>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-3xl font-mono font-bold text-white tracking-tight">
                    {formatINR(activeAsset.price)}
                  </span>
                  <div className={`flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                    isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isPositive ? '+' : ''}{formatINR(activeAsset.change)} ({isPositive ? '+' : ''}{activeAsset.changePercent}%)
                  </div>
                </div>
              </div>

              {/* Timeframe Buttons */}
              <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-slate-800 text-xs">
                {['1D', '1W', '1M', '1Y', '5Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      timeframe === tf ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Financial Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Exchange</span>
                <span className="font-mono font-semibold text-slate-200">{activeAsset.exchange || 'NSE'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Asset Type</span>
                <span className="font-mono font-semibold text-slate-200 capitalize">{activeAsset.type || 'Equities'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">52-Wk Range</span>
                <span className="font-mono font-semibold text-slate-200">
                  {formatINR(activeAsset.low52 || 0)} - {formatINR(activeAsset.high52 || 0)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">24h Volume</span>
                <span className="font-mono font-semibold text-slate-200">{activeAsset.volume || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Interactive Recharts Financial Area Chart */}
          <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5 h-[420px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Real-Time Price Action ({timeframe})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Live WebSocket Feed</span>
            </div>

            {loadingChart ? (
              <div className="h-[320px] flex items-center justify-center text-slate-500 text-xs">
                Loading price stream charts...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 10 }} 
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `₹${val}`}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0b0e14', 
                      borderColor: '#334155', 
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatINR(val), 'Price']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? '#10b981' : '#ef4444'} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Order Book Depth Visualizer (Simulated Bid/Ask Spread) */}
          <div className="bg-[#121721] rounded-2xl border border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Order Book Depth (Market Level 2)</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Bids */}
              <div>
                <div className="flex justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>BUY BIDS (INR)</span>
                  <span>QTY</span>
                </div>
                <div className="space-y-1 mt-1">
                  {[0.999, 0.997, 0.995, 0.993].map((factor, idx) => (
                    <div key={idx} className="flex justify-between items-center text-emerald-400">
                      <span>{formatINR(activeAsset.price * factor)}</span>
                      <span className="text-slate-400">{(15 + idx * 8).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Asks */}
              <div>
                <div className="flex justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  <span>SELL ASKS (INR)</span>
                  <span>QTY</span>
                </div>
                <div className="space-y-1 mt-1">
                  {[1.001, 1.003, 1.005, 1.008].map((factor, idx) => (
                    <div key={idx} className="flex justify-between items-center text-rose-400">
                      <span>{formatINR(activeAsset.price * factor)}</span>
                      <span className="text-slate-400">{(12 + idx * 10).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Order Ticket & Execution Panel (3 cols) */}
        <div className="lg:col-span-3 bg-[#121721] rounded-2xl border border-slate-800 p-5 h-fit space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Order Ticket
            </h2>
            <span className="text-xs text-slate-400 font-mono">{activeAsset.symbol}</span>
          </div>

          {/* Buy / Sell Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setSide('buy')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                side === 'buy' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                side === 'sell' 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Order Type Tabs */}
          <div className="flex justify-between bg-[#0b0e14] p-1 rounded-lg border border-slate-800 text-[11px]">
            {['market', 'limit', 'stop'].map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-1 rounded capitalize font-semibold transition-all ${
                  orderType === type ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Order Form Inputs */}
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            
            {/* Quantity Input */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Quantity (Shares / Units)
              </label>
              <input
                type="number"
                step="any"
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1.0"
                className="w-full bg-[#0b0e14] text-sm text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Target Price Input (Limit or Stop) */}
            {orderType !== 'market' && (
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Target {orderType === 'limit' ? 'Limit' : 'Stop'} Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full bg-[#0b0e14] text-sm text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Account Balance & Position Summary */}
            <div className="bg-[#0b0e14] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Available Cash</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatINR(walletBalance || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Position Owned</span>
                <span className="font-mono text-slate-200 font-semibold">{ownedQty} {activeAsset.symbol}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                <span className="text-slate-300">Est. Total Cost</span>
                <span className="font-mono text-white">{formatINR(totalCost)}</span>
              </div>
            </div>

            {/* Execution Status Message Alert */}
            {orderStatusMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                orderStatusMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {orderStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{orderStatusMsg.text}</span>
              </div>
            )}

            {/* Execute Order Button */}
            <button
              type="submit"
              disabled={executingOrder}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 ${
                side === 'buy' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25' 
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{executingOrder ? 'Executing Order...' : `Execute ${side.toUpperCase()} Order`}</span>
            </button>

            {!user && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="text-[11px] text-blue-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Lock className="w-3 h-3" />
                  Sign in required to execute live trades
                </button>
              </div>
            )}

          </form>

        </div>

      </div>
    </div>
  );
}
