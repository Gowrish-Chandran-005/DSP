/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ViewMode, BurnoutMetrics, UserSession } from './types';
import { INITIAL_METRICS } from './data/mockData';
import { checkBackendHealth } from './services/api';
import { Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssessmentView } from './components/AssessmentView';
import { InsightsView } from './components/InsightsView';
import { TrendsView } from './components/TrendsView';
import { EmotionLabView } from './components/EmotionLabView';
import { HistoryView } from './components/HistoryView';
import { LoginView } from './components/LoginView';
import { FocusMonitorView } from './components/FocusMonitorView';
import { ProfileView } from './components/ProfileView';
import { OnboardingModal } from './components/OnboardingModal';
import { CampusSanctuaryModal } from './components/CampusSanctuaryModal';
import { PrivacyProtocolModal } from './components/PrivacyProtocolModal';
import { CampusCareModal } from './components/CampusCareModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [metrics, setMetrics] = useState<BurnoutMetrics>(INITIAL_METRICS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // User session state (hydrated from localStorage)
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('calma_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // LocalStorage access restricted or unavailable
    }
    return null;
  });

  // Onboarding & Informed consent status
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Modals
  const [isSanctuaryOpen, setIsSanctuaryOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCampusCareOpen, setIsCampusCareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 4000);
  };

  // Check backend health periodically
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const { online } = await checkBackendHealth();
      if (isMounted) setBackendOnline(online);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Check whether onboarding consent is needed after login
  useEffect(() => {
    if (userSession) {
      try {
        const consent = localStorage.getItem('calma_informed_consent');
        if (consent !== 'true') {
          setShowOnboarding(true);
        }
      } catch {
        // Ignore
      }
    }
  }, [userSession]);

  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    setCurrentView('dashboard');
    showToast(`Welcome, ${session.name.split(' ')[0]}. Here is your latest well-being overview.`);
  };

  const handleLogout = () => {
    setUserSession(null);
    try {
      localStorage.removeItem('calma_session');
    } catch {
      // Ignore
    }
    setCurrentView('login');
    showToast('You have safely signed out.');
  };

  const handleUpdateMetrics = (partial: Partial<BurnoutMetrics>) => {
    setMetrics((prev) => ({ ...prev, ...partial }));
  };

  const handleClearData = () => {
    setMetrics(INITIAL_METRICS);
    showToast('Your assessment metrics have been reset to the default baseline.');
  };

  return (
    <div className="min-h-screen bg-[#FAFDFB] font-body-md text-[#0c1f18] relative overflow-x-hidden selection:bg-[#cde9db] selection:text-[#003b1b]">
      {/* Dynamic Biophilic Ambient Backgrounds */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vw] rounded-full bg-[#E9F7EF]/80 blur-[130px]"></div>
        <div className="absolute top-[18%] -right-[12%] w-[58vw] h-[58vw] rounded-full bg-[#D8F3F0]/70 blur-[140px]"></div>
        <div className="absolute top-[52%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-[#CFEBDD]/60 blur-[150px]"></div>
        <div className="absolute -bottom-[15%] right-[20%] w-[55vw] h-[55vw] rounded-full bg-[#E9F7EF]/85 blur-[130px]"></div>
      </div>

      {/* Conditional Rendering: Login Page or Main Portal */}
      {!userSession || currentView === 'login' ? (
        <LoginView
          onLogin={handleLogin}
          onExploreDemo={() => {
            handleLogin({
              name: 'Maya Lin',
              email: 'maya.lin@campus.edu',
              studentId: 'STU-78429',
              term: 'Spring Semester',
            });
          }}
        />
      ) : (
        <>
          {/* Navigation Rail */}
          <Navigation
            currentView={currentView}
            onNavigate={(view) => {
              if (view === 'settings') {
                setIsSettingsOpen(true);
              } else {
                setCurrentView(view);
              }
            }}
            onOpenHelp={() => setIsCampusCareOpen(true)}
          />

          {/* Main Layout Area */}
          <div className="pl-28 md:pl-32 pr-6 md:pr-10 lg:pr-12">
            {/* Header */}
            <Header
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenProfile={() => setCurrentView('profile')}
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                const query = q.toLowerCase();
                if (query.includes('assess') || query.includes('check') || query.includes('question')) {
                  setCurrentView('assessment');
                } else if (query.includes('focus') || query.includes('monitor') || query.includes('study') || query.includes('camera')) {
                  setCurrentView('focus-monitor');
                } else if (query.includes('insight') || query.includes('factor') || query.includes('shap')) {
                  setCurrentView('insights');
                } else if (query.includes('trend') || query.includes('progress') || query.includes('chart')) {
                  setCurrentView('trends');
                } else if (query.includes('history') || query.includes('record') || query.includes('log')) {
                  setCurrentView('history');
                } else if (query.includes('profile') || query.includes('academic') || query.includes('vtop')) {
                  setCurrentView('profile');
                }
              }}
              user={userSession}
              onLogout={handleLogout}
              backendOnline={backendOnline}
            />

            {/* Main Content Router */}
            <main className="relative pt-28 pb-24 max-w-[1360px] mx-auto min-h-screen">
              {currentView === 'dashboard' && (
                <DashboardView
                  metrics={metrics}
                  onNavigate={setCurrentView}
                  onOpenSanctuary={() => setIsSanctuaryOpen(true)}
                  onOpenPrivacy={() => setIsPrivacyOpen(true)}
                  onOpenHelp={() => setIsCampusCareOpen(true)}
                />
              )}

              {currentView === 'assessment' && (
                <AssessmentView
                  metrics={metrics}
                  onUpdateMetrics={handleUpdateMetrics}
                  onNavigate={setCurrentView}
                  onShowToast={showToast}
                />
              )}

              {currentView === 'focus-monitor' && (
                <FocusMonitorView
                  onSessionCompleted={(session) => {
                    setMetrics((prev) => ({ ...prev, latestStudySession: session }));
                  }}
                  onNavigate={setCurrentView}
                  onShowToast={showToast}
                />
              )}

              {currentView === 'insights' && (
                <InsightsView
                  metrics={metrics}
                  onOpenCampusCare={() => setIsCampusCareOpen(true)}
                  onOpenModelDocs={() => setIsPrivacyOpen(true)}
                  onShowToast={showToast}
                />
              )}

              {currentView === 'trends' && <TrendsView metrics={metrics} />}

              {currentView === 'emotion-lab' && <EmotionLabView />}

              {currentView === 'history' && <HistoryView onShowToast={showToast} />}

              {currentView === 'profile' && (
                <ProfileView
                  user={userSession}
                  onUpdateSession={(updated) => {
                    setUserSession((prev) => {
                      if (!prev) return null;
                      const next = { ...prev, ...updated };
                      try {
                        localStorage.setItem('calma_session', JSON.stringify(next));
                      } catch {}
                      return next;
                    });
                  }}
                  onNavigate={setCurrentView}
                  onShowToast={showToast}
                />
              )}
            </main>
          </div>
        </>
      )}

      {/* Onboarding & Informed Consent Modal */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onConsentGiven={() => {
            setShowOnboarding(false);
            showToast('Thank you. Your informed consent has been noted.');
          }}
        />
      )}

      {/* Modals */}
      {isSanctuaryOpen && (
        <CampusSanctuaryModal onClose={() => setIsSanctuaryOpen(false)} />
      )}

      {isPrivacyOpen && (
        <PrivacyProtocolModal onClose={() => setIsPrivacyOpen(false)} />
      )}

      {isCampusCareOpen && (
        <CampusCareModal onClose={() => setIsCampusCareOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onClearData={handleClearData}
          onShowToast={showToast}
        />
      )}

      {/* Floating Gentle Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#14532d] text-white text-xs font-medium shadow-xl border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <span className="material-symbols-outlined text-[17px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 p-0.5 cursor-pointer"
            aria-label="Dismiss toast"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
