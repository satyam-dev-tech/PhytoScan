import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Scan,
  GitCompare,
  Bot,
  FileText,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Eye
} from 'lucide-react';
import { Crop, CropScan, HealthTimelineEntry, RiskEvent, ViewState } from '../types';
import { api } from '../lib/api';
import { useData } from '../context/DataContext';

interface CropDetailViewProps {
  cropId: string;
  onBack: () => void;
  onNavigate: (view: ViewState) => void;
  onScanThisCrop: (cropId: string) => void;
  onCompareScans: (prevId: string, currId: string) => void;
  onRunAgent: (cropId: string) => void;
  onGenerateReport: (cropId: string) => void;
}

export const CropDetailView: React.FC<CropDetailViewProps> = ({
  cropId,
  onBack,
  onNavigate,
  onScanThisCrop,
  onCompareScans,
  onRunAgent,
  onGenerateReport
}) => {
  const { crops, scans: allScans, risks: allRisks } = useData();
  const [data, setData] = useState<{
    crop: Crop;
    scans: CropScan[];
    timeline: HealthTimelineEntry[];
    risks: RiskEvent[];
    metrics: {
      totalScans: number;
      daysMonitored: number;
      scoreChangeTotal: number;
      trend: 'improving' | 'stable' | 'declining';
      overallRisk: string;
    };
  } | null>(null);

  const [selectedScan, setSelectedScan] = useState<CropScan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCropData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCrop(cropId);
      setData(res);
      if (res.scans && res.scans.length > 0) {
        setSelectedScan(res.scans[0]); // Most recent scan selected by default
      }
    } catch (err) {
      console.warn('Server crop fetch fallback to DataContext', err);
      const foundCrop = crops.find(c => c.id === cropId);
      if (foundCrop) {
        const cropScans = allScans
          .filter(s => s.cropId === cropId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const cropRisks = allRisks.filter(r => r.cropId === cropId);
        const timeline: HealthTimelineEntry[] = cropScans.map(s => ({
          id: `timeline-${s.id}`,
          cropId: s.cropId,
          date: s.timestamp.split('T')[0],
          healthScore: s.healthScore,
          statusLabel: s.condition,
          scanId: s.id
        }));
        const oldest = cropScans[cropScans.length - 1];
        const newest = cropScans[0];
        const scoreChange = newest && oldest ? newest.healthScore - oldest.healthScore : 0;
        setData({
          crop: foundCrop,
          scans: cropScans,
          timeline,
          risks: cropRisks,
          metrics: {
            totalScans: cropScans.length,
            daysMonitored: 1,
            scoreChangeTotal: scoreChange,
            trend: scoreChange < -4 ? 'declining' : scoreChange > 4 ? 'improving' : 'stable',
            overallRisk: foundCrop.currentRiskLevel || 'low'
          }
        });
        if (cropScans.length > 0) {
          setSelectedScan(cropScans[0]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCropData();
  }, [cropId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-[#52796F]">
        <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-sm">Loading Crop Health Memory...</p>
      </div>
    );
  }

  if (!data || !data.crop) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Crop record not found.</p>
        <button onClick={onBack} className="mt-3 text-sm text-[#2D6A4F] font-bold underline">
          Return to Crops
        </button>
      </div>
    );
  }

  const { crop, scans, timeline, risks, metrics } = data;
  const isDeclining = metrics.trend === 'declining' || crop.currentHealthScore < 75;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Navigation Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#52796F] hover:text-[#132A13] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Crops</span>
      </button>

      {/* Hero Header Card */}
      <div className="rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* Crop Cover Image */}
          <div className="lg:col-span-4 relative h-64 lg:h-auto min-h-[220px]">
            <img
              src={crop.imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'}
              alt={crop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                {crop.cropType}
              </span>
              <h2 className="font-outfit text-2xl font-bold mt-1 text-white">{crop.name}</h2>
              <p className="text-xs text-gray-200">{crop.field} {crop.variety && `• ${crop.variety}`}</p>
            </div>
          </div>

          {/* Details & Live Phytoscan Health Score */}
          <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#52796F]">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Planted: {new Date(crop.plantingDate).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{metrics.daysMonitored} Days in Ground</span>
                </div>
                {crop.notes && (
                  <p className="text-xs text-[#52796F] mt-2 max-w-xl leading-relaxed">
                    {crop.notes}
                  </p>
                )}
              </div>

              {/* Phytoscan Health Score Gauge */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/15 shrink-0 self-start">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-outfit text-4xl font-black text-[#1B4332]">
                      {scans.length > 0 ? crop.currentHealthScore : '—'}
                    </span>
                    {scans.length > 0 && <span className="text-xs text-gray-500 font-bold">/100</span>}
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                      scans.length === 0 ? 'bg-gray-100 text-gray-600' :
                      crop.currentRiskLevel === 'high' ? 'bg-rose-100 text-rose-700' :
                      crop.currentRiskLevel === 'elevated' ? 'bg-amber-100 text-amber-800' :
                      crop.currentRiskLevel === 'moderate' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {scans.length > 0 ? `${crop.currentRiskLevel} Risk` : 'Pending Scan'}
                  </span>
                </div>

                <div className="border-l border-gray-200 pl-3 text-xs">
                  {scans.length > 0 ? (
                    <>
                      <div className="flex items-center gap-1 font-bold">
                        {isDeclining ? (
                          <TrendingDown className="w-4 h-4 text-rose-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        )}
                        <span className={isDeclining ? 'text-rose-600' : 'text-emerald-600'}>
                          {metrics.trend.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#52796F] mt-0.5 block">
                        {metrics.scoreChangeTotal !== 0 ? `${metrics.scoreChangeTotal > 0 ? '+' : ''}${metrics.scoreChangeTotal} pts over period` : 'Score stable'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#52796F] italic">
                      Awaiting initial scan
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => onScanThisCrop(crop.id)}
                className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#2D6A4F]/20 transition-all active:scale-95"
              >
                <Scan className="w-4 h-4 text-[#74C69D]" />
                <span>Scan This Crop</span>
              </button>

              {scans.length >= 2 && (
                <button
                  onClick={() => onCompareScans(scans[scans.length - 1].id, scans[0].id)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#132A13] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <GitCompare className="w-4 h-4 text-[#2D6A4F]" />
                  <span>Compare First & Last Scan</span>
                </button>
              )}

              <button
                onClick={() => onRunAgent(crop.id)}
                className="px-4 py-2 rounded-xl bg-[#F0F4F1] hover:bg-[#E5ECE7] text-[#1B4332] text-xs font-bold border border-[#2D6A4F]/20 flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-4 h-4 text-emerald-600" />
                <span>Run AI Agent</span>
              </button>

              <button
                onClick={() => onGenerateReport(crop.id)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#52796F] hover:text-[#132A13] text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <FileText className="w-4 h-4 text-gray-400" />
                <span>Generate Dossier</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Section 18: Crop Health Memory Chronological Timeline */}
      <div className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-outfit text-lg font-bold text-[#132A13]">
                Crop Health Memory (Sequential Timeline)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D8F3DC] text-[#1B4332] rounded-md">
                {scans.length} Scans Stored
              </span>
            </div>
            <p className="text-xs text-[#52796F] mt-0.5">
              Every scan is preserved to evaluate progression, symptom onset, and pathogen escalation over time.
            </p>
          </div>

          <span className="text-[11px] text-[#52796F] italic">
            Click any entry to examine its detailed diagnosis.
          </span>
        </div>

        {/* Timeline Horizontal Stepper (Desktop) / Vertical Stack (Mobile) */}
        {scans.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-[#F8FAF8] border border-dashed border-[#2D6A4F]/20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] mx-auto flex items-center justify-center">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="font-outfit text-base font-bold text-[#132A13]">
              No Scans Recorded Yet
            </h3>
            <p className="text-xs text-[#52796F] max-w-sm mx-auto leading-relaxed">
              Perform your first scan of {crop.name} to establish its baseline health score and begin recording Crop Health Memory.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onScanThisCrop(crop.id)}
                className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Scan className="w-4 h-4 text-[#74C69D]" />
                <span>Scan {crop.name}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {scans.map((s, idx) => {
              const isSelected = selectedScan?.id === s.id;
              const scanDate = new Date(s.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedScan(s)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? 'border-[#2D6A4F] bg-[#D8F3DC]/30 shadow-md ring-2 ring-[#2D6A4F]/20'
                      : 'border-gray-100 hover:border-gray-300 bg-[#F8FAF8]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Scan #{scans.length - idx} • {scanDate}
                      </span>
                      <span
                        className={`text-sm font-extrabold ${
                          s.healthScore >= 80 ? 'text-emerald-700' :
                          s.healthScore >= 70 ? 'text-amber-600' :
                          'text-rose-600'
                        }`}
                      >
                        {s.healthScore}
                        <span className="text-[9px] text-gray-400 font-normal">/100</span>
                      </span>
                    </div>

                    <div className="relative h-24 w-full rounded-xl overflow-hidden mt-2 bg-gray-200">
                      <img src={s.imageUrl} alt={s.condition} className="w-full h-full object-cover" />
                    </div>

                    <p className="font-bold text-xs text-[#132A13] mt-2 line-clamp-1">
                      {s.condition}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[10px]">
                    <span className="font-semibold capitalize text-gray-600">
                      {s.riskLevel.replace('_', ' ')}
                    </span>
                    <span className="text-[#2D6A4F] font-bold">
                      {isSelected ? 'Viewing' : 'Inspect'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Scan Deep Inspection Card (Section 16 & 17) */}
      {selectedScan && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider">
                Scan Diagnostic Record
              </span>
              <h3 className="font-outfit text-xl font-bold text-[#132A13] mt-1">
                {selectedScan.condition}
              </h3>
              <p className="text-xs text-[#52796F]">
                Captured on {new Date(selectedScan.timestamp).toLocaleString()} • Confidence: {Math.round(selectedScan.confidence * 100)}%
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                  selectedScan.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                  selectedScan.severity === 'high' ? 'bg-rose-50 text-rose-700' :
                  selectedScan.severity === 'moderate' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}
              >
                {selectedScan.severity} Severity
              </span>

              <div className="px-4 py-1.5 rounded-xl bg-[#1B4332] text-white font-extrabold text-sm">
                Score: {selectedScan.healthScore}/100
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Scan Image */}
            <div className="lg:col-span-5 aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative group">
              <img
                src={selectedScan.imageUrl}
                alt="Selected Scan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 pointer-events-none">
                <Eye className="w-4 h-4" />
                <span>Original High-Resolution Image</span>
              </div>
            </div>

            {/* Analysis Breakdown */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Symptoms Observed */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                  Observed Symptoms & Pathological Markers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedScan.symptoms.map((sym, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-[#F0F4F1] border border-[#2D6A4F]/15 text-[#1B4332] text-xs font-medium"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detailed Observations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                  Agronomic Observations
                </h4>
                <ul className="space-y-1.5 text-xs text-[#344E41]">
                  {selectedScan.observations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-1">
                  AI Contextual Diagnosis
                </h4>
                <p className="text-xs text-[#52796F] leading-relaxed bg-[#F8FAF8] p-3 rounded-xl border border-gray-100">
                  {selectedScan.explanation}
                </p>
              </div>

              {/* Recommended Next Steps */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                  Recommended Interventions
                </h4>
                <div className="space-y-1.5">
                  {selectedScan.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-start gap-2.5 text-xs text-[#132A13]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
