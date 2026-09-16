import React, { useState, useEffect } from 'react';
import { X, GitCompare, ArrowRight, TrendingDown, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { CropScan, Crop } from '../types';
import { api } from '../lib/api';

interface ScanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousScanId: string;
  currentScanId: string;
}

export const ScanComparisonModal: React.FC<ScanComparisonModalProps> = ({
  isOpen,
  onClose,
  previousScanId,
  currentScanId
}) => {
  const [data, setData] = useState<{
    crop: Crop;
    previousScan: CropScan;
    currentScan: CropScan;
    comparison: {
      scoreDiff: number;
      progressionSummary: string;
      newSymptoms: string[];
      escalatingRisks: string[];
      actionableAdvice: string;
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && previousScanId && currentScanId) {
      setIsLoading(true);
      api.compareScans(previousScanId, currentScanId)
        .then(setData)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, previousScanId, currentScanId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2512]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#2D6A4F]/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 bg-[#1B4332] text-white flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-[#74C69D] flex items-center justify-center shrink-0">
              <GitCompare className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-outfit text-base sm:text-lg font-bold break-words">Chronological Scan Comparison</h3>
              <p className="text-xs text-[#D8F3DC]/80 break-words">
                Evaluating pathological progression between two time points.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-300 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 text-center text-[#52796F]">
            <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Comparing Scan Pathology with Gemini...</p>
          </div>
        ) : !data ? (
          <div className="p-8 text-center text-gray-500">
            Failed to load comparison data.
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-w-0">
            
            {/* Score Delta Banner */}
            <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#52796F] break-words">
                  Monitored Crop: {data.crop.name}
                </p>
                <p className="font-outfit text-base sm:text-lg font-bold text-[#132A13] mt-0.5 break-words">
                  Health Delta: {data.comparison.scoreDiff > 0 ? `+${data.comparison.scoreDiff}` : data.comparison.scoreDiff} Points
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Baseline</span>
                  <span className="font-extrabold text-sm text-[#1B4332]">
                    {data.previousScan.healthScore}/100
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <div className="text-left">
                  <span className="text-xs text-gray-500 block">Recent</span>
                  <span className={`font-extrabold text-sm ${data.currentScan.healthScore < data.previousScan.healthScore ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {data.currentScan.healthScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Previous Scan */}
              <div className="p-5 rounded-2xl border border-gray-200 bg-[#F8FAF8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                    Previous Scan
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(data.previousScan.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-200">
                  <img src={data.previousScan.imageUrl} alt="Previous Scan" className="w-full h-full object-cover" />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#132A13]">
                    {data.previousScan.condition}
                  </h4>
                  <p className="text-xs text-[#52796F] mt-1">
                    Health Score: <strong>{data.previousScan.healthScore}</strong> • Severity: {data.previousScan.severity}
                  </p>
                </div>
              </div>

              {/* Current Scan */}
              <div className="p-5 rounded-2xl border-2 border-[#2D6A4F]/30 bg-[#D8F3DC]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1B4332] text-white text-[10px] font-bold uppercase tracking-wider">
                    Current Scan
                  </span>
                  <span className="text-xs text-[#1B4332] font-semibold">
                    {new Date(data.currentScan.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-200">
                  <img src={data.currentScan.imageUrl} alt="Current Scan" className="w-full h-full object-cover" />
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#132A13]">
                    {data.currentScan.condition}
                  </h4>
                  <p className="text-xs text-[#52796F] mt-1">
                    Health Score: <strong className="text-rose-600">{data.currentScan.healthScore}</strong> • Severity: {data.currentScan.severity}
                  </p>
                </div>
              </div>

            </div>

            {/* AI Comparative Progression Explanation */}
            <div className="p-5 rounded-2xl bg-white border border-[#2D6A4F]/20 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>AI Comparative Progression Finding</span>
              </div>
              <p className="text-xs text-[#344E41] leading-relaxed">
                {data.comparison.progressionSummary}
              </p>

              {data.comparison.newSymptoms.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                    Newly Emerged Symptoms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.comparison.newSymptoms.map((sym, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] block mb-1">
                  Strategic Recommendation
                </span>
                <p className="text-xs text-[#52796F]">
                  {data.comparison.actionableAdvice}
                </p>
              </div>
            </div>

          </div>
        )}

        <div className="px-6 py-3 bg-[#F8FAF8] border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
};
