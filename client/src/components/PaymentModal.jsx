import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { authFetch, formatINR } from '../utils/api';

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  walletBalance, 
  onPaymentSuccess 
}) {
  const [paymentType, setPaymentType] = useState('deposit'); // deposit, withdraw
  const [method, setMethod] = useState('upi'); // upi, netbanking, card
  const [amount, setAmount] = useState('25000');
  
  // UPI details
  const [upiId, setUpiId] = useState('trader@okhdfcbank');

  // Netbanking details
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('50100492817281');

  // Card details state
  const [cardNumber, setCardNumber] = useState('6071 8819 3012 9942');
  const [cardHolder, setCardHolder] = useState('Kushal Sharma');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('882');
  const [pin, setPin] = useState('1234');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt] = useState(null);

  if (!isOpen) return null;

  const handleFormatCard = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }

    if (paymentType === 'deposit' && numAmount > 1000000) {
      setErrorMsg('Maximum deposit limit per transaction is ₹ 10,00,000');
      return;
    }

    if (paymentType === 'withdraw' && numAmount > (walletBalance || 0)) {
      setErrorMsg(`Withdrawal amount exceeds available buying power (${formatINR(walletBalance || 0)})`);
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const endpoint = paymentType === 'deposit' ? '/api/payments/deposit' : '/api/payments/withdraw';
      const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          method,
          upiId,
          bankName,
          cardNumber,
          cardHolder,
          pin
        })
      });

      const res = await response.json();
      setSubmitting(false);

      if (res.success) {
        setReceipt(res.receipt);
        if (onPaymentSuccess) onPaymentSuccess();
      } else {
        setErrorMsg(res.error || 'Payment authorization failed');
      }
    } catch (err) {
      setSubmitting(false);
      setErrorMsg('Network error connecting to payment gateway');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121721] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0b0e14]/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Indian Payment Gateway
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">NPCI / RBI COMPLIANT</span>
              </h2>
              <p className="text-xs text-slate-400">Instant UPI • NetBanking • RuPay / Debit Card</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Digital Transaction Receipt View */}
          {receipt ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-emerald-500/40 mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Payment Authorized!</h3>
                <p className="text-xs text-emerald-300 mt-1">
                  {formatINR(receipt.amount)} has been {receipt.type === 'deposit' ? 'credited to' : 'debited from'} your trading cash balance.
                </p>
              </div>

              {/* Receipt Details Box */}
              <div className="bg-[#0b0e14] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Reference ID</span>
                  <span className="text-slate-200 font-bold">{receipt.referenceCode}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Transaction Channel</span>
                  <span className="text-slate-200 uppercase">{receipt.method} ({receipt.type})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timestamp</span>
                  <span className="text-slate-200">{new Date(receipt.timestamp).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-sans font-bold text-sm">
                  <span className="text-slate-300">Updated Cash Balance</span>
                  <span className="text-emerald-400 font-mono">{formatINR(receipt.newCashBalance)}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setReceipt(null);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/30 transition-all"
                >
                  Return to Trading Desk
                </button>
              </div>
            </div>
          ) : (
            /* Payment Form */
            <form onSubmit={handleSubmitTransaction} className="space-y-5">
              
              {/* Type Switcher: Deposit vs Withdraw */}
              <div className="grid grid-cols-2 gap-2 bg-[#0b0e14] p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentType('deposit')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    paymentType === 'deposit' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Deposit Funds (INR)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('withdraw')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    paymentType === 'withdraw' 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Withdraw to Bank
                </button>
              </div>

              {/* Amount Quick Options */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Amount (INR ₹)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['10000', '25000', '50000', '100000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                        amount === val 
                          ? 'bg-slate-700 border-blue-500 text-white' 
                          : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      +₹{(parseInt(val) / 1000)}k
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter deposit/withdrawal amount"
                    className="w-full bg-[#0b0e14] text-sm text-slate-100 font-mono pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Method Selector */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div
                  onClick={() => setMethod('upi')}
                  className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                    method === 'upi' 
                      ? 'bg-emerald-600/15 border-emerald-500 text-emerald-400' 
                      : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">UPI (BHIM)</div>
                  <div className="text-[9px] opacity-75">Instant 0% fee</div>
                </div>

                <div
                  onClick={() => setMethod('netbanking')}
                  className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                    method === 'netbanking' 
                      ? 'bg-blue-600/15 border-blue-500 text-blue-400' 
                      : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">NetBanking</div>
                  <div className="text-[9px] opacity-75">All Indian Banks</div>
                </div>

                <div
                  onClick={() => setMethod('card')}
                  className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                    method === 'card' 
                      ? 'bg-purple-600/15 border-purple-500 text-purple-400' 
                      : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">RuPay / Card</div>
                  <div className="text-[9px] opacity-75">Debit & Credit</div>
                </div>
              </div>

              {/* UPI Form */}
              {method === 'upi' && (
                <div className="space-y-2 text-xs">
                  <label className="text-slate-300 font-medium block">UPI VPA Address</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or phone@paytm"
                    className="w-full bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="text-[11px] text-slate-400">Supports GPay, PhonePe, Paytm, and BHIM UPI apps.</div>
                </div>
              )}

              {/* NetBanking Form */}
              {method === 'netbanking' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Select Bank</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                    >
                      <option value="HDFC Bank">HDFC Bank Ltd</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank Ltd</option>
                      <option value="Axis Bank">Axis Bank Ltd</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter 11-16 digit account number"
                      className="w-full bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Card Form */}
              {method === 'card' && (
                <div className="space-y-3">
                  <div className="h-36 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 p-4 border border-indigo-500/30 shadow-xl flex flex-col justify-between relative overflow-hidden font-mono">
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="font-sans font-bold tracking-widest text-indigo-400">TRADEPULSE RUPAY</span>
                      <span className="text-[10px] font-bold text-amber-400">RuPay DEBIT</span>
                    </div>

                    <div className="text-base font-bold text-white tracking-widest drop-shadow">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-300 uppercase">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-sans">CARD HOLDER</span>
                        <span>{cardHolder || 'VALUED TRADER'}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block font-sans">EXPIRES</span>
                        <span>{expiry || 'MM/YY'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Cardholder Name"
                      className="w-full bg-[#0b0e14] text-slate-100 px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleFormatCard}
                      placeholder="Card Number"
                      className="w-full bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                      />
                      <input
                        type="password"
                        maxLength="4"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="CVV"
                        className="bg-[#0b0e14] text-slate-100 font-mono px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security PIN Authorization */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Enter 4-Digit Security PIN (Simulated: 1234)
                </label>
                <input
                  type="password"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-[#0b0e14] text-center font-mono text-lg text-emerald-400 tracking-widest px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <span>{submitting ? 'Processing Payment...' : `Authorize ${paymentType === 'deposit' ? 'Deposit' : 'Withdrawal'} (${formatINR(parseFloat(amount || 0))})`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
