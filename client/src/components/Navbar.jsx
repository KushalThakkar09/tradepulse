import React, { useState } from 'react';
import { 
  TrendingUp, 
  Wallet, 
  PlusCircle, 
  Bell, 
  Search, 
  PieChart, 
  BarChart2, 
  Newspaper, 
  User,
  LogOut,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/api';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  walletBalance, 
  portfolioValue, 
  openPaymentModal, 
  assets, 
  alertsCount,
  onSelectSymbol,
  user,
  onLogout,
  onLoginClick
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (symbol) => {
    onSelectSymbol(symbol);
    setSearchTerm('');
    setShowSearchResults(false);
    setActiveTab('trading');
  };

  const netWorth = (walletBalance || 0) + (portfolioValue || 0);

  return (
    <header className="bg-[#0b0e14]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Live Market Ticker Tape Banner */}
      <div className="bg-[#121721] border-b border-slate-800/80 overflow-hidden py-1.5 px-4 text-xs font-mono">
        <div className="flex items-center space-x-6 animate-ticker whitespace-nowrap">
          {assets.concat(assets).map((asset, idx) => (
            <div 
              key={`${asset.symbol}-${idx}`} 
              onClick={() => handleSelect(asset.symbol)}
              className="inline-flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="font-semibold text-slate-300">{asset.symbol}</span>
              <span className="text-slate-100">{formatINR(asset.price)}</span>
              <span className={`inline-flex items-center ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {asset.change >= 0 ? '+' : ''}{asset.changePercent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('trading')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">TradePulse</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  NSE/BSE LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Indian Equities • ETFs • Crypto (INR)</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Search NSE/BSE (e.g. RELIANCE, TCS, BTC)..."
                className="w-full bg-[#121721] text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg border border-slate-700/60 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Search Dropdown */}
            {showSearchResults && searchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#121721] border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto py-1">
                {filteredAssets.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-slate-400">No assets found matching "{searchTerm}"</div>
                ) : (
                  filteredAssets.map(asset => (
                    <div
                      key={asset.symbol}
                      onClick={() => handleSelect(asset.symbol)}
                      className="px-4 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer border-b border-slate-800/40 last:border-0"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-200">{asset.symbol}</div>
                        <div className="text-[11px] text-slate-400">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs text-slate-200">{formatINR(asset.price)}</div>
                        <div className={`text-[10px] ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {asset.change >= 0 ? '+' : ''}{asset.changePercent}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'trading' 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Trade</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'portfolio' 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </button>

            <button
              onClick={() => setActiveTab('watchlists')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all relative ${
                activeTab === 'watchlists' 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts & Watchlist</span>
              {alertsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'news' 
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">News</span>
            </button>
          </nav>

          {/* Account Balance, Deposit & User Profile Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden xl:flex flex-col items-end text-xs">
              <span className="text-[10px] text-slate-400">Total Net Worth</span>
              <span className="font-mono font-bold text-slate-100">
                {formatINR(netWorth)}
              </span>
            </div>

            <div className="flex items-center space-x-2 bg-[#121721] p-1.5 pl-2.5 rounded-lg border border-slate-700/60">
              <div className="flex items-center space-x-1.5 text-xs">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono font-semibold text-emerald-400">
                  {formatINR(walletBalance || 0)}
                </span>
              </div>
              <button
                onClick={openPaymentModal}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center space-x-1 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Cash</span>
              </button>
            </div>

            {/* Auth / Profile Button */}
            {user ? (
              <div className="flex items-center space-x-2 bg-[#121721] px-2.5 py-1.5 rounded-lg border border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">{user.name || 'Trader'}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
