import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronRight,
  HelpCircle,
  Image as ImageIcon,
  Check,
  X,
  TrendingDown,
  TrendingUp,
  Minus,
  MessageSquare,
  History,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Crop, CropScan, ViewState } from '../types';
import { api } from '../lib/api';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { validateImageFile, optimizeImageForPersistence } from '../lib/imageUtils';

interface ScanViewProps {
  preselectedCropId?: string;
  onNavigate: (view: ViewState) => void;
  onScanSaved: (cropId: string) => void;
  onOpenAddCrop: () => void;
}

const SAMPLE_IMAGES = [
  {
    label: 'Early Blight Symptoms',
    cropType: 'Tomato',
    url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Healthy Canopy Vigor',
    cropType: 'Tomato',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Nitrogen Chlorosis',
    cropType: 'Wheat',
    url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80'
  },
  {
    label: 'Foliar Spotting',
    cropType: 'Potato',
    url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
  }
];

const SCAN_STAGES = [
  'Validating Image Quality',
  'Analyzing Foliar Cellular Structure',
  'Evaluating Pathogen Indicators',
  'Cross-Referencing Plot Scan History',
  'Calculating Deterministic Health Score',
  'Synthesizing Agronomic Recommendations'
];

export const ScanView: React.FC<ScanViewProps> = ({
  preselectedCropId,
  onNavigate,
  onScanSaved,
  onOpenAddCrop
}) => {
  const { user } = useAuth();
  const { crops, scans, risks, addScan, addRiskEvent } = useData();

  const [selectedCropId, setSelectedCropId] = useState<string>(preselectedCropId || (crops[0]?.id || ''));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);

  // Sync selectedCropId if crops change
  useEffect(() => {
    if (!selectedCropId && crops.length > 0) {
      setSelectedCropId(crops[0].id);
    }
  }, [crops, selectedCropId]);

  const selectedCrop = crops.find(c => c.id === selectedCropId);
  const cropScans = scans.filter(s => s.cropId === selectedCropId);
  const previousScan = cropScans.length > 0 ? cropScans[cropScans.length - 1] : undefined;

  // Handle Camera Startup
  const startCamera = async () => {
    setCameraError(null);
    setValidationError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error', err);
      setCameraError('Camera access could not be established. Please use file upload.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const optimized = await optimizeImageForPersistence(rawDataUrl, 800, 800, 0.75);
        setImagePreview(optimized.dataUrl);
        setMimeType(optimized.mimeType);
        setAnalysisResult(null);
        setValidationError(null);
        stopCamera();
      }
    } catch (err: any) {
      console.error('Failed to capture photo', err);
      setValidationError('Failed to capture camera frame. Please try again.');
    }
  };

  // Handle File Input with strict validation & compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid image file.');
      return;
    }

    try {
      const optimized = await optimizeImageForPersistence(file, 800, 800, 0.75);
      setImagePreview(optimized.dataUrl);
      setMimeType(optimized.mimeType);
      setAnalysisResult(null);
      setSavedSuccess(false);
    } catch (err: any) {
      console.error('Failed to process image file', err);
      setValidationError('Failed to read and optimize image. Please try another photo.');
    }
  };

  // Handle Sample Selection
  const handleSelectSample = async (sample: typeof SAMPLE_IMAGES[0]) => {
    try {
      setValidationError(null);
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const optimized = await optimizeImageForPersistence(blob, 800, 800, 0.75);
      setImagePreview(optimized.dataUrl);
      setMimeType(optimized.mimeType);
      setAnalysisResult(null);
      setSavedSuccess(false);
    } catch (err) {
      console.error('Error loading sample image', err);
      setValidationError('Could not load sample photo.');
    }
  };

  // Run AI Multimodal Vision Analysis with Staged Animation
  const handleAnalyze = async () => {
    if (!imagePreview || !selectedCropId || !selectedCrop) return;

    setIsAnalyzing(true);
    setCurrentStageIdx(0);
    setAnalysisResult(null);
    setSavedSuccess(false);

    // Progressive stage animation timer
    const interval = setInterval(() => {
      setCurrentStageIdx(prev => (prev < SCAN_STAGES.length - 1 ? prev + 1 : prev));
    }, 750);

    try {
      // Pass real cropContext, previous scans, and recent risks to server
      const previousCropScans = scans.filter(s => s.cropId === selectedCropId);
      const previousCropRisks = risks.filter(r => r.cropId === selectedCropId);

      const response = await api.analyzeScan({
        cropId: selectedCropId,
        imageBase64: imagePreview,
        mimeType,
        cropContext: selectedCrop,
        previousScans: previousCropScans,
        recentRisks: previousCropRisks
      });

      clearInterval(interval);
      setCurrentStageIdx(SCAN_STAGES.length - 1);
      setAnalysisResult(response);
    } catch (err: any) {
      clearInterval(interval);
      console.error('Analysis failed', err);
      setValidationError(err.message || 'Image analysis failed. Please check network connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Scan to Crop Health Memory
  const handleSaveScan = async () => {
    if (!analysisResult || !selectedCropId || !selectedCrop) return;

    const { analysis, imageUrl } = analysisResult;
    if (analysis.imageQuality && !analysis.imageQuality.usable) {
      alert('Unusable images cannot be saved to crop health memory.');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Commit directly into Cloud Firestore as durable source of truth
      const savedDoc = await addScan({
        cropId: selectedCropId,
        cropName: selectedCrop.name,
        cropType: selectedCrop.cropType,
        field: selectedCrop.field,
        userId: user?.id || '',
        imageUrl,
        timestamp: new Date().toISOString(),
        healthScore: analysis.calculatedHealthScore ?? analysis.healthScore ?? 75,
        primaryCondition: analysis.primaryCondition,
        condition: analysis.primaryCondition,
        severity: analysis.severity || 'low',
        riskLevel: analysis.calculatedRiskLevel || analysis.riskLevel || 'low',
        confidence: analysis.confidence ?? 0.8,
        symptoms: Array.isArray(analysis.symptoms) ? analysis.symptoms : [],
        observations: Array.isArray(analysis.observations) ? analysis.observations : [],
        recommendations: Array.isArray(analysis.recommendedNextSteps) ? analysis.recommendedNextSteps : (analysis.recommendations || []),
        explanation: analysis.explanation,
        imageQuality: analysis.imageQuality,
        cropMatch: analysis.cropMatch,
        modelUsed: 'gemini-3.8-flash',
        rawAiResponse: analysis.rawAiOutput || null
      });

      setSavedScanId(savedDoc.id);

      // 2. If severity is moderate, high, or critical, create Risk Event in Firestore
      const isElevated = analysis.severity === 'moderate' || analysis.severity === 'high' || analysis.severity === 'critical';
      if (isElevated) {
        try {
          await addRiskEvent({
            cropId: selectedCropId,
            scanId: savedDoc.id,
            userId: user?.id || '',
            title: `Elevated Risk: ${analysis.primaryCondition}`,
            description: analysis.explanation || `Elevated symptoms detected during foliar scan.`,
            riskLevel: analysis.severity === 'critical' ? 'high' : analysis.severity === 'high' ? 'high' : 'moderate',
            severity: analysis.severity,
            recommendation: (analysis.recommendedNextSteps?.[0] || analysis.recommendations?.[0]) || 'Inspect foliage closely and apply targeted treatment.',
            date: new Date().toISOString().split('T')[0],
            resolved: false
          });
        } catch (riskErr) {
          console.warn('Risk event creation notice:', riskErr);
        }
      }

      // 3. Synchronize with server
      try {
        await api.saveScan({
          cropId: selectedCropId,
          imageUrl,
          healthScore: analysis.calculatedHealthScore ?? analysis.healthScore ?? 75,
          condition: analysis.primaryCondition,
          severity: analysis.severity,
          riskLevel: analysis.calculatedRiskLevel || 'stable',
          confidence: analysis.confidence,
          symptoms: analysis.symptoms || [],
          observations: analysis.observations || [],
          recommendations: analysis.recommendedNextSteps || analysis.recommendations || [],
          explanation: analysis.explanation,
          cropContext: selectedCrop
        });
      } catch (syncErr) {
        console.warn('Server scan sync notice:', syncErr);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      setSavedSuccess(true);
    } catch (err: any) {
      console.error('Failed to save scan', err);
      alert(err.message || 'Failed to save scan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setAnalysisResult(null);
    setSavedSuccess(false);
    setValidationError(null);
    stopCamera();
  };

  return (
    <div id="scan-view-container" className="p-3 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto space-y-6 min-w-0 overflow-hidden">
      
      {/* Header */}
      <div id="scan-header" className="border-b border-[#2D6A4F]/10 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider">
            Vision AI Engine
          </span>
          <span className="text-xs text-[#52796F]">• Server-Side Gemini Multimodal</span>
        </div>
        <h1 className="font-outfit text-2xl sm:text-3xl font-extrabold text-[#132A13] mt-1.5">
          Scan Crop Foliage
        </h1>
        <p className="text-sm text-[#52796F] mt-0.5">
          Capture or upload leaf photos for pathologically grounded assessment, deterministic health calculation, and durable timeline tracking.
        </p>
      </div>

      {/* Step 1: Select Monitored Crop */}
      <div id="step-select-crop" className="p-5 rounded-2xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#132A13] uppercase tracking-wider flex items-center gap-1.5">
            <span>1. Select Monitored Crop</span>
            <span className="text-[#2D6A4F]">*</span>
          </label>
          <button
            id="btn-add-crop-from-scan"
            onClick={onOpenAddCrop}
            className="text-xs text-[#2D6A4F] hover:text-[#1B4332] hover:underline font-bold transition-colors"
          >
            + Add New Crop
          </button>
        </div>

        {crops.length === 0 ? (
          <div className="p-5 rounded-xl bg-[#F8FAF8] border border-dashed border-[#2D6A4F]/20 text-center space-y-2">
            <p className="text-sm text-[#132A13] font-semibold">No monitored crops found in your farm memory.</p>
            <p className="text-xs text-[#52796F]">You need to register a crop before performing health scans.</p>
            <button
              onClick={onOpenAddCrop}
              className="mt-2 px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold hover:bg-[#1B4332] shadow-sm transition-all"
            >
              Add Your First Crop
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <select
              id="crop-select-dropdown"
              value={selectedCropId}
              onChange={e => {
                setSelectedCropId(e.target.value);
                setAnalysisResult(null);
                setSavedSuccess(false);
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2D6A4F] text-sm font-semibold outline-none bg-white text-[#132A13]"
            >
              {crops.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cropType} • {c.field}) — Current Health: {c.currentHealthScore}/100 • Risk: {c.currentRiskLevel.toUpperCase()}
                </option>
              ))}
            </select>

            {selectedCrop && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#52796F] px-1">
                <span>Field: <strong className="text-[#132A13]">{selectedCrop.field}</strong></span>
                <span>•</span>
                <span>Planting Date: <strong className="text-[#132A13]">{selectedCrop.plantingDate}</strong></span>
                <span>•</span>
                <span>Total Prior Scans: <strong className="text-[#132A13]">{cropScans.length}</strong></span>
                {previousScan && (
                  <>
                    <span>•</span>
                    <span>Last Condition: <strong className="text-[#132A13]">{previousScan.condition || previousScan.primaryCondition}</strong> ({previousScan.healthScore}/100)</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Image Capture or Upload */}
      <div id="step-image-acquisition" className="p-6 rounded-3xl bg-white border border-[#2D6A4F]/10 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#132A13] uppercase tracking-wider">
            2. Image Acquisition
          </label>

          {imagePreview && (
            <button
              id="btn-clear-image"
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replace Image</span>
            </button>
          )}
        </div>

        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Live Camera Stream */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-w-lg mx-auto shadow-inner">
            <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover" />
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
              <button
                id="btn-capture-photo"
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-white border-4 border-[#2D6A4F] shadow-xl flex items-center justify-center active:scale-95 transition-transform"
                title="Capture Frame"
              >
                <div className="w-10 h-10 rounded-full bg-[#2D6A4F]" />
              </button>
              <button
                onClick={stopCamera}
                className="px-3.5 py-1.5 rounded-xl bg-black/60 text-white text-xs font-bold backdrop-blur-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Image Preview or Dropzone */}
        {!isCameraActive && (
          <div>
            {imagePreview ? (
              <div className="relative max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#2D6A4F]/30 shadow-md">
                <img
                  src={imagePreview}
                  alt="Foliage scan preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-bold uppercase backdrop-blur-md">
                    Optimized for Vision AI
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 hover:border-[#2D6A4F]/40 rounded-2xl p-8 text-center transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] mx-auto flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-outfit font-bold text-sm text-[#132A13]">
                  Capture or Upload Foliage Photo
                </h4>
                <p className="text-xs text-[#52796F] mt-1 max-w-sm mx-auto">
                  Take a clear photo of the upper leaf surface, stems, or lesion margins in natural daylight.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    id="btn-start-camera"
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shadow-md shadow-[#2D6A4F]/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Use Camera</span>
                  </button>

                  <label
                    id="label-upload-image"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-[#132A13] text-xs font-bold cursor-pointer flex items-center gap-2 transition-colors bg-white shadow-2xs"
                  >
                    <Upload className="w-4 h-4 text-[#2D6A4F]" />
                    <span>Upload Photo File</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && (
                  <p className="text-xs text-amber-600 mt-3">{cameraError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sample Images Quick Selectors */}
        {!imagePreview && !isCameraActive && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider block mb-2">
              Or test with calibrated field samples:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="p-2 rounded-xl border border-gray-100 hover:border-[#2D6A4F]/40 bg-[#F8FAF8] hover:bg-white text-left transition-all group flex items-center gap-2"
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#132A13] truncate group-hover:text-[#1B4332]">
                      {sample.label}
                    </p>
                    <p className="text-[10px] text-[#52796F]">{sample.cropType}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Trigger Button */}
        {imagePreview && !analysisResult && (
          <div className="pt-4 flex justify-end">
            <button
              id="btn-analyze-scan"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedCropId}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white font-bold text-sm shadow-xl shadow-[#1B4332]/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#74C69D]" />
              <span>{isAnalyzing ? 'Analyzing Scan...' : 'Analyze Foliage with AI'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Staged Animation Indicator */}
      {isAnalyzing && (
        <div id="scan-progress-box" className="p-8 rounded-3xl bg-white border border-[#2D6A4F]/20 shadow-xl space-y-6 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] mx-auto flex items-center justify-center animate-bounce">
            <Sparkles className="w-7 h-7 text-[#2D6A4F]" />
          </div>

          <div>
            <h3 className="font-outfit text-xl font-bold text-[#132A13]">
              {SCAN_STAGES[currentStageIdx]}...
            </h3>
            <p className="text-xs text-[#52796F] mt-1">
              Gemini Vision is inspecting tissue pathology and comparing with {selectedCrop?.name || 'crop'} plot history.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            {SCAN_STAGES.map((st, i) => (
              <div
                key={i}
                className={`flex items-center justify-between text-xs px-3.5 py-1.5 rounded-xl transition-all ${
                  i === currentStageIdx
                    ? 'bg-[#D8F3DC] text-[#1B4332] font-bold shadow-2xs'
                    : i < currentStageIdx
                    ? 'text-emerald-700 font-medium'
                    : 'text-gray-400'
                }`}
              >
                <span>{st}</span>
                {i < currentStageIdx ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : i === currentStageIdx ? (
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 12: Handle Unusable Images */}
      {analysisResult && analysisResult.analysis.imageQuality && !analysisResult.analysis.imageQuality.usable && (
        <div id="unusable-image-warning" className="p-4 sm:p-6 lg:p-8 rounded-3xl bg-amber-50/90 border-2 border-amber-300 shadow-xl space-y-5 animate-in slide-in-from-bottom-4 min-w-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-800" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-outfit text-base sm:text-lg font-extrabold text-amber-950 break-words">
                Image Quality Insufficient for Diagnosis
              </h3>
              <p className="text-xs text-amber-800 mt-1 break-words">
                The AI vision engine detected quality barriers that prevent responsible agronomic evaluation.
              </p>
            </div>
          </div>

          {analysisResult.analysis.imageQuality.issues && analysisResult.analysis.imageQuality.issues.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/80 border border-amber-200 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Issues Detected:
              </h4>
              <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                {analysisResult.analysis.imageQuality.issues.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
              {analysisResult.analysis.imageQuality.notes && (
                <p className="text-xs text-amber-900 font-medium pt-1">
                  Note: {analysisResult.analysis.imageQuality.notes}
                </p>
              )}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-white/80 border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Tips for a Diagnostic Photo:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hold camera 6–8 inches from leaf</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ensure even daylight (avoid harsh glare)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Focus directly on the affected area</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Keep your hand steady before taking photo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      )}

      {/* Section 11: Complete Scan Result UI */}
      {analysisResult && (!analysisResult.analysis.imageQuality || analysisResult.analysis.imageQuality.usable) && (
        <div id="scan-result-card" className="p-4 sm:p-6 lg:p-8 rounded-3xl bg-white border border-[#2D6A4F]/20 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-300 min-w-0">
          
          {/* Responsible AI Banner */}
          <div className="p-4 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/20 text-[#1B4332] flex items-start gap-3 text-xs min-w-0">
            <Info className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-bold">Responsible AI Assessment: </span>
              <span className="break-words">
                AI-assisted assessment based on visual indicators. Field confirmation recommended. Not a substitute for certified laboratory tissue assay.
              </span>
            </div>
          </div>

          {/* Top Bar: Crop Name & Field */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] text-[10px] font-bold uppercase tracking-wider inline-block">
                {selectedCrop?.cropType || 'Crop'} Assessment
              </span>
              <h2 className="font-outfit text-lg sm:text-xl lg:text-2xl font-black text-[#132A13] mt-1 break-words">
                {selectedCrop?.name} <span className="text-[#52796F] font-normal text-sm sm:text-base">• {selectedCrop?.field}</span>
              </h2>
            </div>

            {/* Score Delta Indicator */}
            {analysisResult.analysis.scoreDelta !== undefined ? (
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                analysisResult.analysis.scoreDelta > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                analysisResult.analysis.scoreDelta < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {analysisResult.analysis.scoreDelta > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>+{analysisResult.analysis.scoreDelta} pts (Improving)</span>
                  </>
                ) : analysisResult.analysis.scoreDelta < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>{analysisResult.analysis.scoreDelta} pts (Declining)</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-gray-500" />
                    <span>Stable (0 pt delta)</span>
                  </>
                )}
              </div>
            ) : (
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 shrink-0">
                Baseline Plot Scan
              </span>
            )}
          </div>

          {/* Condition, Confidence, and Health Score Gauge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center min-w-0">
            
            <div className="sm:col-span-2 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    analysisResult.analysis.severity === 'critical' ? 'bg-rose-600 text-white' :
                    analysisResult.analysis.severity === 'high' ? 'bg-rose-500 text-white' :
                    analysisResult.analysis.severity === 'moderate' ? 'bg-amber-500 text-white' :
                    analysisResult.analysis.severity === 'low' ? 'bg-emerald-600 text-white' :
                    'bg-emerald-700 text-white'
                  }`}
                >
                  Severity: {analysisResult.analysis.severity}
                </span>
                <span className="text-xs text-[#52796F]">
                  • Confidence: <strong className="text-[#132A13]">{Math.round((analysisResult.analysis.confidence || 0.8) * 100)}%</strong>
                </span>
              </div>

              <h3 className="font-outfit text-xl sm:text-2xl font-extrabold text-[#132A13] break-words">
                {analysisResult.analysis.primaryCondition}
              </h3>

              {analysisResult.analysis.cropMatch && !analysisResult.analysis.cropMatch.matchesSelectedCrop && (
                <p className="text-xs text-amber-700 font-medium">
                  Notice: Detected foliage resembles <strong>{analysisResult.analysis.cropMatch.detectedCrop}</strong>.
                </p>
              )}
            </div>

            {/* Health Score Gauge */}
            <div className="p-5 rounded-2xl bg-[#F8FAF8] border border-[#2D6A4F]/20 flex flex-col items-center text-center justify-center">
              <span className="text-[11px] font-bold text-[#52796F] uppercase tracking-wider block">
                Crop Health Score
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span className={`font-outfit text-4xl font-black ${
                  (analysisResult.analysis.calculatedHealthScore ?? analysisResult.analysis.healthScore) >= 80 ? 'text-emerald-700' :
                  (analysisResult.analysis.calculatedHealthScore ?? analysisResult.analysis.healthScore) >= 65 ? 'text-amber-600' :
                  'text-rose-600'
                }`}>
                  {analysisResult.analysis.calculatedHealthScore ?? analysisResult.analysis.healthScore}
                </span>
                <span className="text-xs font-bold text-gray-400">/ 100</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                analysisResult.analysis.calculatedRiskLevel === 'high' ? 'bg-rose-100 text-rose-800' :
                analysisResult.analysis.calculatedRiskLevel === 'elevated' ? 'bg-amber-100 text-amber-800' :
                analysisResult.analysis.calculatedRiskLevel === 'moderate' ? 'bg-amber-50 text-amber-700' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                Risk: {analysisResult.analysis.calculatedRiskLevel || 'low'}
              </span>
            </div>

          </div>

          {/* Symptoms Chips */}
          {analysisResult.analysis.symptoms && analysisResult.analysis.symptoms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                Observed Foliar Symptoms
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.analysis.symptoms.map((symptom: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-[#E8F5E9] text-[#1B4332] text-xs font-semibold border border-[#2D6A4F]/15"
                  >
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Observations */}
          {analysisResult.analysis.observations && analysisResult.analysis.observations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                Pathological Observations
              </h4>
              <div className="space-y-1.5">
                {analysisResult.analysis.observations.map((obs: string, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F8FAF8] border border-gray-100 text-xs text-[#344E41] flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2D6A4F] mt-0.5 shrink-0" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contextual Agronomic Explanation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-1">
              AI Agronomist Explanation
            </h4>
            <p className="text-xs text-[#344E41] leading-relaxed bg-[#F8FAF8] p-4 rounded-xl border border-gray-100">
              {analysisResult.analysis.explanation}
            </p>
          </div>

          {/* Recommended Next Steps */}
          {((analysisResult.analysis.recommendedNextSteps || analysisResult.analysis.recommendations) || []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#132A13] mb-2">
                Recommended Actions
              </h4>
              <div className="space-y-1.5">
                {(analysisResult.analysis.recommendedNextSteps || analysisResult.analysis.recommendations || []).map((rec: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-gray-200 flex items-start gap-2.5 text-xs text-[#132A13]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit to Health Memory Action Bar */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#52796F]">
              {savedSuccess ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Successfully recorded into Cloud Firestore plot memory.
                </span>
              ) : (
                <span>Click save to persist this scan into Cloud Firestore crop health memory.</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!savedSuccess ? (
                <button
                  id="btn-save-to-crop-memory"
                  onClick={handleSaveScan}
                  disabled={isSaving}
                  className="px-7 py-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] shadow-lg shadow-[#1B4332]/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Firestore...' : 'Save to Crop Health Memory'}</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="btn-view-crop-history"
                    onClick={() => {
                      onScanSaved(selectedCropId);
                      onNavigate('crop-detail');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Crop History</span>
                  </button>

                  <button
                    id="btn-scan-another"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-[#132A13] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Scan Another Leaf</span>
                  </button>

                  <button
                    id="btn-ask-agronomist-about-scan"
                    onClick={() => onNavigate('assistant')}
                    className="px-4 py-2.5 rounded-xl bg-[#E8F5E9] hover:bg-[#D8F3DC] text-[#1B4332] text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask AI Agronomist</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
