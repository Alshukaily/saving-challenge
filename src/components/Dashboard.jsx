import React from 'react';
import { Dices, Settings, LogOut, Trophy, Wallet } from 'lucide-react';

export default function Dashboard({
  user,
  challenge,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  onOpenRandomModal,
  onOpenSettings,
  onLogout
}) {
  if (!challenge) return null;

  const remainingAmount = Math.max(0, challenge.target_amount - challenge.totalSaved);

  return (
    <div className="space-y-4">
      {/* Top Bar Header */}
      <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-800 shadow">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-black text-sm">{challenge.title}</h1>
            <p className="text-slate-400 text-xs font-semibold">{user.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700 cursor-pointer"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/30 cursor-pointer"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="glass-card p-4 border border-slate-700/60">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-bold mb-0.5">الموفر</div>
            <div className="text-lg font-black text-emerald-400">
              {challenge.totalSaved.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ر.ع</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-bold mb-0.5">المتبقي</div>
            <div className="text-lg font-black text-amber-400">
              {remainingAmount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ر.ع</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-bold mb-0.5">الصناديق</div>
            <div className="text-lg font-black text-white">
              {challenge.completedCount} <span className="text-xs text-slate-400 font-normal">/ {challenge.box_count}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-xs font-bold mb-0.5">المستهدف</div>
            <div className="text-lg font-black text-teal-400">
              {challenge.target_amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">ر.ع</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-slate-300 font-bold mb-1.5">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>نسبة الإنجاز</span>
            </span>
            <span className="text-emerald-400 font-black text-xs">{challenge.progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${challenge.progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="text-center">
        <button
          onClick={onOpenRandomModal}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-base rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 cursor-pointer"
        >
          <Dices className="w-6 h-6" />
          <span>سحب مبلغ عشوائي 🎲</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex bg-slate-800/80 p-1 rounded-lg w-full sm:w-auto border border-slate-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              filter === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            الكل ({challenge.box_count})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400'
            }`}
          >
            غير مكتملة ({challenge.box_count - challenge.completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              filter === 'completed' ? 'bg-teal-600 text-white' : 'text-slate-400'
            }`}
          >
            المكتملة ({challenge.completedCount})
          </button>
        </div>

        <div className="w-full sm:w-44">
          <input
            type="text"
            placeholder="بحث برقم أو مبلغ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-white text-xs outline-none"
          />
        </div>
      </div>
    </div>
  );
}
