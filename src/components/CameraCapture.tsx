import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

export function CameraCapture({ onCapture, onClose }: { onCapture: (blob: string) => void, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Por favor, asegúrese de dar los permisos necesarios.");
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
        {error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-white font-bold">{error}</p>
            <button onClick={onClose} className="mt-8 bg-white text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">Cerrar</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover aspect-[3/4]" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-6 right-6">
              <button onClick={onClose} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-10 inset-x-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl scale-100 active:scale-90 transition-transform border-8 border-white/20"
              >
                <div className="w-14 h-14 bg-white border-4 border-slate-900 rounded-full" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
