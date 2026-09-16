import React from 'react';
import {
  Home,
  Sprout,
  Scan,
  MessageSquare,
  Bot
} from 'lucide-react';
import { ViewState } from '../types';

interface MobileBottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onNavigate }) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed left-3 right-3 bottom-2.5 z-40 max-w-md mx-auto rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/90 shadow-[0_12px_36px_rgba(11,37,18,0.12),0_2px_12px_rgba(11,37,18,0.06),0_0_24px_rgba(82,183,136,0.14)] pb-[env(safe-area-inset-bottom,0px)] select-none transition-all duration-300 motion-reduce:transition-none"
      style={{
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="grid grid-cols-5 items-center h-[72px] sm:h-[76px] px-1 relative w-full box-border">
        {/* 1. Home */}
        {(() => {
          const isHomeActive = currentView === 'dashboard';
          return (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              aria-label="Home"
              className="h-full w-full flex flex-col items-center justify-center py-1 px-0.5 focus:outline-none group touch-manipulation cursor-pointer"
            >
              <div
                className={`w-9 h-7 sm:w-10 sm:h-7.5 rounded-xl flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${
                  isHomeActive
                    ? 'bg-[#D8F3DC]/85 text-[#1B4332] shadow-xs'
                    : 'bg-transparent text-[#52796F] group-hover:bg-[#F0F4F1]/70 group-hover:text-[#2D6A4F]'
                }`}
              >
                <Home className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none ${isHomeActive ? 'text-[#1B4332]' : 'text-[#52796F]'}`} />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
                  isHomeActive ? 'text-[#132A13] font-bold' : 'text-[#52796F] group-hover:text-[#2D6A4F]'
                }`}
              >
                Home
              </span>
            </button>
          );
        })()}

        {/* 2. Crops */}
        {(() => {
          const isCropsActive = currentView === 'crops' || currentView === 'crop-detail';
          return (
            <button
              type="button"
              onClick={() => onNavigate('crops')}
              aria-label="Crops"
              className="h-full w-full flex flex-col items-center justify-center py-1 px-0.5 focus:outline-none group touch-manipulation cursor-pointer"
            >
              <div
                className={`w-9 h-7 sm:w-10 sm:h-7.5 rounded-xl flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${
                  isCropsActive
                    ? 'bg-[#D8F3DC]/85 text-[#1B4332] shadow-xs'
                    : 'bg-transparent text-[#52796F] group-hover:bg-[#F0F4F1]/70 group-hover:text-[#2D6A4F]'
                }`}
              >
                <Sprout className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none ${isCropsActive ? 'text-[#1B4332]' : 'text-[#52796F]'}`} />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
                  isCropsActive ? 'text-[#132A13] font-bold' : 'text-[#52796F] group-hover:text-[#2D6A4F]'
                }`}
              >
                Crops
              </span>
            </button>
          );
        })()}

        {/* 3. Elevated Central Scan Button */}
        {(() => {
          const isScanActive = currentView === 'scan';
          return (
            <div className="flex flex-col items-center justify-center h-full relative">
              <button
                type="button"
                onClick={() => onNavigate('scan')}
                aria-label="Scan Crop"
                className="group flex flex-col items-center justify-center -mt-6 sm:-mt-7 focus:outline-none touch-manipulation active:scale-95 transition-transform duration-150 motion-reduce:transform-none cursor-pointer"
              >
                {/* Outer Translucent Glass Ring */}
                <div
                  className={`p-1 sm:p-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    isScanActive
                      ? 'bg-white/95 shadow-[0_10px_25px_rgba(27,67,50,0.38),0_0_20px_rgba(116,198,157,0.45)] ring-2 ring-[#2D6A4F]'
                      : 'bg-white/80 backdrop-blur-md shadow-[0_8px_20px_rgba(27,67,50,0.22),0_0_16px_rgba(82,183,136,0.2)] group-hover:shadow-[0_10px_24px_rgba(27,67,50,0.3),0_0_20px_rgba(82,183,136,0.3)]'
                  } border border-white/90`}
                >
                  {/* Deep Forest Green Core Button */}
                  <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] rounded-full bg-gradient-to-tr from-[#081C15] via-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-white shadow-inner shadow-white/20">
                    <Scan className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-[#74C69D] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.45)] group-hover:scale-110 transition-transform duration-200 motion-reduce:transform-none" />
                  </div>
                </div>

                <span
                  className={`text-[10px] sm:text-[11px] font-bold mt-1 tracking-tight leading-none transition-colors whitespace-nowrap ${
                    isScanActive ? 'text-[#132A13]' : 'text-[#2D6A4F]'
                  }`}
                >
                  Scan
                </span>
              </button>
            </div>
          );
        })()}

        {/* 4. Assistant */}
        {(() => {
          const isAssistantActive = currentView === 'assistant';
          return (
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              aria-label="Assistant"
              className="h-full w-full flex flex-col items-center justify-center py-1 px-0.5 focus:outline-none group touch-manipulation cursor-pointer"
            >
              <div
                className={`w-9 h-7 sm:w-10 sm:h-7.5 rounded-xl flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${
                  isAssistantActive
                    ? 'bg-[#D8F3DC]/85 text-[#1B4332] shadow-xs'
                    : 'bg-transparent text-[#52796F] group-hover:bg-[#F0F4F1]/70 group-hover:text-[#2D6A4F]'
                }`}
              >
                <MessageSquare className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none ${isAssistantActive ? 'text-[#1B4332]' : 'text-[#52796F]'}`} />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
                  isAssistantActive ? 'text-[#132A13] font-bold' : 'text-[#52796F] group-hover:text-[#2D6A4F]'
                }`}
              >
                Assistant
              </span>
            </button>
          );
        })()}

        {/* 5. Agent */}
        {(() => {
          const isAgentActive = currentView === 'agent';
          return (
            <button
              type="button"
              onClick={() => onNavigate('agent')}
              aria-label="Agent"
              className="h-full w-full flex flex-col items-center justify-center py-1 px-0.5 focus:outline-none group touch-manipulation cursor-pointer"
            >
              <div
                className={`w-9 h-7 sm:w-10 sm:h-7.5 rounded-xl flex items-center justify-center transition-all duration-200 motion-reduce:transition-none ${
                  isAgentActive
                    ? 'bg-[#D8F3DC]/85 text-[#1B4332] shadow-xs'
                    : 'bg-transparent text-[#52796F] group-hover:bg-[#F0F4F1]/70 group-hover:text-[#2D6A4F]'
                }`}
              >
                <Bot className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none ${isAgentActive ? 'text-[#1B4332]' : 'text-[#52796F]'}`} />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 leading-none transition-colors whitespace-nowrap ${
                  isAgentActive ? 'text-[#132A13] font-bold' : 'text-[#52796F] group-hover:text-[#2D6A4F]'
                }`}
              >
                Agent
              </span>
            </button>
          );
        })()}
      </div>
    </nav>
  );
};
