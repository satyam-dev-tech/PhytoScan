import React, { useState } from 'react';
import { X, Sprout, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropAdded: (cropId: string) => void;
}

const PRESET_IMAGES = [
  { label: 'Tomato Canopy', url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80' },
  { label: 'Wheat Field', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80' },
  { label: 'Corn Foliage', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80' },
  { label: 'Potato Vines', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80' }
];

export const AddCropModal: React.FC<AddCropModalProps> = ({ isOpen, onClose, onCropAdded }) => {
  const { user } = useAuth();
  const { addCrop } = useData();
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('Tomato');
  const [variety, setVariety] = useState('');
  const [field, setField] = useState('');
  const [location, setLocation] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !field) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const created = await addCrop({
        name,
        cropType,
        variety: variety || undefined,
        field,
        location: location || undefined,
        plantingDate,
        notes: notes || undefined,
        imageUrl: imageUrl || PRESET_IMAGES[0].url,
        status: 'active',
        currentHealthScore: 0,
        currentRiskLevel: 'low',
        userId: user?.id || '',
        farmId: user?.farmName || 'default-farm',
        createdAt: now,
        updatedAt: now
      });

      // Synchronize with server API
      try {
        await api.createCrop({
          name,
          cropType,
          variety: variety || undefined,
          field,
          location: location || undefined,
          plantingDate,
          notes: notes || undefined,
          imageUrl: imageUrl || PRESET_IMAGES[0].url
        });
      } catch (syncErr) {
        console.warn('Server crop sync notice:', syncErr);
      }

      onCropAdded(created.id);
      onClose();
    } catch (err) {
      console.error('Failed to create crop', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2512]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#2D6A4F]/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-[#1B4332] text-white flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-[#74C69D] flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-outfit text-base sm:text-lg font-bold break-words">Register Monitored Crop</h3>
              <p className="text-xs text-[#D8F3DC]/80 break-words">Add a plot to build continuous health memory.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-300 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
              Crop Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tomato Field B"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
                Crop Type *
              </label>
              <select
                value={cropType}
                onChange={e => setCropType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none bg-white"
              >
                <option value="Tomato">Tomato</option>
                <option value="Wheat">Wheat</option>
                <option value="Corn">Corn</option>
                <option value="Potato">Potato</option>
                <option value="Bell Pepper">Bell Pepper</option>
                <option value="Rice">Rice</option>
                <option value="Cotton">Cotton</option>
                <option value="Soybean">Soybean</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
                Variety (Optional)
              </label>
              <input
                type="text"
                value={variety}
                onChange={e => setVariety(e.target.value)}
                placeholder="e.g. San Marzano"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
                Field / Block *
              </label>
              <input
                type="text"
                required
                value={field}
                onChange={e => setField(e.target.value)}
                placeholder="e.g. Field 2 - North Plot"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
                Planting Date
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={e => setPlantingDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
              Field Location Notes
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Near irrigation canal, Section D"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
            />
          </div>

          {/* Foliage Image Selection */}
          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-2">
              Select Reference Cover Photo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_IMAGES.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${
                    imageUrl === img.url ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1">
              Initial Crop Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Soil conditions, baseline vigor, organic treatment history..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#52796F] hover:text-[#132A13] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Crop'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
