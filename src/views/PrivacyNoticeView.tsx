import React, { useState } from 'react';
import { ShieldCheck, CheckSquare, X } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { View } from '../types';
import { toast } from 'react-hot-toast';

interface PrivacyNoticeViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string) => void;
  onSaveSignature: (pId: string, signature: string, type: 'privacy' | 'consent') => void;
}

export function PrivacyNoticeView({ 
  patientId, 
  navigateTo, 
  onSaveSignature 
}: PrivacyNoticeViewProps) {
  const [accepted, setAccepted] = useState(false);
  const [showPad, setShowPad] = useState(false);

  const handleSaveSignature = (signature: string) => {
    onSaveSignature(patientId, signature, 'privacy');
    toast.success('Aviso de privacidad firmado correctamente');
    navigateTo('patient-detail', patientId);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => navigateTo('patient-detail', patientId)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Aviso de Privacidad</h2>
          <p className="text-slate-500 font-medium">Protección de datos personales y confidencialidad.</p>
        </div>
      </header>

      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 space-y-8">
        <div className="flex items-center gap-4 py-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Compromiso ViMedical</h3>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6">
          <p className="font-bold text-slate-900">
            De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, ViMedical hace de su conocimiento lo siguiente:
          </p>
          <p>
            1. <span className="font-bold text-slate-900">Finalidad:</span> Los datos personales y clínicos recabados serán utilizados exclusivamente para la prestación de servicios médicos, elaboración de expedientes clínicos, facturación y contacto en caso de emergencia.
          </p>
          <p>
            2. <span className="font-bold text-slate-900">Tratamiento de Datos Sensibles:</span> ViMedical tratará con estricta confidencialidad los datos relativos a su estado de salud presente y futuro, antecedentes genéticos y preferencias religiosas.
          </p>
          <p>
            3. <span className="font-bold text-slate-900">Transferencia:</span> Sus datos podrán ser transferidos a médicos interconsultantes o instituciones hospitalarias sólo cuando sea estrictamente necesario para su diagnóstico o tratamiento.
          </p>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
            "Reconozco que he leído y entendido los términos de este aviso de privacidad y consiento el tratamiento de mis datos personales según lo aquí descrito."
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 space-y-6">
          <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all group">
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={e => setAccepted(e.target.checked)}
              className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-slate-300" 
            />
            <span className="font-black text-slate-700 group-hover:text-primary transition-colors">Acepto los términos y condiciones del aviso de privacidad.</span>
          </label>

          <button 
            disabled={!accepted}
            onClick={() => setShowPad(true)}
            className="w-full bg-primary text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <CheckSquare className="w-6 h-6" />
            Proceder a Firmar Digitalmente
          </button>
        </div>
      </section>

      {showPad && (
        <SignaturePad 
          title="Firma de Aviso de Privacidad"
          onSave={handleSaveSignature}
          onCancel={() => setShowPad(false)}
        />
      )}
    </div>
  );
}
