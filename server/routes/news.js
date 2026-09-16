const express = require('express');
const router = express.Router();

const MARKET_NEWS = [
  {
    id: 1,
    headline: 'RBI Monetary Policy Committee Keeps Repo Rate Steady at 6.5%, Forecasts Robust 7.2% GDP Growth',
    source: 'Economic Times',
    time: '18 mins ago',
    sentiment: 'Bullish',
    relatedSymbols: ['HDFCBANK.NS', 'SBIN.NS', 'BANKBEES.NS', 'NIFTYBEES.NS'],
    summary: 'The Reserve Bank of India maintained policy rates while projecting strong domestic consumption, reinforcing financial sector and banking stock liquidity.'
  },
  {
    id: 2,
    headline: 'Reliance Industries Unveils Mega Deep-Tech AI & Clean Energy Investment of ₹ 75,000 Crore in Gujarat',
    source: 'Business Standard',
    time: '45 mins ago',
    sentiment: 'Bullish',
    relatedSymbols: ['RELIANCE.NS', 'NIFTYBEES.NS'],
    summary: 'RIL announced major expansion in sovereign enterprise cloud infrastructure, gigawatt solar arrays, and high-efficiency green hydrogen facilities.'
  },
  {
    id: 3,
    headline: 'TCS Secures Multi-Billion Dollar European Digital Transformation & Generative AI Modernization Deal',
    source: 'LiveMint',
    time: '1 hour ago',
    sentiment: 'Bullish',
    relatedSymbols: ['TCS.NS', 'INFY.NS', 'WIPRO.NS'],
    summary: 'Tata Consultancy Services finalized an expanded 7-year strategic engagement delivering enterprise AI agents and hybrid cloud management across 15 countries.'
  },
  {
    id: 4,
    headline: 'Bitcoin Crosses ₹ 58 Lakhs Mark as Global Inflows Accelerate Post US Halving Cycle',
    source: 'CoinDesk India',
    time: '2 hours ago',
    sentiment: 'Bullish',
    relatedSymbols: ['BTC', 'ETH', 'SOL'],
    summary: 'Institutional digital asset accumulation and corporate treasury reserves drove spot Bitcoin and Ethereum pricing higher across Indian rupee pairs.'
  },
  {
    id: 5,
    headline: 'Infosys Expands Enterprise Generative AI Partnership with Leading Global Cloud Providers',
    source: 'Financial Express',
    time: '3 hours ago',
    sentiment: 'Bullish',
    relatedSymbols: ['INFY.NS', 'TCS.NS'],
    summary: 'Infosys Topaz AI suite saw strong enterprise adoption across North America and Europe, beating quarterly tech bookings guidance.'
  },
  {
    id: 6,
    headline: 'Nifty 50 and Sensex Scale New Heights Powered by Domestic Institutional Capital and FII Inflows',
    source: 'Moneycontrol',
    time: '4 hours ago',
    sentiment: 'Bullish',
    relatedSymbols: ['NIFTYBEES.NS', 'BANKBEES.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'LT.NS'],
    summary: 'Benchmark indices set fresh all-time records as retail SIP inflows and sustained mutual fund allocations supported broad-market momentum.'
  }
];

router.get('/', (req, res) => {
  const symbol = req.query.symbol;
  if (symbol) {
    const cleanSymbol = symbol.toUpperCase();
    const filtered = MARKET_NEWS.filter(news => 
      news.relatedSymbols.some(s => s === cleanSymbol || cleanSymbol.includes(s) || s.includes(cleanSymbol))
    );
    return res.json({ success: true, data: filtered.length > 0 ? filtered : MARKET_NEWS.slice(0, 3) });
  }
  res.json({ success: true, data: MARKET_NEWS });
});

module.exports = router;
