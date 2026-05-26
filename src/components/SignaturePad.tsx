import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'react-hot-toast';
import { Eraser, Check, X } from 'lucide-react';
import { trimCanvas } from '../utils/canvasHelper';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
  title: string;
}

export function SignaturePad({ onSave, onCancel, title }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clear = () => sigCanvas.current?.clear();
  
  const resizeCanvas = () => {
    if (sigCanvas.current && containerRef.current) {
      const canvas = sigCanvas.current.getCanvas();
      const container = containerRef.current;
      
      // Get the display size
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      
      // Set canvas size accounting for device pixel ratio
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      sigCanvas.current.clear();
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    const timer = setTimeout(resizeCanvas, 100);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timer);
    };
  }, []);

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor, proporcione una firma.');
      return;
    }
    const rawCanvas = sigCanvas.current?.getCanvas();
    const trimmedCanvas = rawCanvas ? trimCanvas(rawCanvas) : null;
    const signature = trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : '';
    onSave(signature);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Dibuje su firma en el recuadro</p>
          </div>
          <button onClick={onCancel} className="text-slate-300 hover:text-slate-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8">
          <div 
            ref={containerRef}
            className="w-full h-80 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 relative overflow-hidden"
          >
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="#0f172a"
              canvasProps={{
                className: "w-full h-full cursor-crosshair"
              }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button 
              onClick={clear}
              className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3"
            >
              <Eraser className="w-5 h-5" />
              Limpiar
            </button>
            <button 
              onClick={save}
              className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
            >
              <Check className="w-5 h-5" />
              Guardar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
