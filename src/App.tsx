import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ViewState } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';
import { CropsView } from './components/CropsView';
import { CropDetailView } from './components/CropDetailView';
import { ScanView } from './components/ScanView';
import { AiAssistantView } from './components/AiAssistantView';
import { AiAgentView } from './components/AiAgentView';
import { RiskIntelligenceView } from './components/RiskIntelligenceView';
import { ReportsView } from './components/ReportsView';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { AddCropModal } from './components/AddCropModal';
import { ScanComparisonModal } from './components/ScanComparisonModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Sprout } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, googleLogin } = useAuth();
  const { isRestoring } = useData();
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedCropId, setSelectedCropId] = useState<string>('');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<{ prevId: string; currId: string } | null>(null);

  // Sync initial view with auth state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user && !user.onboarded && !isRestoring) {
          setIsOnboardingOpen(true);
        }
        if (currentView === 'landing') {
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('landing');
      }
    }
  }, [isAuthenticated, isLoading, isRestoring, user]);

  // Global Cmd+K / Ctrl+K keyboard shortcut for Search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setCurrentView('crop-detail');
  };

  const handleScanThisCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setCurrentView('scan');
  };

  const handleRunAgent = (cropId: string) => {
    setSelectedCropId(cropId);
    setCurrentView('agent');
  };

  const handleGenerateReport = (cropId: string) => {
    setSelectedCropId(cropId);
    setCurrentView('reports');
  };

  const handleCompareScans = (prevId: string, currId: string) => {
    setComparisonIds({ prevId, currId });
  };

  // Demo flow from Landing Page
  const handleExploreDemo = async () => {
    if (!isAuthenticated) {
      await googleLogin();
    }
    setCurrentView('dashboard');
  };

  if (isAuthenticated && (isLoading || isRestoring)) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white shadow-xl shadow-[#1B4332]/20 animate-pulse">
            <Sprout className="w-8 h-8 text-[#74C69D]" />
          </div>
          <div
            className="absolute -inset-2 rounded-3xl border border-[#2D6A4F]/30 animate-spin"
            style={{ animationDuration: '3s' }}
          />
        </div>
        <h2 className="font-outfit text-2xl font-bold text-[#132A13] tracking-tight">
          Restoring your crop intelligence...
        </h2>
        <p className="text-sm text-[#2D6A4F] mt-2 max-w-sm">
          Loading your verified field telemetry, health timelines, and agronomic memory from Cloud Firestore.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#132A13] flex flex-col font-sans antialiased selection:bg-[#D8F3DC] selection:text-[#1B4332]">
      {/* Top Navigation - persistent full-width bar for app views */}
      {(currentView !== 'landing' || isAuthenticated) && (
        <Navbar
          currentView={currentView}
          onNavigate={setCurrentView}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Main Container */}
      {currentView === 'landing' && !isAuthenticated ? (
        <LandingPage
          onGetStarted={() => setIsAuthOpen(true)}
          onSignIn={() => setIsAuthOpen(true)}
          onExploreDemo={handleExploreDemo}
          onNavigate={setCurrentView}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Persistent AgriTech Sidebar */}
          <Sidebar currentView={currentView} onNavigate={setCurrentView} />

          {/* Main Viewport Content Area */}
          <main className="flex-1 w-full overflow-y-auto overflow-x-hidden pb-32 sm:pb-36 lg:pb-8">
            {currentView === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentView}
                onSelectCrop={handleSelectCrop}
                onOpenAddCrop={() => setIsAddCropOpen(true)}
              />
            )}

            {currentView === 'crops' && (
              <CropsView
                onSelectCrop={handleSelectCrop}
                onOpenAddCrop={() => setIsAddCropOpen(true)}
              />
            )}

            {currentView === 'crop-detail' && (
              <CropDetailView
                cropId={selectedCropId}
                onBack={() => setCurrentView('crops')}
                onNavigate={setCurrentView}
                onScanThisCrop={handleScanThisCrop}
                onCompareScans={handleCompareScans}
                onRunAgent={handleRunAgent}
                onGenerateReport={handleGenerateReport}
              />
            )}

            {currentView === 'scan' && (
              <ScanView
                preselectedCropId={selectedCropId}
                onNavigate={setCurrentView}
                onScanSaved={cropId => {
                  setSelectedCropId(cropId);
                  setCurrentView('crop-detail');
                }}
                onOpenAddCrop={() => setIsAddCropOpen(true)}
              />
            )}

            {currentView === 'assistant' && (
              <AiAssistantView preselectedCropId={selectedCropId} />
            )}

            {currentView === 'agent' && (
              <AiAgentView
                preselectedCropId={selectedCropId}
                onNavigate={setCurrentView}
                onSelectCrop={handleSelectCrop}
                onCompareScans={handleCompareScans}
                onGenerateReport={handleGenerateReport}
              />
            )}

            {currentView === 'risks' && (
              <RiskIntelligenceView
                onNavigate={setCurrentView}
                onSelectCrop={handleSelectCrop}
                onScanCrop={handleScanThisCrop}
              />
            )}

            {currentView === 'reports' && (
              <ReportsView
                onNavigate={setCurrentView}
                onSelectCrop={handleSelectCrop}
                preselectedCropId={selectedCropId}
              />
            )}
          </main>
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          setCurrentView('dashboard');
        }}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setCurrentView('dashboard');
        }}
      />

      <AddCropModal
        isOpen={isAddCropOpen}
        onClose={() => setIsAddCropOpen(false)}
        onCropAdded={newId => {
          setSelectedCropId(newId);
          setCurrentView('crop-detail');
        }}
      />

      {comparisonIds && (
        <ScanComparisonModal
          isOpen={!!comparisonIds}
          onClose={() => setComparisonIds(null)}
          previousScanId={comparisonIds.prevId}
          currentScanId={comparisonIds.currId}
        />
      )}

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCrop={handleSelectCrop}
        onNavigate={setCurrentView}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
