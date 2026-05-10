import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Patient, TreatmentProposal, View } from '../types';

interface NewTreatmentProposalViewProps {
  navigateTo: (view: View) => void;
  patients: Patient[];
  onSave: (p: TreatmentProposal) => void;
}

export function NewTreatmentProposalView({ 
  navigateTo, 
  patients, 
  onSave 
}: NewTreatmentProposalViewProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    program: 'VIMEDICAL CUIDADOS EN CASA',
    numCurations: 12,
    materials: 'sin materiales',
    investment: 2500,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    const newProposal: TreatmentProposal = {
      id: crypto.randomUUID(),
      patientId: formData.patientId,
      patientName: patient.fullName,
      date: formData.date,
      program: formData.program,
      numCurations: formData.numCurations,
      materials: formData.materials,
      investment: formData.investment,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    onSave(newProposal);
    toast.success('Propuesta guardada correctamente.');
    navigateTo('treatment-proposals');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigateTo('treatment-proposals')}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nueva Propuesta</h2>
          <p className="text-slate-500 font-medium">Define el plan de tratamiento e inversión para el paciente.</p>
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
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Programa</label>
          <input 
            type="text" 
            required
            value={formData.program}
            onChange={(e) => setFormData({...formData, program: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            placeholder="Ej. VIMEDICAL CUIDADOS EN CASA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Curaciones</label>
            <input 
              type="number" 
              required
              value={formData.numCurations}
              onChange={(e) => setFormData({...formData, numCurations: parseInt(e.target.value)})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Materiales e Insumos</label>
            <input 
              type="text" 
              required
              value={formData.materials}
              onChange={(e) => setFormData({...formData, materials: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
              placeholder="Ej. sin materiales"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Inversión ($)</label>
            <input 
              type="number" 
              required
              value={formData.investment}
              onChange={(e) => setFormData({...formData, investment: parseInt(e.target.value)})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <button 
            type="submit"
            className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all font-sans"
          >
            Guardar Propuesta
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('treatment-proposals')}
            className="px-10 py-5 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all font-sans"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
