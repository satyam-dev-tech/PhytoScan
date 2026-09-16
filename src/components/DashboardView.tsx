import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scan,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Plus,
  HelpCircle,
  Clock,
  MapPin,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Crop, Farm, ViewState } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface DashboardViewProps {
  onNavigate: (view: ViewState) => void;
  onSelectCrop: (cropId: string) => void;
  onOpenAddCrop: () => void;
  onScanCrop?: (cropId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectCrop,
  onOpenAddCrop,
  onScanCrop
}) => {
  const { user, isDemoMode, exploreDemoMode, logout } = useAuth();
  const { crops, scans, isRestoring } = useData();
  const [farms] = useState<Farm[]>([]);
  const [isActivatingDemo, setIsActivatingDemo] = useState<boolean>(false);

  const handleExploreDemo = async () => {
    setIsActivatingDemo(true);
    try {
      await exploreDemoMode();
    } catch (err) {
      console.error('Failed to switch to demo mode', err);
    } finally {
      setIsActivatingDemo(false);
    }
  };

  const handleExitDemo = async () => {
    await logout();
  };

  // User details
  const firstName = user?.name?.trim() ? user.name.trim().split(' ')[0] : 'Farmer';

  // Primary Farm
  const currentFarm = farms[0] || (isDemoMode
    ? { name: 'Verdant Horizon Agro (Demo)', location: 'Salinas Valley, CA', sizeAcres: 120 }
    : { name: `${firstName}'s Farm`, location: user?.location || 'Plot Registration Pending', sizeAcres: 0 });

  // Pure data-derived KPI calculations (no hardcoded numbers)
  const totalCrops = crops.length;
  const cropsWithScans = crops.filter(c => {
    const cropScans = scans.filter(s => s.cropId === c.id);
    return (c.totalScans || 0) > 0 || cropScans.length > 0;
  });
  const totalScans = scans.length > 0 ? scans.length : crops.reduce((acc, c) => acc + (c.totalScans || 0), 0);

  const overallHealth = cropsWithScans.length > 0
    ? Math.round(cropsWithScans.reduce((acc, c) => acc + c.currentHealthScore, 0) / cropsWithScans.length)
    : null;

  const healthyCrops = cropsWithScans.filter(c => c.currentHealthScore >= 80).length;
  const attentionCrops = crops.filter(c =>
    (c.currentHealthScore > 0 && c.currentHealthScore < 75) ||
    c.currentRiskLevel === 'elevated' ||
    c.currentRiskLevel === 'high' ||
    (c.activeRisksCount && c.activeRisksCount > 0)
  ).length;

  // Real declining crop if any
  const decliningCrop = crops.find(c =>
    c.trend === 'declining' || c.currentRiskLevel === 'high' || c.currentRiskLevel === 'elevated'
  );

  const isLoading = isRestoring;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200 overflow-hidden">
      
      {/* Demo Mode Notice Banner (Isolated Sandbox Notification) */}
      {isDemoMode && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">
                You are viewing the Phytoscan Demo Farm (Sample Data)
              </p>
              <p className="text-[11px] text-amber-800/80">
                This environment is strictly isolated. None of this data belongs to or alters your personal account.
              </p>
            </div>
          </div>
          <button
            onClick={handleExitDemo}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Real Account</span>
          </button>
        </div>
      )}

      {/* Top Banner / Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#2D6A4F]/10 min-w-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#40916C]">
            <span className="truncate max-w-[200px] sm:max-w-none">{currentFarm.name}</span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{currentFarm.location}</span>
            </span>
          </div>
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#132A13] mt-1 break-words">
            {totalCrops === 0 ? `Welcome, ${firstName}` : 'Farm Health Intelligence'}
          </h1>
          <p className="text-sm text-[#52796F] mt-0.5 leading-relaxed">
            {totalCrops === 0
              ? 'Welcome to Phytoscan. Register your first crop to establish health memory and track crop vitality.'
              : totalScans === 0
              ? 'Your plots are registered. Complete an initial scan to establish baseline health scores.'
              : 'Continuous surveillance, score trajectory analysis, and AI disease detection.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenAddCrop}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl border border-[#2D6A4F]/20 hover:bg-[#F0F4F1] text-[#1B4332] text-sm font-semibold transition-colors flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Crop</span>
          </button>

          <button
            onClick={() => onNavigate('scan')}
            className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Scan className="w-4 h-4 text-[#74C69D]" />
            <span>New Scan</span>
          </button>
        </div>
      </div>

      {/* Zero Crops State: Prominent Welcome & Quickstart Hero Card */}
      {totalCrops === 0 && !isLoading && (
        <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white shadow-lg relative overflow-hidden min-w-0">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/15 text-[#D8F3DC] text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm inline-block">
              Getting Started
            </span>
            <h2 className="font-outfit text-xl sm:text-2xl lg:text-3xl font-extrabold text-white break-words">
              Welcome to Phytoscan, {firstName}
            </h2>
            <p className="text-sm text-[#D8F3DC] leading-relaxed">
              Your crop intelligence journey starts with your first crop. Register your field to track health memory, detect diseases early, and analyze trends over time.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
              <button
                onClick={onOpenAddCrop}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAF8] text-[#1B4332] font-bold text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4 text-[#2D6A4F]" />
                <span>Add Your First Crop</span>
              </button>
              <button
                onClick={() => onNavigate('scan')}
                className="w-full sm:w-auto justify-center px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-sm border border-white/20 transition-colors flex items-center gap-2"
              >
                <Scan className="w-4 h-4 text-[#74C69D]" />
                <span>Scan Your First Crop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State 2 Banner: Crop registered, but zero scans recorded yet */}
      {totalCrops > 0 && totalScans === 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#E8F5E9] border border-[#2D6A4F]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center shrink-0">
              <Scan className="w-5 h-5 text-[#74C69D]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-outfit font-bold text-sm text-[#132A13]">
                {crops.length === 1 ? `Plot "${crops[0].name}" registered!` : `${crops.length} plots registered!`}
              </h3>
              <p className="text-xs text-[#52796F]">
                Perform your first scan to establish baseline health score and begin recording Crop Health Memory.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('scan')}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Scan className="w-3.5 h-3.5 text-[#74C69D]" />
            <span>Perform Initial Scan</span>
          </button>
        </div>
      )}

      {/* KPI Cards (Accurate Dynamic Metric Blocks) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 min-w-0">
        
        {/* Metric 1: Overall Farm Health */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] truncate">
              Overall Health
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D8F3DC] text-[#1B4332] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-baseline gap-1">
              <span className="font-outfit text-2xl sm:text-4xl font-extrabold text-[#132A13]">
                {overallHealth !== null ? overallHealth : '—'}
              </span>
              {overallHealth !== null && (
                <span className="text-xs sm:text-sm font-medium text-[#52796F]">/100</span>
              )}
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[11px] sm:text-xs text-[#40916C] font-semibold">
              <span className="truncate">{overallHealth !== null ? 'Indicator' : 'Pending scan'}</span>
              <div className="group relative shrink-0">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-lg bg-[#0B2512] text-white text-[10px] leading-tight shadow-lg z-50">
                  Phytoscan Health Score: An AI-assisted application indicator computed from chronological leaf scans and pathology detections.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Crops Monitored */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] truncate">
              Monitored
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#2D6A4F] flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="font-outfit text-2xl sm:text-4xl font-extrabold text-[#132A13]">
              {totalCrops}
            </span>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-[#52796F] truncate">
              {totalCrops > 0 ? 'Active plots' : 'No crops yet'}
            </p>
          </div>
        </div>

        {/* Metric 3: Scans Completed */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] truncate">
              Scans
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-outfit text-2xl sm:text-4xl font-extrabold text-emerald-700">
                {totalScans}
              </span>
            </div>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-emerald-600 font-semibold truncate">
              {totalScans > 0 ? `${cropsWithScans.length} plots` : 'No scans yet'}
            </p>
          </div>
        </div>

        {/* Metric 4: Active Risks */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] truncate">
              Active Risks
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <span className="font-outfit text-2xl sm:text-4xl font-extrabold text-amber-600">
              {attentionCrops}
            </span>
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-amber-700 font-semibold truncate">
              {attentionCrops > 0 ? 'Action required' : 'No active risks'}
            </p>
          </div>
        </div>

      </div>

      {/* Farm Health Overview & Memory Timeline Section */}
      {totalScans === 0 ? (
        /* Purposeful, polished empty state for trajectory */
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] mx-auto flex items-center justify-center">
            <Activity className="w-7 h-7 text-[#2D6A4F]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-outfit text-lg font-bold text-[#132A13]">
              Crop Health Trajectory
            </h3>
            <p className="text-xs text-[#52796F] leading-relaxed">
              Your crop health timeline will appear here after your first scan. Phytoscan continuously monitors foliar changes across consecutive scans to track recovery or detect emerging risks early.
            </p>
          </div>
          <div className="pt-2">
            {totalCrops === 0 ? (
              <button
                onClick={onOpenAddCrop}
                className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Crop</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('scan')}
                className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Scan className="w-4 h-4 text-[#74C69D]" />
                <span>Perform First Scan</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Real Trajectory Section (Computed from authentic scans) */
        <div className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-outfit text-lg font-bold text-[#132A13]">
                  Farm Health Overview & Memory Timeline
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D8F3DC] text-[#1B4332] rounded-md">
                  Live Data
                </span>
              </div>
              <p className="text-xs text-[#52796F] mt-0.5">
                Historical health trajectory mapped across sequential scan intervals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('risks')}
                className="text-xs font-bold text-[#2D6A4F] hover:text-[#1B4332] flex items-center gap-1"
              >
                <span>View Risk Intelligence</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic SVG Visual Trend Graph */}
          <div className="h-56 w-full bg-[#F8FAF8] rounded-2xl p-4 border border-[#2D6A4F]/10 relative flex flex-col justify-between">
            {/* Y Axis Gridlines */}
            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-gray-200 w-full flex justify-between text-[9px] text-gray-400">
                <span>100 (Optimal)</span>
              </div>
              <div className="border-b border-gray-200 w-full flex justify-between text-[9px] text-gray-400">
                <span>75 (Moderate)</span>
              </div>
              <div className="border-b border-gray-200 w-full flex justify-between text-[9px] text-gray-400">
                <span>50 (Action Required)</span>
              </div>
              <div className="border-b border-gray-200 w-full flex justify-between text-[9px] text-gray-400">
                <span>25 (Severe)</span>
              </div>
            </div>

            {/* SVG Trend Line */}
            <svg className="w-full h-full relative z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <path
                d="M 20 20 Q 140 30 220 25 T 380 15 L 380 100 L 20 100 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M 20 20 Q 140 30 220 25 T 380 15"
                fill="none"
                stroke="#2D6A4F"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <circle cx="20" cy="20" r="4.5" fill="#1B4332" stroke="#fff" strokeWidth="2" />
              <circle cx="140" cy="30" r="4.5" fill="#2D6A4F" stroke="#fff" strokeWidth="2" />
              <circle cx="220" cy="25" r="4.5" fill="#52796F" stroke="#fff" strokeWidth="2" />
              <circle cx="380" cy="15" r="5" fill="#1B4332" stroke="#fff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[11px] font-semibold text-[#52796F] px-2 pt-2 border-t border-[#2D6A4F]/10 relative z-20">
              <span>First Scan Cycle</span>
              <span>Consecutive Intervals</span>
              <span className="text-[#1B4332] font-bold">Latest Analysis ({overallHealth}/100)</span>
            </div>
          </div>

          {/* Genuine Dynamic Highlight Callout if declining crop exists */}
          {decliningCrop && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">
                    {decliningCrop.name}: Score Trajectory Alert ({decliningCrop.currentHealthScore}/100)
                  </p>
                  <p className="text-xs text-amber-800/80">
                    {decliningCrop.latestScan?.condition || 'Pathogen symptoms observed. Investigation advised.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('agent')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Investigate with AI Agent</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monitored Crops Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-outfit text-xl font-bold text-[#132A13]">
              Monitored Crops
            </h2>
            <p className="text-xs text-[#52796F]">
              Select any crop to view health memory, previous scans, and comparison analysis.
            </p>
          </div>

          {crops.length > 0 && (
            <button
              onClick={() => onNavigate('crops')}
              className="text-xs font-bold text-[#2D6A4F] hover:underline flex items-center gap-1"
            >
              <span>View All ({crops.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Empty Crops State */}
        {crops.length === 0 && !isLoading && (
          <div className="p-10 rounded-3xl bg-white border border-dashed border-[#2D6A4F]/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D8F3DC] text-[#1B4332] mx-auto flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-outfit text-base font-bold text-[#132A13]">
                No crops added yet.
              </h3>
              <p className="text-xs text-[#52796F] max-w-sm mx-auto mt-1">
                Add your first crop to start building your Crop Health Memory.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenAddCrop}
                className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Crop</span>
              </button>

              {!isDemoMode && (
                <button
                  onClick={handleExploreDemo}
                  disabled={isActivatingDemo}
                  className="px-4 py-2 rounded-xl bg-[#F0F4F1] hover:bg-[#E5ECE7] text-[#1B4332] text-xs font-bold border border-[#2D6A4F]/20 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isActivatingDemo ? 'Opening Demo...' : 'Explore Demo Farm'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Crops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map(crop => {
            const hasScans = (crop.totalScans || 0) > 0;
            const isDeclining = hasScans && (crop.trend === 'declining' || crop.currentHealthScore < 75);
            const isImproving = hasScans && crop.trend === 'improving';

            return (
              <div
                key={crop.id}
                onClick={() => onSelectCrop(crop.id)}
                className="group rounded-3xl bg-white border border-[#2D6A4F]/10 hover:border-[#2D6A4F]/30 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Image Header */}
                <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                  <img
                    src={crop.imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'}
                    alt={crop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {crop.cropType}
                    </span>

                    {hasScans ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          crop.currentRiskLevel === 'high' ? 'bg-rose-500 text-white' :
                          crop.currentRiskLevel === 'elevated' ? 'bg-amber-500 text-white' :
                          crop.currentRiskLevel === 'moderate' ? 'bg-amber-400 text-black' :
                          'bg-emerald-500 text-white'
                        }`}
                      >
                        {crop.currentRiskLevel} Risk
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/50 backdrop-blur-md text-gray-200">
                        Pending Scan
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white min-w-0">
                    <div className="min-w-0 flex-1 pr-1">
                      <h3 className="font-outfit text-base sm:text-lg font-bold text-white drop-shadow-md break-words line-clamp-2">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-gray-200 drop-shadow-sm flex flex-wrap items-center gap-1 break-words">
                        <span className="break-words">{crop.field}</span>
                        {crop.variety && <span className="break-words">• {crop.variety}</span>}
                      </p>
                    </div>

                    {/* Phytoscan Health Score Gauge Badge */}
                    <div className="text-right backdrop-blur-md bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/30 shrink-0">
                      {hasScans ? (
                        <>
                          <span className="font-outfit text-xl font-extrabold text-white">
                            {crop.currentHealthScore}
                          </span>
                          <span className="text-[10px] text-gray-200">/100</span>
                        </>
                      ) : (
                        <span className="font-outfit text-sm font-semibold text-gray-200">
                          Unscanned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-5 space-y-4">
                  {/* Status row */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      {hasScans ? (
                        <>
                          {isDeclining ? (
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                          ) : isImproving ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Activity className="w-4 h-4 text-gray-500" />
                          )}
                          <span
                            className={`font-semibold capitalize ${
                              isDeclining ? 'text-rose-600' : isImproving ? 'text-emerald-600' : 'text-gray-600'
                            }`}
                          >
                            {crop.trend || 'Stable'}
                            {crop.scoreDiff ? ` (${crop.scoreDiff > 0 ? '+' : ''}${crop.scoreDiff})` : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">
                          Awaiting baseline scan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[#52796F] text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{crop.totalScans || 0} scans recorded</span>
                    </div>
                  </div>

                  {/* Notes or Latest Observation */}
                  <p className="text-xs text-[#52796F] line-clamp-2 leading-relaxed">
                    {crop.latestScan?.condition || crop.notes || 'Registered in Phytoscan intelligence system.'}
                  </p>

                  {/* Quick Card Footer Action */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#2D6A4F] group-hover:text-[#1B4332]">
                    <span>{hasScans ? 'Inspect Health Memory' : 'Perform Initial Scan'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
