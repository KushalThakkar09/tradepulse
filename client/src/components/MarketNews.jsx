import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, TrendingUp, Filter } from 'lucide-react';

export default function MarketNews({ selectedSymbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSymbol, setFilterSymbol] = useState(selectedSymbol || '');

  useEffect(() => {
    setLoading(true);
    const url = filterSymbol ? `/api/news?symbol=${filterSymbol}` : '/api/news';
    fetch(url)
      .then(res => res.json())
      .then(res => {
        if (res.success) setNews(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching news:', err);
        setLoading(false);
      });
  }, [filterSymbol]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-[#121721] rounded-2xl border border-slate-800 p-5">
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-400" />
              Financial Market & Breaking News
            </h2>
            <p className="text-xs text-slate-400">Real-time headlines, earnings reports, and macroeconomic analysis</p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setFilterSymbol('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !filterSymbol ? 'bg-blue-600 text-white' : 'bg-[#0b0e14] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All News
            </button>
            {selectedSymbol && (
              <button
                onClick={() => setFilterSymbol(selectedSymbol)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterSymbol === selectedSymbol ? 'bg-blue-600 text-white' : 'bg-[#0b0e14] text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {selectedSymbol} Only
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading market news feed...</div>
        ) : news.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No financial news matching filter.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map(item => (
              <div 
                key={item.id}
                className="bg-[#0b0e14]/60 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-semibold">{item.source} • {item.time}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.sentiment === 'Bullish' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      item.sentiment === 'Bearish' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                      'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                    }`}>
                      {item.sentiment}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 hover:text-blue-400 transition-colors cursor-pointer leading-snug">
                    {item.headline}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center space-x-1.5">
                    {item.relatedSymbols.map(sym => (
                      <span key={sym} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono font-semibold text-[10px]">
                        ${sym}
                      </span>
                    ))}
                  </div>
                  <span className="text-blue-400 flex items-center gap-1 font-semibold hover:underline cursor-pointer">
                    Read Story <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
