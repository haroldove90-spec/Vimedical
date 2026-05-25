import React, { useState } from 'react';
import { ChevronRight, Camera, FileText, Shield } from 'lucide-react';
import { Patient, Wound, View, TreatmentLog, UserProfile } from '../types';
import { ImageViewer } from '../components/ImageViewer';

interface WoundDetailViewProps {
  woundId: string;
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, dId?: string) => void;
  wounds: Wound[];
  patients: Patient[];
  treatmentLogs: TreatmentLog[];
  currentProfile: UserProfile | null;
}

export function WoundDetailView({ 
  woundId, 
  navigateTo, 
  wounds, 
  patients,
  treatmentLogs = [],
  currentProfile
}: WoundDetailViewProps) {
  const wound = wounds.find(w => w.id === woundId);
  const patient = patients.find(p => p.id === wound?.patientId);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!wound) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={() => navigateTo('patient-detail', wound.patientId)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Detalle de Herida</h2>
          <p className="text-slate-500 font-medium">Paciente: {patient?.fullName}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="w-4 h-4" />
            </div>
            Historial Fotográfico (Evolución)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(() => {
              const logs = treatmentLogs.filter(log => log.woundId === wound.id);
              const logPhotos = logs.flatMap(l => l.photos || []);
              const allWoundPhotos = [...logPhotos, ...wound.initialPhotos].filter(p => typeof p === 'string' && p.trim().length > 0);
              const uniquePhotos = Array.from(new Set(allWoundPhotos));

              if (uniquePhotos.length > 0) {
                return uniquePhotos.map((url, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedPhoto(url)}
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in relative group"
                  >
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" referrerPolicy="no-referrer" />
                    {idx === 0 && (
                      <span className="absolute bottom-2 right-2 bg-primary text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-tight shadow">Última</span>
                    )}
                  </div>
                ));
              }
              return (
                <div className="col-span-full py-12 bg-slate-50 border border-dashed rounded-2xl text-center text-slate-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-widest">Sin evidencias</p>
                </div>
              );
            })()}
          </div>
        </section>

        <div className="space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <FileText className="w-4 h-4" />
              </div>
              Información General
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localización</p>
                <p className="font-bold text-slate-900">{wound.location}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción / Estado Actual</p>
                <p className="text-slate-600 leading-relaxed">{wound.description}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Registro</p>
                <p className="font-bold text-slate-900">{new Date(wound.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 border-l-4 border-l-primary">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-4 h-4" />
              </div>
              Plan de Tratamiento Aprobado
            </h3>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-slate-700 font-bold whitespace-pre-wrap leading-relaxed italic">
                {wound.proposedPlan || "No hay un plan definido para esta herida."}
              </p>
            </div>
            {wound.doctor_comments && (
              <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Comentarios del Médico</p>
                <p className="text-indigo-800 text-sm font-medium">{wound.doctor_comments}</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <ImageViewer 
        isOpen={selectedPhoto !== null} 
        imageUrl={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
      />
    </div>
  );
}
