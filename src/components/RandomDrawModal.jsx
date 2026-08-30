import React, { useState, useEffect } from 'react';
import { Dices, CheckCircle, RefreshCw, X, Sparkles, AlertCircle } from 'lucide-react';

export default function RandomDrawModal({
  isOpen,
  onClose,
  drawnBox,
  loading,
  error,
  onDraw,
  onAcceptTransfer,
  onRejectTransfer
}) {
  const [spinning, setSpinning] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (isOpen && drawnBox) {
      setSpinning(true);
      let count = 0;
      const interval = setInterval(() => {
        setDisplayAmount(Math.floor(Math.random() * 25) + 1);
        count++;
        if (count > 12) {
          clearInterval(interval);
          setDisplayAmount(drawnBox.amount);
          setSpinning(false);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isOpen, drawnBox]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal p-6 sm:p-8 rounded-3xl max-w-sm w-full relative overflow-hidden text-center space-y-6">
        {/* Background ambient light */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl -z-10"></div>

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Icon */}
        <div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-500 p-0.5 shadow-xl shadow-amber-500/20 mx-auto mb-3 animate-bounce-subtle">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Dices className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white">السحب العشوائي لليوم</h3>
          <p className="text-slate-400 text-xs mt-1 font-semibold">تحدي نفسك وادخر في صندوق التوفير</p>
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs leading-relaxed">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
            {error}
          </div>
        ) : loading || spinning ? (
          <div className="py-8 space-y-3">
            <div className="text-4xl font-black text-amber-400 animate-pulse">
              {displayAmount} <span className="text-sm text-slate-400">ر.ع</span>
            </div>
            <p className="text-xs text-slate-400 font-bold">جاري اختيار صندوق عشوائي... 🎲</p>
          </div>
        ) : drawnBox ? (
          <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl space-y-2">
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
              صندوق رقم #{drawnBox.box_number}
            </span>

            <div className="text-3xl sm:text-4xl font-black text-emerald-400 pt-1">
              {drawnBox.amount.toLocaleString()} <span className="text-sm font-bold text-slate-300">ريال عماني (ر.ع)</span>
            </div>

            <p className="text-xs text-slate-400 pt-2 font-semibold">هل يمكنك تحويل وحفظ هذا المبلغ الآن؟</p>
          </div>
        ) : null}

        {/* Action Buttons */}
        {!loading && !spinning && drawnBox && !error && (
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onAcceptTransfer(drawnBox)}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              <span>أستطيع التحويل 💳</span>
            </button>

            <button
              onClick={() => onRejectTransfer(drawnBox.id)}
              className="w-full py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>لا أستطيع الان (اختر مبلغاً آخر) 🔄</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
