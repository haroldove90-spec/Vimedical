import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'info'
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-12 h-12 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      default: return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 shadow-red-500/20';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
      default: return 'bg-primary hover:bg-primary/90 shadow-primary/20';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8 pb-0 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
              type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
            }`}>
              {getIcon()}
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
          </div>

          <div className="p-8 flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all scale-100 active:scale-95 ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
          
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
