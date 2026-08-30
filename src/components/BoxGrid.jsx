import React, { useState } from 'react';
import { Check, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BoxGrid({ boxes, pendingBox, onToggleBox }) {
  const [selectedBox, setSelectedBox] = useState(null);
  const [loadingBoxId, setLoadingBoxId] = useState(null);

  const confirmToggle = async () => {
    if (!selectedBox) return;
    setLoadingBoxId(selectedBox.id);
    const wasPending = selectedBox.status === 'pending';

    await onToggleBox(selectedBox.id);

    if (wasPending) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }

    setLoadingBoxId(null);
    setSelectedBox(null);
  };

  if (!boxes || boxes.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold">
        لا توجد صناديق مطابقة للبحث
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 sm:gap-2.5">
        {boxes.map((box) => {
          const isCompleted = box.status === 'completed';
          const isPendingTransfer = pendingBox && pendingBox.id === box.id;

          return (
            <div
              key={box.id}
              onClick={() => setSelectedBox(box)}
              className={`relative rounded-xl p-2.5 cursor-pointer transition-all transform hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between overflow-hidden border select-none h-20 ${
                isCompleted
                  ? 'box-crossed border-emerald-500/40'
                  : isPendingTransfer
                  ? 'bg-slate-800 border-amber-500 animate-pulse-amber'
                  : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50'
              }`}
            >
              {/* Header: Box # & Icon */}
              <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isPendingTransfer
                    ? 'bg-amber-500/20 text-amber-300 font-extrabold'
                    : 'bg-slate-700/80 text-slate-300'
                }`}>
                  #{box.box_number}
                </span>

                {isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : isPendingTransfer ? (
                  <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 animate-spin">
                    <Clock className="w-3 h-3" />
                  </div>
                ) : null}
              </div>

              {/* Amount Display */}
              <div className="text-center my-auto">
                <div className={`text-base font-black leading-none ${
                  isCompleted ? 'text-slate-500 line-through' : isPendingTransfer ? 'text-amber-300' : 'text-emerald-400'
                }`}>
                  {box.amount.toLocaleString()}
                  <span className="text-[9px] font-normal text-slate-400 mr-0.5">ر.ع</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Box Direct Action Modal */}
      {selectedBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-modal p-5 rounded-2xl max-w-xs w-full text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">صندوق #{selectedBox.box_number}</h3>
              <p className="text-xl font-black text-emerald-400 my-1">{selectedBox.amount} ر.ع</p>
              <p className="text-xs text-slate-400 font-semibold">
                الحالة: {selectedBox.status === 'completed' ? 'مكتمل ومشطوب' : 'غير مكتمل'}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedBox(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                disabled={loadingBoxId === selectedBox.id}
                onClick={confirmToggle}
                className={`flex-1 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
                  selectedBox.status === 'completed'
                    ? 'bg-slate-700 hover:bg-slate-600 text-amber-300'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                }`}
              >
                {selectedBox.status === 'completed' ? 'إلغاء الشطب' : 'تأكيد الشطب ✅'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
