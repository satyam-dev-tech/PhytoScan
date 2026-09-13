import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sprout, Scan, AlertTriangle, FileText, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { Crop, CropScan, RiskEvent, Report, ViewState } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCrop: (cropId: string) => void;
  onNavigate: (view: ViewState) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCrop,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    crops: Crop[];
    scans: any[];
    risks: RiskEvent[];
    reports: Report[];
  }>({ crops: [], scans: [], risks: [], reports: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ crops: [], scans: [], risks: [], reports: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ crops: [], scans: [], risks: [], reports: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener (Escape to close, Cmd+K to open handled higher up)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = results.crops.length + results.scans.length + results.risks.length + results.reports.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-[#0B2512]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#2D6A4F]/20 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header Input */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search crops, field conditions, pathogens, reports..."
            className="flex-1 text-sm text-[#132A13] placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#F0F4F1] text-[#52796F] rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#52796F]">
              Searching Phytoscan Intelligence...
            </div>
          ) : !query ? (
            <div className="py-12 text-center text-xs text-gray-400">
              Type keywords to search across continuous crop health records.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Crops */}
              {results.crops.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block mb-2 px-2">
                    Crops ({results.crops.length})
                  </span>
                  <div className="space-y-1">
                    {results.crops.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          onSelectCrop(c.id);
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-[#F0F4F1] transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Sprout className="w-4 h-4 text-[#2D6A4F]" />
                          <div>
                            <p className="text-xs font-bold text-[#132A13]">{c.name}</p>
                            <p className="text-[11px] text-[#52796F]">{c.field} • {c.cropType}</p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-[#1B4332]">{c.currentHealthScore}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scans */}
              {results.scans.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block mb-2 px-2">
                    Scans ({results.scans.length})
                  </span>
                  <div className="space-y-1">
                    {results.scans.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectCrop(s.cropId);
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-[#F0F4F1] transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Scan className="w-4 h-4 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-[#132A13]">{s.condition}</p>
                            <p className="text-[11px] text-[#52796F]">{s.cropName} • {new Date(s.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {results.risks.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block mb-2 px-2">
                    Risks ({results.risks.length})
                  </span>
                  <div className="space-y-1">
                    {results.risks.map(r => (
                      <div
                        key={r.id}
                        onClick={() => {
                          onNavigate('risks');
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-[#F0F4F1] transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <div>
                            <p className="text-xs font-bold text-[#132A13]">{r.title}</p>
                            <p className="text-[11px] text-[#52796F] line-clamp-1">{r.description}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {r.riskLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports */}
              {results.reports.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] block mb-2 px-2">
                    Reports ({results.reports.length})
                  </span>
                  <div className="space-y-1">
                    {results.reports.map(rep => (
                      <div
                        key={rep.id}
                        onClick={() => {
                          onNavigate('reports');
                          onClose();
                        }}
                        className="p-3 rounded-xl hover:bg-[#F0F4F1] transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#2D6A4F]" />
                          <div>
                            <p className="text-xs font-bold text-[#132A13]">{rep.title}</p>
                            <p className="text-[11px] text-[#52796F]">{rep.cropName} • {rep.dateRange}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
