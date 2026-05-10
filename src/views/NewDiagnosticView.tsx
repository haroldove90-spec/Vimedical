import React, { useState, useRef } from 'react';
import { X, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { Patient, Diagnostic, View } from '../types';

interface NewDiagnosticViewProps {
  navigateTo: (view: View) => void;
  patients: Patient[];
  onSave: (d: Diagnostic) => void;
}

export function NewDiagnosticView({ 
  navigateTo, 
  patients, 
  onSave 
}: NewDiagnosticViewProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    clinicalSummary: '',
    diagnosis: '',
    treatmentPlan: '',
    recommendations: '',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorLicense: '3490622-7218923',
  });
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) {
      toast.error('Por favor seleccione un paciente');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor firme el diagnóstico');
      return;
    }

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    const newDiagnostic: Diagnostic = {
      id: Date.now().toString(),
      patientId: formData.patientId,
      patientName: patient.fullName,
      patientAge: (patient as any).age || 0,
      date: formData.date,
      clinicalSummary: formData.clinicalSummary,
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
      recommendations: formData.recommendations,
      doctorName: formData.doctorName,
      doctorLicense: formData.doctorLicense,
      signature: signatureData,
      createdAt: new Date().toISOString(),
    };

    onSave(newDiagnostic);
    toast.success('Diagnóstico guardado correctamente.');
    navigateTo('diagnostics');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigateTo('diagnostics')}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nuevo Diagnóstico</h2>
          <p className="text-slate-500 font-medium">Genera un diagnóstico electrónico detallado.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Paciente</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            >
              <option value="">Seleccionar Paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Resumen Clínico</label>
          <textarea 
            required
            value={formData.clinicalSummary}
            onChange={(e) => setFormData({...formData, clinicalSummary: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[100px]"
            placeholder="Describa los hallazgos clínicos relevantes..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Diagnóstico</label>
          <textarea 
            required
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[80px]"
            placeholder="Diagnóstico clínico..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plan de Tratamiento</label>
          <textarea 
            required
            value={formData.treatmentPlan}
            onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[100px]"
            placeholder="Plan de manejo y tratamiento..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recomendaciones</label>
          <textarea 
            required
            value={formData.recommendations}
            onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[80px]"
            placeholder="Recomendaciones generales para el paciente..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Médico Responsable</label>
            <input 
              type="text" 
              required
              value={formData.doctorName}
              onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cédula Profesional</label>
            <input 
              type="text" 
              required
              value={formData.doctorLicense}
              onChange={(e) => setFormData({...formData, doctorLicense: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Firma del Médico</label>
          <div className="border-2 border-dashed border-slate-200 rounded-3xl p-4 bg-slate-50">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: "w-full h-64 cursor-crosshair",
                style: { width: '100%', height: '256px' }
              }}
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={() => sigCanvas.current?.clear()}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Limpiar Firma
            </button>
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <button 
            type="submit"
            className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all font-sans"
          >
            Guardar Diagnóstico
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('diagnostics')}
            className="px-10 py-5 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all font-sans"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
