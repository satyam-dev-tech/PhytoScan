import React, { useState } from 'react';
import { Sprout, MapPin, Globe, ChevronRight, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, createCropInFirestore } from '../lib/firestoreService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn'>(user?.language || 'en');
  const [farmName, setFarmName] = useState(user?.name ? `${user.name.split(' ')[0]}'s Farm` : '');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');
  
  // First Crop State
  const [cropName, setCropName] = useState('');
  const [cropType, setCropType] = useState('Tomato');
  const [variety, setVariety] = useState('');
  const [field, setField] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Submit to server API
      await api.submitOnboarding({
        farmerName,
        language,
        farmName,
        farmLocation,
        farmSizeAcres: Number(farmSizeAcres) || 40,
        firstCrop: {
          name: cropName,
          cropType,
          variety,
          field,
          plantingDate,
          notes: 'First registered crop during onboarding.'
        }
      });

      // 2. Persist directly in Cloud Firestore as source of truth
      if (user?.id && user.id !== 'demo_agronomist_phytoscan') {
        await updateUserProfile(user.id, {
          name: farmerName || user.name,
          language: language || user.language,
          farmName: farmName || 'My Primary Farm',
          location: farmLocation || 'Regional Sector',
          onboarded: true
        });

        if (cropName && cropName.trim()) {
          try {
            const now = new Date().toISOString();
            await createCropInFirestore({
              userId: user.id,
              farmId: 'farm_primary',
              name: cropName.trim(),
              cropType,
              variety: variety.trim() || 'Standard Variety',
              field: field.trim() || 'Field 1',
              location: farmLocation.trim() || 'Regional Sector',
              plantingDate: plantingDate || now.split('T')[0],
              notes: 'First registered crop during onboarding.',
              imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
              status: 'active',
              currentHealthScore: 0,
              currentRiskLevel: 'low',
              createdAt: now,
              updatedAt: now
            }, user.id);
          } catch (cropErr) {
            console.warn('Initial crop firestore creation notice:', cropErr);
          }
        }
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      await refreshUser();
      onComplete();
    } catch (err) {
      console.error('Onboarding failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2512]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#2D6A4F]/20 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[#74C69D] text-[11px] font-bold uppercase tracking-wider">
              Step {step} of 3
            </span>
            <span className="text-xs text-[#D8F3DC]">Welcome to Phytoscan</span>
          </div>

          <h3 className="font-outfit text-xl font-bold mt-2">
            {step === 1 && 'Configure Farmer Profile'}
            {step === 2 && 'Register Your Primary Farm'}
            {step === 3 && 'Add Your First Monitored Crop'}
          </h3>
          <p className="text-xs text-[#D8F3DC]/80 mt-0.5">
            {step === 1 && 'Personalize your intelligence dashboard and language preference.'}
            {step === 2 && 'Set your farm location for localized surveillance.'}
            {step === 3 && 'Start your crop health memory timeline.'}
          </p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/20 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-[#74C69D] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={farmerName}
                  onChange={e => setFarmerName(e.target.value)}
                  placeholder="e.g. Satyam Chandra"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 text-sm outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Preferred Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                    { code: 'bn', label: 'Bengali', native: 'বাংলা' }
                  ].map(item => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setLanguage(item.code as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        language === item.code
                          ? 'border-[#2D6A4F] bg-[#D8F3DC]/50 text-[#1B4332] font-bold shadow-2xs'
                          : 'border-gray-200 hover:border-gray-300 text-[#52796F]'
                      }`}
                    >
                      <p className="text-sm">{item.native}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Farm Name
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  placeholder="e.g. Green Valley Agro"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={e => setFarmLocation(e.target.value)}
                  placeholder="e.g. Salinas Valley, California"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Farm Size (Acres)
                </label>
                <input
                  type="number"
                  value={farmSizeAcres}
                  onChange={e => setFarmSizeAcres(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 text-sm outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                  Crop Name
                </label>
                <input
                  type="text"
                  value={cropName}
                  onChange={e => setCropName(e.target.value)}
                  placeholder="e.g. Tomato Field A"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                    Crop Type
                  </label>
                  <select
                    value={cropType}
                    onChange={e => setCropType(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none bg-white"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Corn">Corn</option>
                    <option value="Potato">Potato</option>
                    <option value="Pepper">Bell Pepper</option>
                    <option value="Rice">Rice</option>
                    <option value="Cotton">Cotton</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                    Variety (Optional)
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={e => setVariety(e.target.value)}
                    placeholder="e.g. Roma VF"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                    Field / Plot
                  </label>
                  <input
                    type="text"
                    value={field}
                    onChange={e => setField(e.target.value)}
                    placeholder="e.g. Field 1 - Sector 3"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#132A13] uppercase tracking-wider mb-1.5">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    value={plantingDate}
                    onChange={e => setPlantingDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-[#F8FAF8] border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm font-semibold text-[#52796F] hover:text-[#132A13] transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-[#2D6A4F]/20 transition-all active:scale-95"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#1B4332]/25 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#74C69D]" />
              <span>{isSubmitting ? 'Finalizing Setup...' : 'Enter Dashboard'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
