import React, { useState, useEffect, useRef } from 'react';
import {
  Sprout,
  Scan,
  Camera,
  Sparkles,
  History,
  ShieldAlert,
  Bot,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Globe,
  Menu,
  X,
  TrendingDown,
  ShieldCheck,
  Calendar,
  Layers,
  Check,
  Eye,
  Microscope,
  Clock,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { ViewState } from '../types';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

// Animation variants for scroll-triggered Feature Bento Grid
const bentoContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
};

const bentoCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 28 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
  onExploreDemo: () => void;
  onNavigate: (view: ViewState) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn = onGetStarted,
  onExploreDemo,
  onNavigate
}) => {
  const { user, updateUserLanguage } = useAuth();
  const [activeNav, setActiveNav] = useState<'home' | 'features' | 'how-it-works' | 'memory' | 'pricing' | 'contact'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth scroll handler
  const scrollToSection = (id: string, navKey: typeof activeNav) => {
    setActiveNav(navKey);
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems: Array<{ id: string; key: typeof activeNav; label: string }> = [
    { id: 'hero', key: 'home', label: 'Home' },
    { id: 'features', key: 'features', label: 'Features' },
    { id: 'how-it-works', key: 'how-it-works', label: 'How It Works' },
    { id: 'memory', key: 'memory', label: 'Health Memory' },
    { id: 'pricing', key: 'pricing', label: 'Pricing' },
    { id: 'contact', key: 'contact', label: 'Contact' }
  ];

  const languages = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', label: 'Bengali', native: 'বাংলা' }
  ];

  return (
    <div className="relative min-h-screen bg-[#F8FAF8] text-[#132A13] flex flex-col font-sans selection:bg-[#D8F3DC] selection:text-[#1B4332] overflow-x-hidden">
      
      {/* Subtle organic background mesh for the entire page */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full bg-gradient-to-b from-[#E8F5E9]/80 via-[#D8F3DC]/40 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[35%] -right-48 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#B7E4C7]/25 to-transparent blur-3xl" />
        <div className="absolute top-[65%] -left-48 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#E8F5E9]/60 to-[#D8F3DC]/20 blur-3xl" />
      </div>

      {/* ==================================================
          2. FLOATING GLASS NAVIGATION BAR
          ================================================== */}
      <nav 
        aria-label="Main Navigation"
        className="sticky top-4 sm:top-6 z-50 px-4 sm:px-6 pointer-events-none transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto w-full pointer-events-auto">
          <div className="backdrop-blur-xl bg-white/75 border border-white/70 shadow-[0_12px_40px_rgba(11,37,18,0.07)] rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all">
            
            {/* Left: Brand Identity */}
            <div 
              onClick={() => scrollToSection('hero', 'home')}
              className="cursor-pointer shrink-0"
              title="Phytoscan Intelligence"
            >
              <Logo size="md" />
            </div>

            {/* Center: Navigation Links (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 bg-black/[0.02] p-1 rounded-full border border-black/[0.03]">
              {navItems.map(item => {
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id, item.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/90 text-[#132A13] font-semibold shadow-xs border border-white/90'
                        : 'text-[#344E41] hover:text-[#132A13] hover:bg-white/50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* Language Selector */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-2.5 py-1.5 rounded-full text-[#2D6A4F] hover:bg-white/60 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Select Language"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="uppercase text-[#1B4332]">
                    {user?.language || 'EN'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#52796F]" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 backdrop-blur-xl bg-white/95 rounded-2xl shadow-xl border border-[#2D6A4F]/15 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#52796F]">
                      Language
                    </div>
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          updateUserLanguage(lang.code as any);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[#F0F4F1] transition-colors ${
                          user?.language === lang.code ? 'text-[#1B4332] font-bold bg-[#D8F3DC]/40' : 'text-[#2D6A4F]'
                        }`}
                      >
                        <span>{lang.native}</span>
                        <span className="text-[10px] text-[#52796F]">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign In Button */}
              <button
                onClick={onSignIn}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1B4332] hover:bg-white/60 transition-colors"
              >
                Sign In
              </button>

              {/* Primary Get Started Button */}
              <button
                onClick={onGetStarted}
                className="px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white text-xs font-bold shadow-md shadow-[#1B4332]/20 hover:shadow-lg transition-all flex items-center gap-1.5 group active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D8F3DC] group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full text-[#1B4332] hover:bg-white/60 lg:hidden transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Mobile Navigation Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden mt-2 p-4 rounded-3xl backdrop-blur-2xl bg-white/95 border border-white/80 shadow-2xl space-y-2"
              >
                <div className="grid grid-cols-2 gap-1.5">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id, item.key)}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                        activeNav === item.key
                          ? 'bg-[#D8F3DC] text-[#1B4332] font-bold'
                          : 'text-[#344E41] hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#2D6A4F]/10 flex items-center justify-between gap-2">
                  <button
                    onClick={onSignIn}
                    className="flex-1 py-2 text-center rounded-xl bg-gray-100 text-xs font-semibold text-[#1B4332]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onGetStarted}
                    className="flex-1 py-2 text-center rounded-xl bg-[#1B4332] text-xs font-bold text-white flex items-center justify-center gap-1"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3 h-3 text-[#D8F3DC]" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ==================================================
          4. HERO SECTION
          ================================================== */}
      <section id="hero" className="relative pt-6 sm:pt-10 pb-16 lg:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-6">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#2D6A4F]/20 text-[#1B4332] text-xs font-bold tracking-wide uppercase shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>AI Crop Health Intelligence Platform</span>
              </div>

              {/* Headline */}
              <h1 className="font-outfit text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold tracking-tight text-[#132A13] leading-[1.12]">
                Know Your Crop <br />
                Before It Becomes <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D6A4F] via-[#1B4332] to-[#40916C]">
                  a Problem.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-[#344E41] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                AI-powered crop scanning and continuous health intelligence for smarter, more resilient farming. Phytoscan doesn't just scan a crop — <strong className="text-[#132A13] font-bold">it remembers the crop</strong>.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={onGetStarted}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#1B4332] via-[#24523C] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white font-bold text-sm shadow-xl shadow-[#1B4332]/25 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 group active:scale-95"
                >
                  <Camera className="w-4 h-4 text-[#74C69D] group-hover:rotate-12 transition-transform" />
                  <span>Scan a Crop</span>
                  <ArrowRight className="w-4 h-4 text-[#D8F3DC] group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onExploreDemo}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full backdrop-blur-md bg-white/75 hover:bg-white text-[#1B4332] font-semibold text-sm border border-white/80 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Explore Demo Farm</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-[#2D6A4F]/10 flex flex-wrap items-center justify-center lg:justify-start gap-5 sm:gap-6 text-xs text-[#52796F]">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Continuous Health Memory
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Gemini Multimodal Vision
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Autonomous AI Agent
                </span>
              </div>

            </div>

            {/* Hero Right: Immersive Agricultural Vision & Floating Glass Cards */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              
              {/* Outer Glow Halo */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/10 via-emerald-300/15 to-transparent rounded-[2.5rem] blur-2xl pointer-events-none -z-10" />

              {/* Main Crop Mockup Stage */}
              <div className="relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-[0_25px_60px_rgba(11,37,18,0.12)] border border-white/80 bg-white/40 p-2 sm:p-2.5 backdrop-blur-md">
                
                {/* Image Container with Agricultural Scanning Reticle */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[1/1] rounded-[1.75rem] overflow-hidden bg-[#0B2512]/5 group">
                  
                  {/* High Quality Agricultural Crop Visual */}
                  <img
                    src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1200&q=85"
                    alt="Agricultural Crop Foliage Surveillance"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    loading="eager"
                  />

                  {/* Gentle Agricultural Sunlight Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B2512]/85 via-[#0B2512]/20 to-black/10 pointer-events-none" />

                  {/* Computer Vision Scanning Reticle Frame */}
                  <div className="absolute inset-4 sm:inset-6 rounded-2xl pointer-events-none border border-white/30 flex flex-col justify-between p-3.5">
                    
                    {/* Top Bracket Reticle */}
                    <div className="flex justify-between items-start">
                      <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-500/30 text-white text-[10px] font-mono tracking-wider shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>CV_ACTIVE: SOLANUM_LYCOPERSICUM</span>
                      </div>
                      <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                    </div>

                    {/* Laser Scanning Line Sweep Animation */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse" />
                    </div>

                    {/* Bottom Bracket Reticle */}
                    <div className="flex justify-between items-end">
                      <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                      <div className="text-[9px] font-mono text-emerald-200/80 tracking-widest uppercase">
                        RES: 4K OPTICAL • SENSOR: MULTISPECTRAL
                      </div>
                      <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>

                  {/* ==================================================
                      10. FLOATING AI ANALYSIS CARD (Top Left Overlay)
                      ================================================== */}
                  <div className="absolute top-4 left-4 sm:left-6 backdrop-blur-xl bg-white/85 border border-white/70 p-3 rounded-2xl shadow-xl max-w-[210px] sm:max-w-[230px] animate-in fade-in slide-in-from-top-3 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-lg bg-[#1B4332] flex items-center justify-center text-emerald-400">
                        <Microscope className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#132A13] block leading-tight">Analyzing Foliage...</span>
                        <span className="text-[9px] text-[#52796F]">Gemini Vision v3.8</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-[10px] text-[#344E41]">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Detecting foliar symptoms...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Comparing with past scans...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Generating agronomic insights...</span>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      11. DISEASE RESULT CARD (Top Right / Middle Overlay)
                      ================================================== */}
                  <div className="absolute top-28 sm:top-24 right-4 sm:right-6 backdrop-blur-xl bg-white/90 border border-white/70 p-3 rounded-2xl shadow-2xl max-w-[200px] animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#132A13]">Possible Early Blight</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        AI-assisted
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[#52796F]">Confidence</span>
                      <span className="font-extrabold text-[#1B4332]">92%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[92%]" />
                    </div>

                    <p className="text-[9px] text-[#52796F] leading-tight">
                      Observed concentric target rings with chlorotic halo on lower canopy.
                    </p>
                  </div>

                  {/* ==================================================
                      12. HEALTH MEMORY VISUAL CARD (Bottom Overlay)
                      ================================================== */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 backdrop-blur-2xl bg-[#0B2512]/90 border border-emerald-500/30 p-3.5 sm:p-4 rounded-2xl shadow-2xl text-white">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#74C69D] font-bold uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1">
                        <History className="w-3.5 h-3.5" />
                        Crop Health Memory
                      </span>
                      <span className="text-amber-400 font-semibold">21-Day Trend</span>
                    </div>
                    
                    {/* Timeline Progression */}
                    <div className="flex items-center justify-between text-center relative py-1">
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-extrabold text-emerald-400">94</span>
                        <p className="text-[9px] text-gray-300">Day 1</p>
                      </div>
                      <span className="text-gray-500 text-xs">→</span>
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-extrabold text-emerald-300">87</span>
                        <p className="text-[9px] text-gray-300">Day 7</p>
                      </div>
                      <span className="text-gray-500 text-xs">→</span>
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-extrabold text-amber-400">74</span>
                        <p className="text-[9px] text-gray-300">Day 14</p>
                      </div>
                      <span className="text-gray-500 text-xs">→</span>
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-extrabold text-amber-300">68</span>
                        <p className="text-[9px] text-gray-300">Day 21</p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-200 font-medium flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-amber-400" />
                        Health declining — monitoring recommended
                      </span>
                      <span className="text-[9px] text-gray-400 hidden xs:inline">
                        -26 pts shift
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          13. SOCIAL PROOF / METRICS PANEL
          ================================================== */}
      <section className="py-6 sm:py-8 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_45px_rgba(11,37,18,0.06)] rounded-[2rem] p-6 sm:p-8 lg:p-10 transition-all">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              
              {/* Metric 1 */}
              <div className="lg:col-span-2 space-y-1">
                <span className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13] tracking-tight block">
                  10K+
                </span>
                <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                  Farmers Supported
                </p>
                <p className="text-[11px] text-[#52796F]">Across 14 agricultural regions</p>
              </div>

              {/* Metric 2 */}
              <div className="lg:col-span-2 space-y-1">
                <span className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13] tracking-tight block">
                  95%
                </span>
                <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                  Early Detection
                </p>
                <p className="text-[11px] text-[#52796F]">Identified before visual defoliation</p>
              </div>

              {/* Metric 3 */}
              <div className="lg:col-span-2 space-y-1">
                <span className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13] tracking-tight block">
                  6+
                </span>
                <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                  Crops Monitored
                </p>
                <p className="text-[11px] text-[#52796F]">Tomatoes, wheat, peppers & more</p>
              </div>

              {/* Metric 4 */}
              <div className="lg:col-span-2 space-y-1">
                <span className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13] tracking-tight block">
                  24/7
                </span>
                <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider">
                  AI Assistance
                </p>
                <p className="text-[11px] text-[#52796F]">Multilingual voice & chat support</p>
              </div>

              {/* Testimonial Quote */}
              <div className="col-span-2 md:col-span-4 lg:col-span-4 lg:border-l lg:border-[#2D6A4F]/10 lg:pl-8 space-y-2">
                <p className="text-xs sm:text-sm text-[#344E41] italic leading-relaxed">
                  "Phytoscan caught the early blight in Tomato Field A a week before we saw visible leaf drop. That historical memory saved an entire season's yield."
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                    RK
                  </div>
                  <div className="text-[11px]">
                    <span className="font-bold text-[#132A13]">Rajesh K.</span>
                    <span className="text-[#52796F]"> • Agronomist & Organic Grower</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          14. FEATURE BENTO GRID SECTION:
          "More Than a Scanner. A Crop Intelligence Platform."
          ================================================== */}
      <section id="features" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
            <span className="px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-[#1B4332] text-xs font-bold uppercase tracking-wider border border-[#2D6A4F]/20 shadow-xs">
              Platform Architecture
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#132A13] tracking-tight leading-tight">
              More Than a Scanner. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788]">
                A Crop Intelligence Platform.
              </span>
            </h2>
            <p className="text-[#344E41] text-base sm:text-lg leading-relaxed">
              Phytoscan doesn't just tell you what's wrong. It helps you understand how your crop is changing over time.
            </p>
          </div>

          {/* Bento Feature Grid with Scroll-Triggered Framer Motion Animation */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            variants={bentoContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15, margin: "-40px" }}
          >
            
            {/* 1. AI Crop Scanning */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/75 border border-white/80 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(11,37,18,0.04)] hover:shadow-[0_20px_45px_rgba(27,67,50,0.12),0_0_25px_rgba(82,183,136,0.25)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-[#74C69D] flex items-center justify-center shadow-md shadow-[#1B4332]/20 group-hover:scale-110 group-hover:shadow-emerald-900/30 transition-all duration-300">
                  <Scan className="w-6 h-6" />
                </div>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] group-hover:text-[#1B4332] transition-colors">
                  1. AI Crop Scanning
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Analyze crop foliage images for possible disease, pest vectors, and nutrient deficiencies with Gemini multimodal vision, blur detection, and confidence calibration.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#2D6A4F]/10 flex items-center justify-between text-xs font-bold text-[#2D6A4F] relative z-10">
                <span className="group-hover:text-[#1B4332] transition-colors">Quality Gate & Uncertainty Disclosures</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

            {/* 2. Crop Health Memory (Highlighted Star Feature) */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl bg-gradient-to-br from-[#1B4332] via-[#24523C] to-[#2D6A4F] text-white border border-emerald-500/30 hover:border-emerald-300/80 shadow-2xl hover:shadow-[0_25px_55px_rgba(11,37,18,0.4),0_0_35px_rgba(116,198,157,0.35)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 group-hover:bg-emerald-400/35 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md text-[#74C69D] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  <History className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-outfit text-xl font-bold text-white">
                    2. Crop Health Memory
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Core Differentiator
                  </span>
                </div>
                <p className="text-sm text-[#D8F3DC] leading-relaxed">
                  Track changes over time with immutable historical timelines. Phytoscan correlates consecutive scans to observe subtle symptom onset long before defoliation occurs.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-bold text-[#74C69D] relative z-10">
                <span>94 → 87 → 74 → 68 Progressive Memory</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

            {/* 3. Risk Intelligence */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/75 border border-white/80 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(11,37,18,0.04)] hover:shadow-[0_20px_45px_rgba(27,67,50,0.12),0_0_25px_rgba(82,183,136,0.25)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-[#74C69D] flex items-center justify-center shadow-md shadow-[#1B4332]/20 group-hover:scale-110 group-hover:shadow-emerald-900/30 transition-all duration-300">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] group-hover:text-[#1B4332] transition-colors">
                  3. Risk Intelligence
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Calculates real pathogen risk vectors, symptom recurrence frequencies, and rapid score decline alerts so you can intervene before diseases spread across plots.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#2D6A4F]/10 flex items-center justify-between text-xs font-bold text-[#2D6A4F] relative z-10">
                <span className="group-hover:text-[#1B4332] transition-colors">Automated Early Warning Signals</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

            {/* 4. AI Assistant */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/75 border border-white/80 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(11,37,18,0.04)] hover:shadow-[0_20px_45px_rgba(27,67,50,0.12),0_0_25px_rgba(82,183,136,0.25)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-[#74C69D] flex items-center justify-center shadow-md shadow-[#1B4332]/20 group-hover:scale-110 group-hover:shadow-emerald-900/30 transition-all duration-300">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] group-hover:text-[#1B4332] transition-colors">
                  4. Conversational AI Assistant
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Ask questions naturally about your farm records. Grounded in your crops' actual scan history, with voice speech recognition in English, Hindi, and Bengali.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#2D6A4F]/10 flex items-center justify-between text-xs font-bold text-[#2D6A4F] relative z-10">
                <span className="group-hover:text-[#1B4332] transition-colors">Voice & Multilingual Grounding</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

            {/* 5. AI Agent */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/75 border border-white/80 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(11,37,18,0.04)] hover:shadow-[0_20px_45px_rgba(27,67,50,0.12),0_0_25px_rgba(82,183,136,0.25)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-[#74C69D] flex items-center justify-center shadow-md shadow-[#1B4332]/20 group-hover:scale-110 group-hover:shadow-emerald-900/30 transition-all duration-300">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] group-hover:text-[#1B4332] transition-colors">
                  5. Autonomous AI Agent
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Dispatches multi-step diagnostic investigations across crop chronologies, comparing historical photos and calculating score drift to compile clinical reports.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#2D6A4F]/10 flex items-center justify-between text-xs font-bold text-[#2D6A4F] relative z-10">
                <span className="group-hover:text-[#1B4332] transition-colors">Sequential Tool Reasoning</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

            {/* 6. Detailed Reports */}
            <motion.div
              variants={bentoCardVariants}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25, ease: "easeOut" } }}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/75 border border-white/80 hover:border-emerald-500/60 shadow-[0_10px_30px_rgba(11,37,18,0.04)] hover:shadow-[0_20px_45px_rgba(27,67,50,0.12),0_0_25px_rgba(82,183,136,0.25)] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/0 group-hover:bg-emerald-400/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />
              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-[#74C69D] flex items-center justify-center shadow-md shadow-[#1B4332]/20 group-hover:scale-110 group-hover:shadow-emerald-900/30 transition-all duration-300">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] group-hover:text-[#1B4332] transition-colors">
                  6. Executive Field Reports
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Generate easy-to-understand crop health reports and printable dossiers complete with score charts, historical observations, and recommended action steps.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#2D6A4F]/10 flex items-center justify-between text-xs font-bold text-[#2D6A4F] relative z-10">
                <span className="group-hover:text-[#1B4332] transition-colors">Printable Agronomy Records</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ==================================================
          19. HOW IT WORKS SECTION (Visual 4-Step Flow)
          ================================================== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#F0F4F1]/60 border-y border-[#2D6A4F]/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-[#D8F3DC] text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              Workflow
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13]">
              How Phytoscan Works
            </h2>
            <p className="text-[#52796F] text-base">
              A continuous intelligence cycle designed for practical field conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 01 */}
            <div className="p-7 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-3xl font-extrabold text-emerald-600 block">01</span>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] uppercase tracking-wide">
                  SCAN
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Upload or snap a foliage photo with automated sharpness and exposure validation.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
                <Camera className="w-3.5 h-3.5" />
                <span>Field Image Input</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-7 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-3xl font-extrabold text-emerald-600 block">02</span>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] uppercase tracking-wide">
                  UNDERSTAND
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  AI analyzes visible crop symptoms, assigns severity, and calculates health scores.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
                <Microscope className="w-3.5 h-3.5" />
                <span>Multimodal Vision</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-7 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-3xl font-extrabold text-emerald-600 block">03</span>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] uppercase tracking-wide">
                  REMEMBER
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Phytoscan indexes the scan into the crop's permanent historical health timeline.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
                <History className="w-3.5 h-3.5" />
                <span>Timeline Persistence</span>
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-7 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <span className="font-mono text-3xl font-extrabold text-emerald-600 block">04</span>
                <h3 className="font-outfit text-xl font-bold text-[#132A13] uppercase tracking-wide">
                  PROTECT
                </h3>
                <p className="text-sm text-[#52796F] leading-relaxed">
                  Identify downward trajectory trends and emerging risks to act before crop loss occurs.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-[#2D6A4F] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Targeted Defense</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          20. CROP HEALTH MEMORY SECTION (HERO FEATURE SECTION)
          ================================================== */}
      <section id="memory" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="px-4 py-1.5 rounded-full bg-[#D8F3DC] text-[#1B4332] text-xs font-bold uppercase tracking-wider border border-[#2D6A4F]/20">
              The Breakthrough Advantage
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#132A13] tracking-tight">
              Your Crop Has a History. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788]">
                Phytoscan Remembers It.
              </span>
            </h2>
            <p className="text-[#344E41] text-base sm:text-lg">
              A single scan only shows today's snapshot. Phytoscan correlates every observation to reveal the true trajectory of disease progression.
            </p>
          </div>

          {/* Detailed Timeline Visualization Showcase */}
          <div className="backdrop-blur-2xl bg-white/80 border border-white/90 shadow-[0_20px_50px_rgba(11,37,18,0.06)] rounded-[2.5rem] p-6 sm:p-10 lg:p-12">
            
            {/* Top Crop Overview Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#2D6A4F]/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-outfit text-2xl font-bold text-[#132A13]">
                    Tomato Field A (Roma VF)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    Active Surveillance Alert
                  </span>
                </div>
                <p className="text-xs text-[#52796F] mt-1">
                  Plot 14 • 2.5 Hectares • Monitored over 21 days
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider block">Total Drift</span>
                  <span className="font-outfit text-xl font-extrabold text-amber-600">-26 Points</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#52796F] uppercase tracking-wider block">Risk Status</span>
                  <span className="font-outfit text-xl font-extrabold text-amber-700">Increasing</span>
                </div>
              </div>
            </div>

            {/* 4-Stage Chronological Health Memory Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
              
              {/* Day 1 */}
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#52796F] uppercase">Day 1</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    94/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#132A13]">Optimal Vegetative State</h4>
                <p className="text-xs text-[#52796F] leading-relaxed">
                  Healthy green canopy with uniform leaf pigmentation. Zero visible lesions or pathogens detected.
                </p>
                <div className="pt-2 border-t border-gray-100 text-[10px] font-medium text-emerald-700">
                  Risk: Stable / Low
                </div>
              </div>

              {/* Day 7 */}
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#52796F] uppercase">Day 7</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    87/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#132A13]">Early Symptom Emergence</h4>
                <p className="text-xs text-[#52796F] leading-relaxed">
                  Micro chlorotic speckling observed on lower leaf margins. Baseline vigor remains high.
                </p>
                <div className="pt-2 border-t border-gray-100 text-[10px] font-medium text-emerald-700">
                  Risk: Monitoring Required
                </div>
              </div>

              {/* Day 14 */}
              <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-amber-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#52796F] uppercase">Day 14</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                    74/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#132A13]">Target Lesions Identified</h4>
                <p className="text-xs text-[#52796F] leading-relaxed">
                  Fungal pathogen patterns forming concentric brown rings with yellow halo. Early blight confirmed.
                </p>
                <div className="pt-2 border-t border-gray-100 text-[10px] font-medium text-amber-700">
                  Risk: Increasing
                </div>
              </div>

              {/* Day 21 */}
              <div className="p-5 rounded-2xl bg-[#0B2512] text-white border border-emerald-500/30 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase">Day 21 (Latest)</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[#0B2512] text-xs font-extrabold">
                    68/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">Canopy Degradation</h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Multiple concentric spots, premature lower leaf drop, and stem collar lesions spreading upward.
                </p>
                <div className="pt-2 border-t border-white/10 text-[10px] font-bold text-amber-300">
                  Risk: High / Intervention Required
                </div>
              </div>

            </div>

            {/* AI Clinical Memory Verdict */}
            <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#E8F5E9]/60 border border-[#2D6A4F]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1B4332] text-[#74C69D] flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#132A13] block">
                    AI Memory Trajectory Diagnosis
                  </span>
                  <p className="text-xs text-[#344E41]">
                    Consecutive scans demonstrate an uninterrupted 26-point downward decline. Early blight progressed upward from lower canopy due to high humidity.
                  </p>
                </div>
              </div>

              <button
                onClick={onExploreDemo}
                className="shrink-0 px-4 py-2 rounded-full bg-white hover:bg-gray-50 text-xs font-bold text-[#1B4332] border border-[#2D6A4F]/20 shadow-xs transition-all"
              >
                Inspect Live Timeline
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          PRICING SECTION (Clean Glass Pricing)
          ================================================== */}
      <section id="pricing" className="py-20 lg:py-28 bg-[#F0F4F1]/60 border-y border-[#2D6A4F]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="px-3.5 py-1 rounded-full bg-[#D8F3DC] text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              Transparent Access
            </span>
            <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13]">
              Simple, Accessible AgriTech
            </h2>
            <p className="text-[#52796F] text-base">
              Start monitoring your crops with continuous AI memory. Upgrade as your acreage scales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#52796F] uppercase tracking-wider">Starter Farmer</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-outfit text-4xl font-extrabold text-[#132A13]">Free</span>
                  <span className="text-xs text-[#52796F]">/ forever</span>
                </div>
                <p className="text-xs text-[#52796F]">Essential crop health scanning and basic timelines for smallholders.</p>
                <div className="pt-4 space-y-2.5 text-xs text-[#344E41]">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Up to 3 registered crops</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Gemini multimodal scanning</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>14-day health history</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Multilingual AI assistant</span></div>
                </div>
              </div>
              <button
                onClick={onGetStarted}
                className="mt-8 w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#1B4332] text-xs font-bold transition-colors"
              >
                Start Free
              </button>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1B4332] to-[#24523C] text-white shadow-2xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-400 text-[#0B2512] text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Pro Agronomist</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-outfit text-4xl font-extrabold text-white">$29</span>
                  <span className="text-xs text-emerald-200">/ month</span>
                </div>
                <p className="text-xs text-emerald-100">Full continuous health memory, autonomous agent investigations, and unlimited plots.</p>
                <div className="pt-4 space-y-2.5 text-xs text-emerald-100">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited registered crops & plots</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited historical health memory</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>Autonomous AI agent investigations</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>Scan comparison engine & score shifts</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /><span>Executive PDF dossier export</span></div>
                </div>
              </div>
              <button
                onClick={onGetStarted}
                className="mt-8 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-[#0B2512] text-xs font-extrabold shadow-md transition-all active:scale-95"
              >
                Get Started with Pro
              </button>
            </div>

            {/* Enterprise Cooperative */}
            <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/80 border border-white/90 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-[#52796F] uppercase tracking-wider">Cooperative / Enterprise</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-outfit text-4xl font-extrabold text-[#132A13]">Custom</span>
                </div>
                <p className="text-xs text-[#52796F]">Dedicated regional deployments, custom disease models, and agricultural extension APIs.</p>
                <div className="pt-4 space-y-2.5 text-xs text-[#344E41]">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Cooperative fleet management</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Custom pathogen taxonomies</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>API & IoT drone sensor feeds</span></div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /><span>Dedicated agronomy support SLA</span></div>
                </div>
              </div>
              <button
                onClick={() => scrollToSection('contact', 'contact')}
                className="mt-8 w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#1B4332] text-xs font-bold transition-colors"
              >
                Contact Partnerships
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          PURPOSE / MISSION SECTION
          ================================================== */}
      <section className="relative py-24 sm:py-28 overflow-hidden bg-[#0B2512] text-white">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
            alt="Agricultural Farmland Landscape"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B2512] via-transparent to-[#0B2512]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="px-4 py-1.5 rounded-full bg-emerald-900/80 text-[#74C69D] text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
            Our Mission
          </span>

          <h2 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            From Healthier Crops <br />
            <span className="text-[#74C69D]">to Brighter Futures.</span>
          </h2>

          <p className="text-base sm:text-xl text-[#D8F3DC] max-w-2xl mx-auto font-normal leading-relaxed">
            Empowering growers with continuous AI for a more resilient and sustainable agricultural tomorrow. By connecting visual foliage symptoms with persistent field memory, Phytoscan protects harvests and nourishes communities.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-[#0B2512] font-extrabold text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <span>Start Monitoring Your Farm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              View Interactive Demo
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          CONTACT SECTION
          ================================================== */}
      <section id="contact" className="py-16 sm:py-20 bg-white border-t border-[#2D6A4F]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#D8F3DC] text-[#1B4332] text-xs font-bold uppercase tracking-wider">
                Get In Touch
              </span>
              <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold text-[#132A13]">
                Connect with the Phytoscan Agronomy Team
              </h2>
              <p className="text-sm text-[#52796F] leading-relaxed">
                Whether you cultivate greenhouse crops, manage extensive acreage, or oversee an agricultural cooperative, our team provides tailored setup and sensor guidance.
              </p>
              <div className="pt-2 space-y-2 text-xs text-[#344E41]">
                <p>📍 Headquartered in Global AgriTech Innovation Hubs</p>
                <p>✉️ agronomy@phytoscan.ai • 24/7 Field Intelligence</p>
                <p>🌐 Multilingual Support: English, हिन्दी, বাংলা</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#F8FAF8] border border-[#2D6A4F]/15 shadow-sm">
              <h3 className="text-base font-bold text-[#132A13] mb-4">Request a Farm Consultation</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                />
                <input
                  type="email"
                  placeholder="Farm / Organization Email"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 bg-white"
                />
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-emerald-600 bg-white text-gray-700">
                  <option>Primary Crop (e.g. Tomatoes, Bell Peppers, Wheat)</option>
                  <option>Vegetable & Greenhouse</option>
                  <option>Cereal & Field Grains</option>
                  <option>Orchard & Fruit</option>
                </select>
                <button
                  onClick={onGetStarted}
                  className="w-full py-3 rounded-xl bg-[#1B4332] hover:bg-[#132A13] text-white text-xs font-bold shadow-md transition-all"
                >
                  Submit Inquiry
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
          ================================================== */}
      <footer className="bg-[#F8FAF8] border-t border-[#2D6A4F]/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div 
              onClick={() => scrollToSection('hero', 'home')} 
              className="cursor-pointer"
              title="Phytoscan"
            >
              <Logo size="sm" showTagline={true} />
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-[#52796F]">
              <button onClick={() => scrollToSection('hero', 'home')} className="hover:text-[#132A13]">Home</button>
              <button onClick={() => scrollToSection('features', 'features')} className="hover:text-[#132A13]">Features</button>
              <button onClick={() => scrollToSection('how-it-works', 'how-it-works')} className="hover:text-[#132A13]">How It Works</button>
              <button onClick={() => scrollToSection('memory', 'memory')} className="hover:text-[#132A13]">Crop Memory</button>
              <button onClick={() => scrollToSection('pricing', 'pricing')} className="hover:text-[#132A13]">Pricing</button>
              <button onClick={onSignIn} className="hover:text-[#132A13]">Sign In</button>
            </div>

          </div>

          <div className="pt-6 border-t border-[#2D6A4F]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#52796F]">
            <p>© {new Date().getFullYear()} Phytoscan Intelligence. All rights reserved.</p>
            <p className="text-center sm:text-right">
              Responsible AI for Agriculture • Educational and crop-monitoring decision support system.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
