import React, { useState } from 'react';
import { Sparkles, Target, Layers, DollarSign, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { generateBoxAmounts } from '../../challengeHelper.js';

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('تحدي التوفير');
  const [targetAmount, setTargetAmount] = useState(500);
  const [boxCount, setBoxCount] = useState(50);
  const [maxPerBox, setMaxPerBox] = useState(25);
  const [previewBoxes, setPreviewBoxes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const averagePerBox = targetAmount > 0 && boxCount > 0 ? Math.ceil(targetAmount / boxCount) : 0;
  const isValidMax = maxPerBox > averagePerBox;

  const handleGeneratePreview = () => {
    setError('');
    try {
      if (!targetAmount || targetAmount <= 0) throw new Error('أدخل مبلغاً صحيحاً');
      if (!boxCount || boxCount <= 0) throw new Error('أدخل عدد دفعات صحيح');
      if (!maxPerBox || maxPerBox <= 0) throw new Error('أدخل حداً أقصى للدفعة');

      const amounts = generateBoxAmounts(targetAmount, boxCount, maxPerBox);
      setPreviewBoxes(amounts);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!targetAmount || targetAmount <= 0) {
        setError('حدد المبلغ الكلي');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!isValidMax) {
        setError(`الحد الأقصى يجب أن يكون أكبر من المتوسط (${averagePerBox} ر.ع) لضمان أرقام عشوائية متنوعة`);
        return;
      }
      handleGeneratePreview();
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/challenge/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          targetAmount: Number(targetAmount),
          boxCount: Number(boxCount),
          maxPerBox: Number(maxPerBox)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل إنشاء التحدي');
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-6 border border-slate-700/60">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-white">إعداد تحدي التوفير</h2>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'w-8 bg-emerald-500' : 'w-3 bg-slate-700'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'w-8 bg-emerald-500' : 'w-3 bg-slate-700'}`} />
              <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'w-8 bg-emerald-500' : 'w-3 bg-slate-700'}`} />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="form-label">عنوان التحدي (اختياري)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                  style={{ paddingRight: '1rem' }}
                />
              </div>

              <div>
                <label className="form-label">المبلغ الكلي المستهدف (ر.ع)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="form-input font-bold"
                  />
                  <Target className="w-4 h-4 text-emerald-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {[100, 250, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetAmount(preset)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      targetAmount === preset ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {preset} ر.ع
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="form-label">عدد الدفعات (الصناديق)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="365"
                    value={boxCount}
                    onChange={(e) => setBoxCount(Number(e.target.value))}
                    className="form-input font-bold"
                  />
                  <Layers className="w-4 h-4 text-amber-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="form-label">الحد الأقصى للدفعة الواحدة (ر.ع)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={averagePerBox + 1}
                    value={maxPerBox}
                    onChange={(e) => setMaxPerBox(Number(e.target.value))}
                    className="form-input font-bold"
                  />
                  <DollarSign className="w-4 h-4 text-emerald-400 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none" />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>المتوسط الحسابي:</span>
                  <span className="font-bold text-amber-400">{averagePerBox} ر.ع</span>
                </div>
                <div className="flex justify-between">
                  <span>المبلغ النهائي:</span>
                  <span className="font-bold text-emerald-400">{targetAmount} ر.ع</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div>
                  <h4 className="text-white font-bold text-xs">{title}</h4>
                  <p className="text-slate-400 text-[11px] font-semibold">
                    {targetAmount} ر.ع على {boxCount} صندوقاً (حد أقصى {maxPerBox} ر.ع)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة التقسيم</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto pr-1 grid grid-cols-4 gap-1.5">
                {previewBoxes.map((amt, idx) => (
                  <div key={idx} className="bg-slate-800 p-1.5 rounded text-center border border-slate-700/60">
                    <div className="text-[9px] text-slate-400">#{idx + 1}</div>
                    <div className="text-xs font-bold text-emerald-400">{amt} <span className="text-[8px]">ر.ع</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                السابق
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد الصناديق</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
