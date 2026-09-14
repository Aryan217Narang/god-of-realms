import { useState, useCallback, useEffect } from 'react';
import type { SubjectId } from './types';
import { useStore } from './store/useStore';
import { useAuth } from './store/useAuth';
import { Navigation, type Page } from './components/layout/Navigation';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPortal } from './pages/AuthPortal';
import { Dashboard } from './pages/Dashboard';
import { MyRealms } from './pages/MyRealms';
import { StudyTimer } from './pages/StudyTimer';
import { Statistics } from './pages/Statistics';
import { Achievements } from './pages/Achievements';
import { Settings } from './pages/Settings';
import { RealmDetail } from './pages/RealmDetail';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { FloatingMiniTimer } from './components/timer/FloatingMiniTimer';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [realmDetailId, setRealmDetailId] = useState<SubjectId | null>(null);
  const [timerSelectedSubject, setTimerSelectedSubject] = useState<SubjectId>('daa');
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showMiniTimer, setShowMiniTimer] = useState(false);

  const auth = useAuth();

  const {
    state,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startBreak,
    completeSession,
    getElapsedMs,
    getRemainingMs,
    updateSettings,
    resetAllData,
    exportData,
    importData,
  } = useStore(auth.user?.id);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.settings.theme);
    root.classList.remove('theme-pink', 'theme-dark', 'theme-white');
    root.classList.add(`theme-${state.settings.theme}`);
    document.body.className = `theme-${state.settings.theme}`;
  }, [state.settings.theme]);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const navigate = useCallback((page: Page, extra?: string) => {
    setCurrentPage(page);
    if (page === 'realm-detail' && extra) {
      setRealmDetailId(extra as SubjectId);
    }
  }, []);

  const handleStartStudy = useCallback((subjectId: SubjectId) => {
    setTimerSelectedSubject(subjectId);
    setCurrentPage('timer');
  }, []);

  const handleStartTimer = useCallback((subjectId: SubjectId, buildTarget?: string) => {
    startTimer(subjectId, buildTarget);
    if (buildTarget) {
      addToast(`🔨 Began expedition: "${buildTarget}" in ${state.subjects[subjectId].shortName}!`);
    }
  }, [startTimer, state.subjects, addToast]);

  const handleComplete = useCallback((minutes: number) => {
    const subjectId = state.timer.selectedSubject;
    if (!subjectId) return;
    const project = state.timer.currentBuildTarget;
    completeSession(minutes);
    const msg = project
      ? `🎉 Project Completed! "${project}" placed in ${state.subjects[subjectId].shortName}!`
      : `🎉 Session complete! +${minutes}m added to ${state.subjects[subjectId].shortName}!`;
    addToast(msg);
  }, [completeSession, state.timer.selectedSubject, state.timer.currentBuildTarget, state.subjects, addToast]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            state={state}
            onNavigate={navigate}
            onStartStudy={handleStartStudy}
          />
        );
      case 'realms':
        return (
          <MyRealms
            state={state}
            onNavigate={navigate}
            onStartStudy={handleStartStudy}
          />
        );
      case 'timer':
        return (
          <StudyTimer
            state={state}
            initialSubjectId={timerSelectedSubject}
            onStartTimer={handleStartTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
            onComplete={handleComplete}
            onStartBreak={startBreak}
            getElapsedMs={getElapsedMs}
            getRemainingMs={getRemainingMs}
            showMiniTimer={showMiniTimer}
            onToggleMiniTimer={() => setShowMiniTimer(prev => !prev)}
          />
        );
      case 'statistics':
        return <Statistics state={state} />;
      case 'achievements':
        return <Achievements state={state} />;
      case 'settings':
        return (
          <Settings
            state={state}
            onUpdateSettings={updateSettings}
            onResetData={resetAllData}
            onExportData={exportData}
            onImportData={importData}
          />
        );
      case 'realm-detail':
        return realmDetailId ? (
          <RealmDetail
            state={state}
            subjectId={realmDetailId}
            onNavigate={navigate}
            onStartStudy={handleStartStudy}
          />
        ) : null;
      default:
        return null;
    }
  };

  const handleLogout = useCallback(() => {
    auth.logout();
    setIsGuestMode(false);
    addToast('👋 Adventurer session closed. Progress securely preserved.');
  }, [auth, addToast]);

  // Dedicated Startup Authentication Page
  if (!auth.isAuthenticated && !isGuestMode) {
    return (
      <div className={`theme-${state.settings.theme}`}>
        <AuthPortal
          onLogin={auth.login}
          onRegister={auth.register}
          onContinueAsGuest={() => setIsGuestMode(true)}
          onSuccessToast={addToast}
          currentTheme={state.settings.theme}
          onSelectTheme={(th) => updateSettings({ theme: th })}
        />
        {/* Toast notifications */}
        <div className="fixed bottom-6 right-4 z-50 space-y-2 pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="toast px-4 py-2.5 rounded bg-white border-2 border-pink-400 text-pink-700 text-xs font-pixel shadow-[3px_3px_0px_#f472b6] max-w-xs pointer-events-auto animate-fade-up font-bold"
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen bg-[#fff5f8] text-slate-900 relative">
      {/* Top Right Theme Selector: Pink, Dark, White */}
      <ThemeToggle
        currentTheme={state.settings.theme}
        onSelectTheme={(th) => updateSettings({ theme: th })}
      />

      <Navigation
        currentPage={currentPage}
        onNavigate={navigate}
        user={auth.user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <main className="flex-1 min-w-0 w-full min-h-screen pb-20 md:pb-0 overflow-x-hidden bg-[#fff5f8] flex flex-col">
        {renderPage()}
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast px-4 py-2.5 rounded bg-white border-2 border-pink-400 text-pink-700 text-xs font-pixel shadow-[3px_3px_0px_#f472b6] max-w-xs pointer-events-auto animate-fade-up font-bold"
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Active timer indicator & Mini Clock launcher */}
      {state.timer.isRunning && currentPage !== 'timer' && (
        <div className="fixed bottom-24 md:bottom-6 left-4 z-50 flex items-center gap-2">
          <div
            className="cursor-pointer bg-pink-500 text-white border-2 border-pink-600 px-3.5 py-2 rounded font-pixel text-xs flex items-center gap-2 shadow-[3px_3px_0px_#f472b6] animate-pulse"
            onClick={() => navigate('timer')}
          >
            <span>●</span>
            {state.timer.isPaused ? 'PAUSED' : 'FOCUS STUDYING'} — Click to view
          </div>
          {!showMiniTimer && (
            <button
              type="button"
              onClick={() => setShowMiniTimer(true)}
              className="bg-slate-800 text-amber-300 border-2 border-amber-400 px-2.5 py-2 rounded font-pixel text-xs flex items-center gap-1 shadow-[2px_2px_0px_#78350f] cursor-pointer hover:bg-slate-700 transition-colors"
              title="Open Clock App mini popup in top right"
            >
              ⏱️ Pop up
            </button>
          )}
        </div>
      )}

      {/* Floating Clock App Mini Timer Widget (Top-Right) */}
      {showMiniTimer && (
        <FloatingMiniTimer
          state={state}
          onPause={pauseTimer}
          onResume={resumeTimer}
          onReset={resetTimer}
          onNavigateToTimer={() => navigate('timer')}
          onClose={() => setShowMiniTimer(false)}
          getRemainingMs={getRemainingMs}
        />
      )}

      {/* JWT Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={auth.login}
        onRegister={auth.register}
        onSuccessToast={addToast}
      />
    </div>
  );
}

