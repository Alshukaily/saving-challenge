import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PendingReminderBanner({ pendingBox, onConfirmTransfer }) {
  const [loading, setLoading] = useState(false);

  if (!pendingBox) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirmTransfer();

    // Trigger celebration confetti 🎉
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border-2 border-amber-500/80 p-4 rounded-2xl shadow-xl shadow-amber-500/10 animate-pulse-amber flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-right">
        <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
          <Bell className="w-6 h-6 animate-bounce-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-amber-400 font-black text-sm sm:text-base">تذكير بتحويل المبلغ</h4>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
              صندوق #{pendingBox.box_number}
            </span>
          </div>
          <p className="text-slate-300 text-xs mt-0.5">
            لديك مبلغ <span className="text-emerald-400 font-black text-sm">{pendingBox.amount} ر.ع</span> تم اختياره بانتظار إتمام التحويل.
          </p>
        </div>
      </div>

      <button
        disabled={loading}
        onClick={handleConfirm}
        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>تم تحويل المبلغ وشطب الصندوق ✅</span>
          </>
        )}
      </button>
    </div>
  );
}
