import React, { useState } from 'react';
import { Bell, RefreshCw, LogOut, X } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  onResetChallenge,
  onLogout
}) {
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    isNotificationSupported ? window.Notification?.permission === 'granted' : false
  );
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleNotifications = async () => {
    if (!isNotificationSupported) {
      setMsg('متصفحك لا يدعم الإشعارات التلقائية');
      return;
    }

    if (window.Notification.permission === 'granted') {
      setMsg('الإشعارات مفعّلة بالفعل في متصفحك ✅');
    } else {
      try {
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          setMsg('تم تفعيل الإشعارات بنجاح 🎉');
          new window.Notification('تطبيق صندوق التوفير', {
            body: 'تم تفعيل التنبيهات بنجاح!',
            icon: '/icon.svg'
          });
        } else {
          setMsg('تم رفض الإذن بالإشعارات من المتصفح');
        }
      } catch (e) {
        setMsg('تعذر تفعيل الإشعارات في هذا المتصفح');
      }
    }
  };

  const handleTestNotification = () => {
    if (isNotificationSupported && window.Notification.permission === 'granted') {
      new window.Notification('تذكير توفير المبلغ 💰', {
        body: 'لا تنسَ فتح التطبيق وسحب مبلغ عشوائي اليوم!',
        icon: '/icon.svg'
      });
      setMsg('تم إرسال إشعار تجريبي 🔔');
    } else {
      setMsg('يرجى تفعيل الإشعارات أولاً');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-modal p-6 rounded-3xl max-w-md w-full relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-lg font-black text-white">إعدادات التطبيق والتنبيهات</h3>
        </div>

        {msg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs text-center">
            {msg}
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xs">تنبيهات التوفير</h4>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                notificationsEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-500 text-slate-950 font-black'
              }`}
            >
              {notificationsEnabled ? 'مفعّلة ✅' : 'تفعيل'}
            </button>
          </div>

          {notificationsEnabled && (
            <button
              onClick={handleTestNotification}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              تجربة إرسال إشعار تذكيري 🔔
            </button>
          )}
        </div>

        {/* Challenge Management */}
        <div className="bg-slate-800/70 p-4 rounded-2xl border border-slate-700/80 space-y-2">
          <h4 className="text-slate-200 font-bold text-xs">إعادة ضبط التحدي</h4>
          <button
            onClick={() => {
              if (window.confirm('إغلاق هذا التحدي وبدء تحدي جديد؟')) {
                onResetChallenge();
                onClose();
              }
            }}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بدء تحدي جديد</span>
          </button>
        </div>

        {/* Logout */}
        <div className="pt-1">
          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج ({user.username})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
