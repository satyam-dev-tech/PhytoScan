import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sprout,
  Sparkles,
  ChevronRight,
  Download
} from 'lucide-react';
import { Report, Crop, ViewState } from '../types';
import { api } from '../lib/api';
import { Logo } from './Logo';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface ReportsViewProps {
  onNavigate: (view: ViewState) => void;
  onSelectCrop: (cropId: string) => void;
  preselectedCropId?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  onNavigate,
  onSelectCrop,
  preselectedCropId
}) => {
  const { user } = useAuth();
  const { reports: contextReports, crops, addReport, isRestoring } = useData();
  const [reports, setReports] = useState<Report[]>(contextReports);
  const [selectedCropId, setSelectedCropId] = useState<string>(preselectedCropId || (crops[0]?.id || ''));
  const [activeReport, setActiveReport] = useState<Report | null>(contextReports[0] || null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const isLoading = isRestoring;

  useEffect(() => {
    setReports(contextReports);
    if (!activeReport && contextReports.length > 0) {
      setActiveReport(contextReports[0]);
    }
  }, [contextReports]);

  useEffect(() => {
    if (!selectedCropId && crops.length > 0) {
      setSelectedCropId(crops[0].id);
    }
  }, [crops, selectedCropId]);

  const handleGenerateReport = async () => {
    if (!selectedCropId || isGenerating) return;

    setIsGenerating(true);
    try {
      const newReport = await api.generateReport(selectedCropId);
      try {
        await addReport({
          ...newReport,
          userId: user?.id || ''
        });
      } catch (reportErr) {
        console.warn('Report Firestore save notice:', reportErr);
      }
      setReports(prev => [newReport, ...prev]);
      setActiveReport(newReport);
    } catch (err: any) {
      console.error('Failed to generate report', err);
      alert(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Generator Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2D6A4F]/10">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider">
            Diagnostic Documentation
          </span>
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#132A13] mt-1">
            Crop Health Intelligence Reports
          </h1>
          <p className="text-sm text-[#52796F] mt-0.5">
            Synthesized field health dossiers compiled from chronological image scans and risk models.
          </p>
        </div>

        {/* Generate Report Form */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}
            disabled={crops.length === 0}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold outline-none bg-white text-[#132A13] disabled:opacity-50"
          >
            {crops.length === 0 ? (
              <option value="">No crops registered</option>
            ) : (
              crops.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.field})
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !selectedCropId || crops.length === 0}
            className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#74C69D]" />
            <span>{isGenerating ? 'Generating...' : 'Generate New Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Reports List on Left, Active Report Document on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Reports Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#52796F]">
            Saved Field Reports ({reports.length})
          </h3>

          {reports.length === 0 && !isLoading && (
            <div className="p-6 rounded-2xl bg-white border border-dashed border-gray-200 text-center">
              <p className="text-xs text-gray-500">No reports generated yet.</p>
            </div>
          )}

          <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {reports.map(rep => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2D6A4F] bg-[#D8F3DC]/30 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase">
                    <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    <span className="text-[#1B4332]">{rep.healthScore}/100</span>
                  </div>
                  <h4 className="font-outfit font-bold text-sm text-[#132A13] mt-1">
                    {rep.cropName}
                  </h4>
                  <p className="text-xs text-[#52796F] line-clamp-1 mt-0.5">
                    {rep.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Agronomy Dossier View */}
        <div className="lg:col-span-8">
          {activeReport ? (
            <div className="bg-white rounded-3xl border border-[#2D6A4F]/20 shadow-xl p-6 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none">
              
              {/* Report Header Bar */}
              <div className="flex items-start justify-between border-b border-gray-200 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <Logo size="sm" showTagline={false} />
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#1B4332] text-white rounded">
                      Field Dossier
                    </span>
                  </div>
                  <h2 className="font-outfit text-2xl font-bold text-[#132A13] mt-2">
                    {activeReport.title}
                  </h2>
                  <p className="text-xs text-[#52796F] mt-1">
                    Surveillance Period: <strong>{activeReport.dateRange}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-[#132A13] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Printer className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Print Dossier</span>
                  </button>
                </div>
              </div>

              {/* Farmer & Farm Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8FAF8] border border-gray-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Farmer / Operator</span>
                  <span className="font-semibold text-[#132A13]">{activeReport.farmerName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Farm Name</span>
                  <span className="font-semibold text-[#132A13]">{activeReport.farmName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Health Indicator</span>
                  <span className="font-bold text-[#1B4332]">{activeReport.healthScore} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Trajectory Trend</span>
                  <span className="font-bold text-amber-700">{activeReport.healthTrend}</span>
                </div>
              </div>

              {/* Automated Diagnostic Summary */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                  Executive Agronomic Summary
                </h3>
                <p className="text-xs text-[#344E41] leading-relaxed bg-[#F8FAF8] p-4 rounded-2xl border border-gray-100">
                  {activeReport.summary}
                </p>
              </div>

              {/* Key Observations & Risk Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                    Key Historical Observations
                  </h3>
                  <ul className="space-y-2 text-xs text-[#344E41]">
                    {activeReport.observations.map((obs, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                    Risk Indicators & Pathogen Pressure
                  </h3>
                  <ul className="space-y-2 text-xs text-[#344E41]">
                    {activeReport.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Interventions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                  Recommended Monitoring & Field Interventions
                </h3>
                <div className="space-y-2">
                  {activeReport.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#F8FAF8] border border-gray-100 text-xs text-[#132A13] flex items-start gap-2.5"
                    >
                      <span className="font-bold text-[#1B4332]">{i + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="pt-6 border-t border-gray-200 text-[10px] text-gray-500 leading-relaxed italic flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>{activeReport.disclaimer}</span>
              </div>

            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
              <FileText className="w-10 h-10 text-[#40916C] mx-auto opacity-50" />
              <h3 className="font-outfit font-bold text-[#132A13] text-base">
                No Dossier Selected
              </h3>
              <p className="text-xs text-[#52796F] max-w-sm mx-auto">
                {reports.length > 0
                  ? 'Select a report from the left column to review detailed agronomic findings and treatment plans.'
                  : 'Field health reports synthesize consecutive leaf scans, pathogen progression, and historical health scores into actionable dossiers.'}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
