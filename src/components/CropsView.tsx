import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  Trash2,
  Edit2,
  Calendar,
  Layers
} from 'lucide-react';
import { Crop, Farm } from '../types';
import { api } from '../lib/api';
import { useData } from '../context/DataContext';

interface CropsViewProps {
  onSelectCrop: (cropId: string) => void;
  onOpenAddCrop: () => void;
}

export const CropsView: React.FC<CropsViewProps> = ({ onSelectCrop, onOpenAddCrop }) => {
  const { crops, deleteCrop, isRestoring } = useData();
  const [farms] = useState<Farm[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const isLoading = isRestoring;

  const handleDelete = async (e: React.MouseEvent, cropId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this crop and its scan records?')) {
      try {
        await deleteCrop(cropId);
        // Also call server API
        try {
          await api.deleteCrop(cropId);
        } catch {}
      } catch (err) {
        console.error('Failed to delete crop', err);
      }
    }
  };

  // Filter logic
  const filteredCrops = crops.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.variety && c.variety.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || c.cropType.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const cropTypes: string[] = Array.from(new Set(crops.map(c => c.cropType)));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2D6A4F]/10 min-w-0">
        <div className="min-w-0">
          <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#132A13] break-words">
            Crop Management
          </h1>
          <p className="text-sm text-[#52796F] mt-0.5 break-words">
            Monitor plots, examine individual health memory, and schedule scans.
          </p>
        </div>

        <button
          onClick={onOpenAddCrop}
          className="px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center gap-2 active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Crop</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by crop name, field, or variety..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              typeFilter === 'all'
                ? 'bg-[#1B4332] text-white'
                : 'bg-white border border-gray-200 text-[#52796F] hover:border-gray-300'
            }`}
          >
            All Types ({crops.length})
          </button>
          {cropTypes.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                typeFilter.toLowerCase() === type.toLowerCase()
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white border border-gray-200 text-[#52796F] hover:border-gray-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Crops List Grid */}
      {filteredCrops.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-[#2D6A4F]/20 space-y-3">
          <Sprout className="w-10 h-10 text-[#40916C] mx-auto opacity-60" />
          <p className="font-bold text-[#132A13] text-base">No matching crops found</p>
          <p className="text-xs text-[#52796F]">Try adjusting your search criteria or register a new plot.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map(crop => {
            const isDeclining = crop.trend === 'declining' || crop.currentHealthScore < 75;
            const isImproving = crop.trend === 'improving';

            return (
              <div
                key={crop.id}
                onClick={() => onSelectCrop(crop.id)}
                className="group rounded-3xl bg-white border border-[#2D6A4F]/10 hover:border-[#2D6A4F]/30 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between relative"
              >
                {/* Image & Header Badges */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={crop.imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'}
                    alt={crop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                      {crop.cropType}
                    </span>

                    <button
                      onClick={(e) => handleDelete(e, crop.id)}
                      className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600 text-white backdrop-blur-md transition-colors"
                      title="Delete crop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white min-w-0">
                    <div className="min-w-0 flex-1 pr-1">
                      <h3 className="font-outfit text-base sm:text-lg font-bold text-white drop-shadow-md break-words line-clamp-2">
                        {crop.name}
                      </h3>
                      <p className="text-xs text-gray-200 flex flex-wrap items-center gap-1 drop-shadow-xs break-words">
                        <span className="break-words">{crop.field}</span>
                        {crop.variety && <span className="break-words">• {crop.variety}</span>}
                      </p>
                    </div>

                    <div className="text-right backdrop-blur-md bg-white/20 px-2.5 py-1.5 rounded-xl border border-white/30 shrink-0">
                      {(crop.totalScans || 0) > 0 ? (
                        <>
                          <span className="font-outfit text-xl font-extrabold text-white">
                            {crop.currentHealthScore}
                          </span>
                          <span className="text-[10px] text-gray-200">/100</span>
                        </>
                      ) : (
                        <span className="font-outfit text-xs font-semibold text-gray-200">
                          Unscanned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {(crop.totalScans || 0) > 0 ? (
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

                    {(crop.totalScans || 0) > 0 ? (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          crop.currentRiskLevel === 'high' ? 'bg-rose-100 text-rose-700' :
                          crop.currentRiskLevel === 'elevated' ? 'bg-amber-100 text-amber-800' :
                          crop.currentRiskLevel === 'moderate' ? 'bg-amber-50 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {crop.currentRiskLevel} Risk
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                        Pending Scan
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-[#52796F]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Planted: {new Date(crop.plantingDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      <span>{crop.totalScans || 0} Scans in Health Memory</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#2D6A4F] group-hover:text-[#1B4332]">
                    <span>Open Crop Memory & Timeline</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
