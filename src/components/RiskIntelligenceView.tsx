import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  Activity,
  ArrowRight,
  Sprout,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { Crop, RiskEvent, ViewState } from '../types';
import { api } from '../lib/api';
import { useData } from '../context/DataContext';

interface RiskIntelligenceViewProps {
  onNavigate: (view: ViewState) => void;
  onSelectCrop: (cropId: string) => void;
  onScanCrop: (cropId: string) => void;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({
  onNavigate,
  onSelectCrop,
  onScanCrop
}) => {
  const { crops, isRestoring } = useData();
  const [filter, setFilter] = useState<'all' | 'high' | 'elevated' | 'moderate'>('all');
  const isLoading = isRestoring;

  // Compute emerging risk events from real crop history
  const calculatedRisks = crops.flatMap(c => {
    const hasScans = (c.totalScans || 0) > 0;
    if (!hasScans) {
      // Unscanned plots do not trigger disease alarms until an actual evaluation is captured
      return [];
    }

    const events: Array<{
      id: string;
      crop: Crop;
      title: string;
      description: string;
      level: 'high' | 'elevated' | 'moderate';
      recommendation: string;
    }> = [];

    if (c.currentHealthScore < 70 || c.currentRiskLevel === 'high') {
      events.push({
        id: `risk-score-${c.id}`,
        crop: c,
        title: `Acute Vigor Depletion on ${c.name}`,
        description: `Current health score has breached critical monitoring threshold (${c.currentHealthScore}/100). Sequential foliar necrosis detected.`,
        level: 'high',
        recommendation: 'Immediate targeted organic or chemical fungicide application recommended after spore identification.'
      });
    }

    if (c.trend === 'declining' || (c.scoreDiff && c.scoreDiff < -10)) {
      events.push({
        id: `risk-trend-${c.id}`,
        crop: c,
        title: `Pathogen Acceleration over Past Cycles`,
        description: `Health score dropped significantly (${c.scoreDiff} points) across historical surveillance intervals.`,
        level: 'elevated',
        recommendation: 'Check irrigation schedules to prevent extended leaf wetness hours; inspect neighboring rows for spread.'
      });
    }

    if (c.currentRiskLevel === 'moderate') {
      events.push({
        id: `risk-mod-${c.id}`,
        crop: c,
        title: `Early Symptom Recurrence on ${c.field}`,
        description: `Faint chlorosis and early lesion margins observed on foliage. Baseline stability under watch.`,
        level: 'moderate',
        recommendation: 'Conduct secondary scan within 48 to 72 hours to evaluate symptom velocity.'
      });
    }

    return events;
  });

  const filteredRisks = calculatedRisks.filter(r => {
    if (filter === 'all') return true;
    return r.level === filter;
  });

  // Calculate highest risk tier
  const highestRisk = calculatedRisks.some(r => r.level === 'high') ? 'High' :
                      calculatedRisks.some(r => r.level === 'elevated') ? 'Elevated' :
                      calculatedRisks.some(r => r.level === 'moderate') ? 'Moderate' : 'Low';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="border-b border-[#2D6A4F]/10 pb-4">
        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
          Early Warning System
        </span>
        <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#132A13] mt-1">
          Risk Intelligence Matrix
        </h1>
        <p className="text-sm text-[#52796F] mt-0.5">
          Calculates real pathogen risk vectors, symptom recurrence patterns, and declining score alerts before visible devastation spreads.
        </p>
      </div>

      {/* Top Threat Gauge Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#52796F]">
            Farm Threat Status
          </span>
          <h2 className="font-outfit text-3xl font-black text-[#132A13] flex items-center gap-3">
            <span>Overall Risk:</span>
            <span
              className={
                highestRisk === 'High' ? 'text-rose-600' :
                highestRisk === 'Elevated' ? 'text-amber-600' :
                highestRisk === 'Moderate' ? 'text-amber-500' :
                'text-emerald-600'
              }
            >
              {highestRisk}
            </span>
          </h2>
          <p className="text-xs text-[#52796F]">
            {calculatedRisks.length} active risk indicators detected across {crops.length} monitored crops.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'high', 'elevated', 'moderate'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                filter === lvl
                  ? 'bg-[#1B4332] text-white shadow-2xs'
                  : 'bg-[#F0F4F1] hover:bg-[#E5ECE7] text-[#52796F]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Emerging Risks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-outfit text-lg font-bold text-[#132A13]">
            Active Risk Events & Actionable Advisories
          </h3>
        </div>

        {filteredRisks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-[#2D6A4F]/20 space-y-2">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-[#132A13]">No Elevated Risks in this Category</p>
            <p className="text-xs text-[#52796F]">All crops in this threshold are currently operating within stable parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRisks.map(risk => (
              <div
                key={risk.id}
                className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs hover:shadow-lg transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        risk.level === 'high' ? 'bg-rose-100 text-rose-800' :
                        risk.level === 'elevated' ? 'bg-amber-100 text-amber-800' :
                        'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {risk.level} Priority
                    </span>

                    <span className="text-xs font-semibold text-[#52796F]">
                      Plot: {risk.crop.name}
                    </span>
                  </div>

                  <h4 className="font-outfit font-bold text-base text-[#132A13]">
                    {risk.title}
                  </h4>

                  <p className="text-xs text-[#52796F] leading-relaxed">
                    {risk.description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-[#F8FAF8] border border-gray-100 text-xs text-[#344E41] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332] block">
                      Agronomist Advisory:
                    </span>
                    <p>{risk.recommendation}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => onScanCrop(risk.crop.id)}
                    className="text-xs font-bold text-[#2D6A4F] hover:underline"
                  >
                    Scan Plot Now
                  </button>

                  <button
                    onClick={() => onSelectCrop(risk.crop.id)}
                    className="px-4 py-2 rounded-xl bg-[#F0F4F1] hover:bg-[#D8F3DC] text-[#1B4332] text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Inspect Timeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
