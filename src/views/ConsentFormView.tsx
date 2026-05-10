import React, { useState } from 'react';
import { FileText, CheckSquare, X } from 'lucide-react';
import { SignaturePad } from '../components/SignaturePad';
import { View } from '../types';
import { toast } from 'react-hot-toast';

interface ConsentFormViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string) => void;
  onSaveSignature: (pId: string, signature: string, type: 'privacy' | 'consent') => void;
}

export function ConsentFormView({ 
  patientId, 
  navigateTo, 
  onSaveSignature 
}: ConsentFormViewProps) {
  const [accepted, setAccepted] = useState(false);
  const [showPad, setShowPad] = useState(false);

  const handleSaveSignature = (signature: string) => {
    onSaveSignature(patientId, signature, 'consent');
    toast.success('Consentimiento informado firmado correctamente');
    navigateTo('patient-detail', patientId);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={() => navigateTo('patient-detail', patientId)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Consentimiento Informado</h2>
          <p className="text-slate-500 font-medium">Autorización para procedimientos y cuidados médicos.</p>
        </div>
      </header>

      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 space-y-8">
        <div className="flex items-center gap-4 py-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Autorización de Atención</h3>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6 text-justify">
          <p>
            Por medio de la presente, el paciente o su representante legal, otorga su consentimiento a ViMedical y su personal calificado (enfermeros y médicos especialistas) para realizar las maniobras diagnósticas y terapéuticas necesarias para el manejo de sus lesiones.
          </p>
          <p>
            <span className="font-bold text-slate-900">Alcance:</span> Esto incluye limpieza de heridas, debridación, aplicación de vendajes, toma de muestras, administración de medicamentos bajo prescripción y registro fotográfico para el seguimiento clínico.
          </p>
          <p>
            <span className="font-bold text-slate-900">Riesgos:</span> Se me ha informado que los procedimientos pueden conllevar riesgos menores como dolor localizado, sangrado leve o reacciones alérgicas a insumos. Entiendo que los resultados dependen de la respuesta biológica individual y el apego al tratamiento.
          </p>
          <p>
            <span className="font-bold text-slate-900">Derechos:</span> Entiendo que tengo el derecho de retirar este consentimiento en cualquier momento y de solicitar información detallada sobre cada paso del proceso de curación.
          </p>
          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 italic text-indigo-900 font-medium">
            "Doy mi consentimiento libre y espontáneo para recibir la atención de enfermería y médica especializada solicitada."
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
            <span className="font-black text-slate-700 group-hover:text-primary transition-colors">Entiendo los alcances y otorgo mi consentimiento informado.</span>
          </label>

          <button 
            disabled={!accepted}
            onClick={() => setShowPad(true)}
            className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-secondary/30 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <CheckSquare className="w-6 h-6" />
            Firmar Consentimiento
          </button>
        </div>
      </section>

      {showPad && (
        <SignaturePad 
          title="Firma de Consentimiento Informado"
          onSave={handleSaveSignature}
          onCancel={() => setShowPad(false)}
        />
      )}
    </div>
  );
}
