import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  GitCompare,
  FileText,
  Clock,
  ChevronRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Crop, AgentInvestigation, ViewState } from '../types';
import { api } from '../lib/api';

interface AiAgentViewProps {
  preselectedCropId?: string;
  onNavigate: (view: ViewState) => void;
  onSelectCrop: (cropId: string) => void;
  onCompareScans: (prevId: string, currId: string) => void;
  onGenerateReport: (cropId: string) => void;
}

export const AiAgentView: React.FC<AiAgentViewProps> = ({
  preselectedCropId,
  onNavigate,
  onSelectCrop,
  onCompareScans,
  onGenerateReport
}) => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>(preselectedCropId || '');
  const [requestText, setRequestText] = useState('');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [currentInvestigation, setCurrentInvestigation] = useState<AgentInvestigation | null>(null);
  const [pastInvestigations, setPastInvestigations] = useState<AgentInvestigation[]>([]);

  useEffect(() => {
    api.getCrops().then(res => {
      setCrops(res.crops || []);
      if (!selectedCropId && res.crops && res.crops.length > 0) {
        setSelectedCropId(res.crops[0].id);
      }
    }).catch(console.error);

    api.getPastInvestigations().then(setPastInvestigations).catch(console.error);
  }, []);

  const handleRunInvestigation = async (customQuery?: string) => {
    if (!selectedCropId || isInvestigating) return;

    setIsInvestigating(true);
    setCurrentInvestigation(null);

    const query = customQuery || requestText || 'Analyze health trajectory and pathogen trends over all historical scans';

    try {
      const result = await api.runAgentInvestigation({
        cropId: selectedCropId,
        request: query
      });
      setCurrentInvestigation(result);
      setPastInvestigations(prev => [result, ...prev]);
    } catch (err: any) {
      console.error('Investigation failed', err);
      alert(err.message || 'AI Agent investigation failed');
    } finally {
      setIsInvestigating(false);
    }
  };

  const selectedCrop = crops.find(c => c.id === selectedCropId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-6 overflow-hidden">
      
      {/* Header */}
      <div className="border-b border-[#2D6A4F]/10 pb-4 min-w-0">
        <span className="px-2.5 py-0.5 rounded-full bg-[#D8F3DC] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider inline-block">
          Autonomous Diagnostics
        </span>
        <h1 className="font-outfit text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#132A13] mt-1 flex flex-wrap items-center gap-2 break-words">
          <span>AI Agent Investigation Engine</span>
          <Bot className="w-6 h-6 text-[#2D6A4F] shrink-0" />
        </h1>
        <p className="text-sm text-[#52796F] mt-0.5 break-words">
          Dispatches sequential agronomic tools to analyze long-term leaf pathology, score deviations, and pathogen acceleration.
        </p>
      </div>

      {/* Investigation Setup Box */}
      <div className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
              Target Monitored Crop
            </label>
            <select
              value={selectedCropId}
              onChange={e => setSelectedCropId(e.target.value)}
              disabled={crops.length === 0}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm font-semibold outline-none bg-white text-[#132A13] disabled:opacity-50"
            >
              {crops.length === 0 ? (
                <option value="">No crops registered yet</option>
              ) : (
                crops.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cropType} • {c.field}) — Current: {c.totalScans > 0 ? `${c.currentHealthScore}/100` : 'Pending scan'}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
              Investigation Objective
            </label>
            <input
              type="text"
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
              placeholder="e.g. Analyze my tomato crop over the last month"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
            />
          </div>
        </div>

        {/* Quick Launch Directives */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[11px] font-bold text-[#52796F] uppercase">Quick Directives:</span>
          {[
            'Analyze health degradation over 21-day timeline',
            'Evaluate early blight pathogen progression',
            'Assess intervention urgency for this plot'
          ].map((dir, i) => (
            <button
              key={i}
              onClick={() => {
                setRequestText(dir);
                handleRunInvestigation(dir);
              }}
              className="px-3 py-1 rounded-xl bg-[#F0F4F1] hover:bg-[#D8F3DC] text-[11px] text-[#1B4332] font-semibold transition-colors"
            >
              {dir}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => handleRunInvestigation()}
            disabled={isInvestigating || !selectedCropId}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white text-xs font-bold shadow-lg shadow-[#1B4332]/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#74C69D]" />
            <span>{isInvestigating ? 'Executing Tool Pipeline...' : 'Launch AI Agent Investigation'}</span>
          </button>
        </div>
      </div>

      {/* Investigation Progress & Results */}
      {isInvestigating && (
        <div className="p-8 rounded-3xl bg-white border border-[#2D6A4F]/20 shadow-xl space-y-5 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] mx-auto flex items-center justify-center animate-pulse">
            <Bot className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-outfit text-lg font-bold text-[#132A13]">
              Autonomous Diagnostic Pipeline in Progress
            </h3>
            <p className="text-xs text-[#52796F] mt-0.5">
              Querying chronological image scans, evaluating lesion spread, and synthesizing report...
            </p>
          </div>
        </div>
      )}

      {currentInvestigation && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-3xl bg-white border border-[#2D6A4F]/20 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300 min-w-0">
          
          {/* Top Findings Overview Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-gray-100 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider inline-block">
                Investigation Result
              </span>
              <h3 className="font-outfit text-lg sm:text-xl font-bold text-[#132A13] mt-1 break-words">
                {currentInvestigation.request}
              </h3>
              <p className="text-xs text-[#52796F] break-words">
                Evaluated {currentInvestigation.metrics.scansEvaluated} scans across {currentInvestigation.metrics.daysSpan} days
              </p>
            </div>

            {/* Trajectory Badge */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/20 flex items-center gap-3 shrink-0 max-w-full">
              <div>
                <span className="text-[10px] font-bold text-[#52796F] uppercase block">
                  Trajectory Score
                </span>
                <span className="font-outfit text-2xl font-black text-[#132A13]">
                  {currentInvestigation.metrics.startScore} → {currentInvestigation.metrics.currentScore}
                </span>
              </div>
              <div className="border-l border-gray-200 pl-3">
                <span className="text-xs font-bold text-rose-600 block">
                  {currentInvestigation.metrics.scoreChange > 0 ? `+${currentInvestigation.metrics.scoreChange}` : currentInvestigation.metrics.scoreChange} pts
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-700">
                  {currentInvestigation.metrics.trend}
                </span>
              </div>
            </div>
          </div>

          {/* Step Execution Timeline (Section 27) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-3">
              Agent Execution Steps & Tool Verification
            </h4>
            <div className="space-y-2">
              {currentInvestigation.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#F8FAF8] border border-gray-100 flex items-start gap-3 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-[#132A13]">{step.step}</p>
                    {step.detail && (
                      <p className="text-[11px] text-[#52796F] mt-0.5 leading-relaxed">{step.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Finding Narrative (Section 28) */}
          <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/15 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B4332]">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Synthesized Agronomic Findings</span>
            </div>
            <div className="text-xs text-[#344E41] leading-relaxed space-y-2">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-bold text-[#1B4332]" {...props} />
                }}
              >
                {currentInvestigation.finding}
              </ReactMarkdown>
            </div>
          </div>

          {/* Action Buttons (Section 29) */}
          <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100">
            <button
              onClick={() => onSelectCrop(currentInvestigation.cropId)}
              className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#132A13] text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Inspect Crop Memory</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onGenerateReport(currentInvestigation.cropId)}
              className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Official Dossier</span>
            </button>
          </div>

        </div>
      )}

      {/* Past Investigations Feed */}
      {pastInvestigations.length > 0 && !currentInvestigation && (
        <div className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-4">
          <h3 className="font-outfit text-base font-bold text-[#132A13]">
            Previous Agent Investigations
          </h3>
          <div className="space-y-3">
            {pastInvestigations.map(inv => (
              <div
                key={inv.id}
                onClick={() => setCurrentInvestigation(inv)}
                className="p-4 rounded-2xl border border-gray-100 hover:border-[#2D6A4F]/30 bg-[#F8FAF8] hover:bg-white transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-xs text-[#132A13]">{inv.request}</p>
                  <p className="text-[11px] text-[#52796F] mt-0.5">
                    {new Date(inv.date).toLocaleDateString()} • Trajectory: {inv.metrics.startScore} → {inv.metrics.currentScore} ({inv.metrics.scoreChange} pts)
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F]">
                  <span>Review Dossier</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
