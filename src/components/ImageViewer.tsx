import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Maximize, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageViewer({ isOpen, imageUrl, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset scale and position when image changes or viewer opens
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl, isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = prev - 0.5;
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Prevent zoom toggle if we were dragging
    if (e.defaultPrevented) return;
    
    // Toggle between 1x and 2.5x base zoom of what's clicked
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Support for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 overflow-hidden select-none">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20 z-20"
      >
        <X className="w-8 h-8" />
      </button>
      
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-full max-h-full flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Vista ampliada" 
            className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border-4 border-white/10 transition-transform duration-150 ease-out pointer-events-auto"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onClick={handleImageClick}
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/10 z-20 shadow-xl">
        <button 
          onClick={handleZoomIn}
          title="Acercar (Zoom In)"
          className="p-1.5 text-white/80 hover:text-white hover:scale-110 transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button 
          onClick={handleZoomOut}
          title="Alejar (Zoom Out)"
          className="p-1.5 text-white/80 hover:text-white hover:scale-110 transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={handleReset}
          title="Restablecer vista"
          className="p-1.5 text-white/80 hover:text-white hover:scale-110 transition-all border-r border-white/15 pr-3"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
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
    </div>
  );
}
