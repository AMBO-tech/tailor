import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { compressImage } from '@utils/imageCompressor';
import { toast } from '@services/toast';

interface PhotoCaptureInputProps {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}

export const PhotoCaptureInput: React.FC<PhotoCaptureInputProps> = ({
  value,
  onChange,
  label = 'Photo du tissu / modèle',
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount or modal close
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Handle native file or camera input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.75);
        onChange(compressed);
      } catch (err) {
        console.error('Erreur compression:', err);
        toast.error('Erreur lors du traitement de la photo.');
      } finally {
        setIsCompressing(false);
        // Reset input value so same photo can be re-selected if needed
        e.target.value = '';
      }
    }
  };

  // Open In-App Live Camera Viewfinder
  const startLiveCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setIsCameraModalOpen(true);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Caméra non disponible sur ce navigateur. Utilisez le bouton natif.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live camera error, falling back to native capture:', err);
      setCameraError(err.message || "Impossible d'accéder à la caméra.");
    }
  };

  // Capture frame from live video element
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip if user-facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

    onChange(dataUrl);
    stopCameraStream();
    setIsCameraModalOpen(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const closeLiveCamera = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        {value && (
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" /> Photo attachée
          </span>
        )}
      </div>

      {/* Hidden file inputs */}
      {/* 1. Gallery input without capture */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* 2. Direct Camera input with capture="environment" for native phones */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Photo Preview or Upload/Camera Actions */}
      {value ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setPreviewZoomOpen(true)}
              className="relative group shrink-0"
              title="Agrandir la photo"
            >
              <img
                src={value}
                alt="Aperçu tissu"
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:opacity-90 transition"
              />
              <div className="absolute inset-0 bg-slate-900/20 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Photo enregistrée</p>
              <p className="text-[11px] text-slate-500 truncate">Compressée & prête</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  startLiveCamera();
                } else if (cameraInputRef.current) {
                  cameraInputRef.current.click();
                }
              }}
              className="p-2 text-slate-600 hover:text-amber-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition text-xs font-semibold flex items-center gap-1"
              title="Reprendre"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reprendre</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
              title="Supprimer la photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Option A: Prendre Photo (Camera) */}
          <button
            type="button"
            disabled={isCompressing}
            onClick={() => {
              if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                startLiveCamera();
              } else if (cameraInputRef.current) {
                cameraInputRef.current.click();
              }
            }}
            className="bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50 text-center"
          >
            {isCompressing ? (
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="block text-xs font-bold">Prendre Photo</span>
              <span className="block text-[10px] text-amber-700/80">Ouvrir la caméra</span>
            </div>
          </button>

          {/* Option B: Importer depuis Galerie / Fichier */}
          <button
            type="button"
            disabled={isCompressing}
            onClick={() => {
              if (galleryInputRef.current) {
                galleryInputRef.current.click();
              }
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50 text-center"
          >
            {isCompressing ? (
              <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="block text-xs font-bold">Importer Fichier</span>
              <span className="block text-[10px] text-slate-500">Galerie / Documents</span>
            </div>
          </button>
        </div>
      )}

      {/* Live Camera Viewfinder Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in">
          {/* Top Bar */}
          <div className="w-full max-w-md flex items-center justify-between text-white py-2 shrink-0">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold">Prise de Vue Tissu</span>
            </div>
            <button
              type="button"
              onClick={closeLiveCamera}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Viewfinder */}
          <div className="w-full max-w-md flex-1 relative bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl my-2">
            {cameraError ? (
              <div className="p-6 text-center text-white space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    closeLiveCamera();
                    if (cameraInputRef.current) cameraInputRef.current.click();
                  }}
                  className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Utiliser l'Appareil Photo Natif
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                />
                {/* Viewfinder Guide Overlay */}
                <div className="absolute inset-8 border border-white/30 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400 absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400 absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400 absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400 absolute bottom-0 right-0" />
                  <p className="text-[11px] text-white/70 bg-black/40 px-2 py-1 rounded-md">
                    Cadrez le tissu ou modèle
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Bottom Camera Controls */}
          {!cameraError && (
            <div className="w-full max-w-md flex items-center justify-around py-3 shrink-0">
              {/* Switch Camera */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition active:scale-95"
                title="Changer de caméra"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center bg-amber-500 hover:bg-amber-400 active:scale-90 transition shadow-lg"
                title="Capturer"
              >
                <div className="w-14 h-14 rounded-full bg-amber-400 border-2 border-slate-950/20" />
              </button>

              {/* Native Camera fallback */}
              <button
                type="button"
                onClick={() => {
                  closeLiveCamera();
                  if (cameraInputRef.current) cameraInputRef.current.click();
                }}
                className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition active:scale-95 text-xs font-bold"
                title="Appareil photo système"
              >
                Natif
              </button>
            </div>
          )}
        </div>
      )}

      {/* Zoom Fullscreen Preview Modal */}
      {previewZoomOpen && value && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewZoomOpen(false)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewZoomOpen(false)}
              className="absolute -top-10 right-0 text-white p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={value}
              alt="Zoom Tissu"
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
