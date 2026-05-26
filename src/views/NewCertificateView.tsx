import React, { useState, useRef } from 'react';
import { 
  X, Users, FileCheck, PenTool, RefreshCw 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { Patient, Wound, MedicalCertificate, View } from '../types';
import { trimCanvas } from '../utils/canvasHelper';

interface NewCertificateViewProps {
  navigateTo: (view: View) => void;
  patients: Patient[];
  wounds: Wound[];
  onSave: (c: MedicalCertificate) => void;
}

export function NewCertificateView({ 
  navigateTo, 
  patients, 
  wounds, 
  onSave 
}: NewCertificateViewProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const [formData, setFormData] = useState({
    physicalState: 'Encamado(a), palidez generalizada de tegumentos',
    woundDetails: '',
    treatment: '',
    visualStatus: 'campo visual y profundidad de campo adecuadas, esteropsis y percepción cromática',
    auditoryStatus: 'agudeza auditiva normal',
    locomotorStatus: 'aparato locomotor (integridad, motilidad y reflejos) sin alteraciones',
    neurologicalStatus: 'examen neurológico (coordinación y reflejos) y exploración del estado mental sin alteraciones',
    conclusions: ''
  });

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      const patientWounds = wounds.filter(w => w.patientId === patient.id);
      if (patientWounds.length > 0) {
        setFormData(prev => ({
          ...prev,
          woundDetails: `con herida por ${patientWounds[0].description} en ${patientWounds[0].location}`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Por favor seleccione un paciente');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor firme el certificado');
      return;
    }

    setIsSubmitting(true);
    try {
      const rawCanvas = sigCanvas.current?.getCanvas();
      const trimmedCanvas = rawCanvas ? trimCanvas(rawCanvas) : null;
      const signatureData = trimmedCanvas ? trimmedCanvas.toDataURL('image/png') : '';
      
      const newCertificate: any = {
        id: crypto.randomUUID(),
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        patientAge: new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear(),
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Victor Ismael Medecigo Escudero',
        doctorCredentials: 'Médico Cirujano, Maestro en heridas por la Universidad Autónoma de México del Estado de Hidalgo y Universidad Panamericana',
        doctorLicense: '3490622-7218923',
        ...formData,
        signature: signatureData,
        createdAt: new Date().toISOString()
      };

      onSave(newCertificate);
      toast.success('Certificado generado correctamente');
      navigateTo('certificates');
    } catch (error) {
      console.error('Error saving certificate:', error);
      toast.error('Error al guardar el certificado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={() => navigateTo('certificates')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nuevo Certificado</h2>
          <p className="text-slate-500 font-medium">Completa los campos para generar el certificado médico.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            Selección de Paciente
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Paciente</label>
              <select 
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all"
                required
              >
                <option value="">Seleccione un paciente...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileCheck className="w-4 h-4" />
            </div>
            Contenido del Certificado
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estado Físico (Encamado, palidez...)</label>
              <textarea 
                rows={2}
                value={formData.physicalState ?? ''}
                onChange={e => setFormData({...formData, physicalState: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Detalles de la Herida</label>
              <textarea 
                rows={2}
                value={formData.woundDetails ?? ''}
                onChange={e => setFormData({...formData, woundDetails: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tratamiento Actual</label>
              <textarea 
                rows={3}
                value={formData.treatment ?? ''}
                onChange={e => setFormData({...formData, treatment: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Campo Visual</label>
                <input type="text" value={formData.visualStatus ?? ''} onChange={e => setFormData({...formData, visualStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Agudeza Auditiva</label>
                <input type="text" value={formData.auditoryStatus ?? ''} onChange={e => setFormData({...formData, auditoryStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Aparato Locomotor</label>
                <input type="text" value={formData.locomotorStatus ?? ''} onChange={e => setFormData({...formData, locomotorStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Examen Neurológico</label>
                <input type="text" value={formData.neurologicalStatus ?? ''} onChange={e => setFormData({...formData, neurologicalStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Conclusiones</label>
              <textarea 
                rows={4}
                value={formData.conclusions ?? ''}
                onChange={e => setFormData({...formData, conclusions: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
                required
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PenTool className="w-4 h-4" />
            </div>
            Firma del Médico
          </h3>
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
          <div className="mt-4 flex justify-end">
            <button 
              type="button" 
              onClick={() => sigCanvas.current?.clear()}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Limpiar Firma
            </button>
          </div>
        </section>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-secondary/30 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileCheck className="w-6 h-6" />}
          {isSubmitting ? 'Generando...' : 'Generar Certificado Médico'}
        </button>
      </form>
    </div>
  );
}
