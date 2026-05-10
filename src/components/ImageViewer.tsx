import React from 'react';
import { motion } from 'motion/react';
import { X, Download, Maximize } from 'lucide-react';

export function ImageViewer({ isOpen, imageUrl, onClose }: { isOpen: boolean; imageUrl: string | null; onClose: () => void }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20 z-10"
      >
        <X className="w-8 h-8" />
      </button>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-full max-h-full flex items-center justify-center"
      >
        <img 
          src={imageUrl} 
          alt="Vista ampliada" 
          className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-4 border-white/10"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = `evidencia_${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest hover:text-secondary transition-colors"
          >
            <Download className="w-5 h-5" />
            Descargar
          </button>
          <div className="w-px h-4 bg-white/20" />
          <button 
            onClick={() => window.open(imageUrl, '_blank')}
            className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest hover:text-secondary transition-colors"
          >
            <Maximize className="w-5 h-5" />
            Original
          </button>
        </div>
      </motion.div>
    </div>
  );
}
