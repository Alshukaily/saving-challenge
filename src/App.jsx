import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './components/Dashboard';
import BoxGrid from './components/BoxGrid';
import PendingReminderBanner from './components/PendingReminderBanner';
import RandomDrawModal from './components/RandomDrawModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [pendingBox, setPendingBox] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [drawnBox, setDrawnBox] = useState(null);
  const [drawLoading, setDrawLoading] = useState(false);
  const [drawError, setDrawError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Check auth & fetch challenge on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data.user);
      await fetchChallenge();
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenge = async () => {
    try {
      const res = await fetch('/api/challenge');
      if (!res.ok) return;
      const data = await res.json();
      setChallenge(data.challenge);
      setBoxes(data.boxes || []);
      setPendingBox(data.pendingBox);
    } catch (err) {
      console.error('Error fetching challenge:', err);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    fetchChallenge();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setChallenge(null);
    setBoxes([]);
    setPendingBox(null);
  };

  // Open Random Draw Modal & Pick Initial Random Box
  const handleOpenRandomModal = async () => {
    setIsRandomModalOpen(true);
    setDrawError('');
    await drawRandomBox();
  };

  const drawRandomBox = async (excludeBoxId = null) => {
    setDrawLoading(true);
    setDrawError('');
    try {
      const res = await fetch('/api/challenge/random-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeBoxId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر سحب رقم عشوائي');
      }
      setDrawnBox(data.box);
    } catch (err) {
      setDrawError(err.message);
    } finally {
      setDrawLoading(false);
    }
  };

  // User selects "أستطيع التحويل" in Random Draw Modal
  const handleAcceptTransfer = async (box) => {
    try {
      const res = await fetch('/api/challenge/accept-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId: box.id }),
      });
      if (res.ok) {
        setIsRandomModalOpen(false);
        setDrawnBox(null);
        await fetchChallenge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User selects "لا أستطيع الان" (Draw another box)
  const handleRejectTransfer = async (currentBoxId) => {
    await drawRandomBox(currentBoxId);
  };

  // User clicks "تم تحويل المبلغ" on Pending Reminder Banner
  const handleConfirmTransfer = async () => {
    try {
      const res = await fetch('/api/challenge/confirm-transfer', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchChallenge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Manual Box Toggle
  const handleToggleBox = async (boxId) => {
    try {
      const res = await fetch('/api/challenge/toggle-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId }),
      });
      if (res.ok) {
        await fetchChallenge();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Challenge
  const handleResetChallenge = async () => {
    try {
      await fetch('/api/challenge/reset', { method: 'POST' });
      setChallenge(null);
      setBoxes([]);
      setPendingBox(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered and Searched boxes
  const filteredBoxes = boxes.filter((box) => {
    // Status filter
    if (filter === 'pending' && box.status !== 'pending') return false;
    if (filter === 'completed' && box.status !== 'completed') return false;

    // Search query filter (matches box_number or amount)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = box.box_number.toString().includes(q);
      const matchAmt = box.amount.toString().includes(q);
      return matchNum || matchAmt;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-bold">جاري تحميل صندوق التوفير الذكي...</p>
        </div>
      </div>
    );
  }

  // Not Logged In -> Show Auth
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged In but No Active Challenge -> Show Wizard
  if (!challenge) {
    return <OnboardingWizard onComplete={fetchChallenge} />;
  }

  // Active Challenge -> Show Main App Layout
  return (
    <div className="min-h-screen pb-16 pt-4 px-4 sm:px-6 max-w-6xl mx-auto space-y-6">
      {/* Top Dashboard Header & Stats */}
      <Dashboard
        user={user}
        challenge={challenge}
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenRandomModal={handleOpenRandomModal}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Pinned Reminder Banner if Pending Transfer Exists */}
      <PendingReminderBanner
        pendingBox={pendingBox}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* Saving Box Grid */}
      <BoxGrid
        boxes={filteredBoxes}
        pendingBox={pendingBox}
        onToggleBox={handleToggleBox}
      />

      {/* Modals */}
      <RandomDrawModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        drawnBox={drawnBox}
        loading={drawLoading}
        error={drawError}
        onDraw={drawRandomBox}
        onAcceptTransfer={handleAcceptTransfer}
        onRejectTransfer={handleRejectTransfer}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onResetChallenge={handleResetChallenge}
        onLogout={handleLogout}
      />
    </div>
  );
}
