import React, { useState, useEffect } from 'react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  Tooltip as ReTooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  History, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import { authFetch, formatINR } from '../utils/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

export default function PortfolioAnalytics({ 
  portfolioData, 
  openPaymentModal, 
  onSelectSymbol 
}) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    setLoadingHistory(true);
    authFetch('/api/market/orders/history')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setOrderHistory(res.data || []);
        }
        setLoadingHistory(false);
      })
      .catch(err => {
        console.error('Error fetching order history:', err);
        setLoadingHistory(false);
      });
  }, []);

  const { cashBalance = 0, portfolioValue = 0, netWorth = 0, totalProfitLoss = 0, totalProfitLossPercent = 0, holdings = [] } = portfolioData || {};

  // Calculate allocation breakdown data for Pie chart
  const allocationMap = { Cash: cashBalance };
  (holdings || []).forEach(h => {
    const typeKey = (h.asset_type || h.assetType) === 'stock' ? 'Stocks' : (h.asset_type || h.assetType) === 'etf' ? 'ETFs' : 'Crypto';
    allocationMap[typeKey] = (allocationMap[typeKey] || 0) + (h.currentValue || 0);
  });

  const pieData = Object.keys(allocationMap).map(key => ({
    name: key,
    value: parseFloat(allocationMap[key].toFixed(2))
  })).filter(item => item.value > 0);

  const isNetPositive = totalProfitLoss >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Net Worth Card */}
        <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="text-xs text-slate-400 font-medium">Total Net Worth</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {formatINR(netWorth)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span>Invested: {formatINR(portfolioValue)}</span>
          </div>
        </div>

        {/* Un-realized P&L Card */}
        <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5 shadow-lg">
          <div className="text-xs text-slate-400 font-medium">Total Returns (P&L)</div>
          <div className={`text-2xl font-mono font-bold mt-1 flex items-center gap-1 ${
            isNetPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isNetPositive ? '+' : ''}{formatINR(totalProfitLoss)}
          </div>
          <div className={`text-[11px] font-semibold mt-2 flex items-center gap-1 ${
            isNetPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {isNetPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            <span>{isNetPositive ? '+' : ''}{totalProfitLossPercent}% Return</span>
          </div>
        </div>

        {/* Uninvested Cash Balance Card */}
        <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Buying Power Cash</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {formatINR(cashBalance)}
            </div>
            <div className="text-[11px] text-slate-400 mt-2">Available for Instant Trading</div>
          </div>
          <button
            onClick={openPaymentModal}
            className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            title="Deposit Funds"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Active Holdings Count */}
        <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5 shadow-lg">
          <div className="text-xs text-slate-400 font-medium">Active Positions</div>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {holdings.length} Assets
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Diversified across NSE/BSE & Crypto</div>
        </div>

      </div>

      {/* Asset Allocation Pie Chart & Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Allocation Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-[#121721] rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              Asset Allocation Breakdown
            </h3>
          </div>

          <div className="h-[260px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#121721" strokeWidth={2} />
                  ))}
                </Pie>
                <ReTooltip 
                  formatter={(val) => [formatINR(val), 'Value']}
                  contentStyle={{ backgroundColor: '#0b0e14', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#0b0e14] p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
            Maintain a balanced portfolio across Indian Equities, Index ETFs, and Crypto assets to optimize risk-adjusted returns.
          </div>
        </div>

        {/* Current Holdings Table (7 cols) */}
        <div className="lg:col-span-7 bg-[#121721] rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Your Open Positions ({holdings.length})
            </h3>
          </div>

          {holdings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No active holdings yet. Explore markets to place your first trade!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-semibold">Asset</th>
                    <th className="pb-2 font-semibold">Qty</th>
                    <th className="pb-2 font-semibold">Avg Cost</th>
                    <th className="pb-2 font-semibold">Live Price</th>
                    <th className="pb-2 font-semibold">Market Value</th>
                    <th className="pb-2 font-semibold text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {holdings.map((item) => {
                    const isUp = (item.profitLoss || 0) >= 0;
                    return (
                      <tr 
                        key={item.symbol || item.id}
                        onClick={() => onSelectSymbol(item.symbol)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-sans">
                          <div className="font-bold text-slate-200">{item.symbol}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{item.name}</div>
                        </td>
                        <td className="py-3 text-slate-300">{item.quantity}</td>
                        <td className="py-3 text-slate-400">{formatINR(item.avg_price || item.avgPrice || 0)}</td>
                        <td className="py-3 font-bold text-slate-100">{formatINR(item.currentPrice || 0)}</td>
                        <td className="py-3 font-bold text-slate-200">{formatINR(item.currentValue || 0)}</td>
                        <td className={`py-3 text-right font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div>{isUp ? '+' : ''}{formatINR(item.profitLoss || 0)}</div>
                          <div className="text-[10px]">{isUp ? '+' : ''}{item.profitLossPercent || 0}%</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Transaction History Log Table */}
      <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Trade Execution Logs
          </h3>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6 text-slate-500 text-xs">Loading transaction logs...</div>
        ) : orderHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Exec Price</th>
                  <th className="pb-2 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orderHistory.map((ord) => {
                  const dateVal = ord.createdAt || ord.created_at;
                  const ordType = ord.orderType || ord.order_type;
                  const total = ord.totalCost || (ord.quantity * ord.price);
                  return (
                    <tr key={ord._id || ord.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 text-slate-400 text-[11px] font-sans">
                        {dateVal ? new Date(dateVal).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {ord.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 capitalize">{ordType}</td>
                      <td className="py-2.5 font-bold text-slate-200">{ord.symbol}</td>
                      <td className="py-2.5 text-slate-300">{ord.quantity}</td>
                      <td className="py-2.5 text-slate-300">{formatINR(ord.price)}</td>
                      <td className="py-2.5 text-right font-bold text-slate-100">
                        {formatINR(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
