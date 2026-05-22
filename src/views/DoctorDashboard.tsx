import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, PlusCircle, CheckCircle, XCircle, 
  Camera, FileText, ChevronRight, Users, Receipt, Download, Maximize, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { syncService } from '../services/syncService';
import { toast } from 'react-hot-toast';
import { Patient, Wound, TreatmentLog, Role, UserProfile, View } from '../types';
import { ImageViewer } from '../components/ImageViewer';

interface DoctorDashboardProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
  onUpdateWoundStatus: (id: string, status: Wound['status'], comments?: string) => void;
  profile: UserProfile | null;
  onSwitchRole?: (role: Role) => void;
}

export function DoctorDashboard({ 
  navigateTo, 
  patients, 
  wounds, 
  treatmentLogs, 
  sendNotification, 
  onUpdateWoundStatus, 
  profile, 
  onSwitchRole 
}: DoctorDashboardProps) {
  const pendingDoctor = wounds.filter(w => w.status === 'pending_doctor');
  const recentPatients = patients.slice(0, 5);
  const [comments, setComments] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {profile?.role === 'Administrador' && onSwitchRole && (
        <div className="bg-primary rounded-[2rem] p-4 flex items-center justify-between text-white shadow-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-secondary" />
            <p className="text-sm font-bold">Estás viendo la plataforma como <span className="text-secondary">Médico</span></p>
          </div>
          <button 
            onClick={() => onSwitchRole('Administrador')}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Volver a Admin
          </button>
        </div>
      )}
      
      {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-bold">Notificaciones desactivadas. No recibirás alertas críticas en tiempo real.</p>
          </div>
          <button 
            onClick={() => navigateTo('settings')}
            className="text-xs font-black uppercase tracking-widest text-amber-700 hover:underline"
          >
            Activar
          </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Panel Médico</h2>
          <p className="text-slate-500 font-medium">Bienvenido, <span className="text-primary">{profile?.fullName || 'Dr. Especialista'}</span>.</p>
        </div>
        <div className="w-full md:w-auto">
          <button 
            onClick={() => navigateTo('new-patient')}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 scale-100 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-4">Planes por Aprobar</h3>
            <div className="grid grid-cols-1 gap-6">
              {pendingDoctor.map(wound => {
                const patient = patients.find(p => p.id === wound.patientId);
                return (
                  <div key={wound.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl">
                          {patient?.fullName[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-slate-900">{patient?.fullName}</h3>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{wound.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button 
                          onClick={async () => {
                            if (!comments) {
                              toast.error('Por favor, añade un comentario para el rechazo.');
                              return;
                            }
                            
                            await onUpdateWoundStatus(wound.id, 'rejected', comments);
                            toast.success('Plan Rechazado. Se notificará al enfermero.');
                            setComments('');
                          }} 
                          className="flex-1 md:flex-none text-white bg-red-500 px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          <XCircle className="w-5 h-5" /> Rechazar Plan
                        </button>
                        <button 
                          onClick={async () => {
                            await onUpdateWoundStatus(wound.id, 'approved', comments || 'Aprobado sin comentarios adicionales.');
                            toast.success('Plan Aprobado. El enfermero ya puede iniciar visitas.');
                            setComments('');
                          }} 
                          className="flex-1 md:flex-none text-white bg-emerald-500 px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-5 h-5" /> Aprobar Plan
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Plan propuesto por enfermería</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{wound.proposedPlan}</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Evidencia Fotográfica Inicial</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {wound.initialPhotos.map((photo, idx) => (
                            <img 
                              key={idx} 
                              src={photo} 
                              alt={`Evidencia ${idx + 1}`} 
                              className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                              referrerPolicy="no-referrer"
                              onClick={() => setSelectedPhoto(photo)}
                            />
                          ))}
                          {wound.initialPhotos.length === 0 && (
                            <div className="w-24 h-24 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Indicaciones Médicas / Comentarios</label>
                        <input 
                          type="text" 
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Añadir comentarios o indicaciones adicionales..." 
                          className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none bg-white shadow-inner" 
                        />
                      </div>
                      <button 
                        onClick={() => navigateTo('clinical-history-detail', patient?.id)}
                        className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                        <FileText className="w-5 h-5" /> Ver Historial
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingDoctor.length === 0 && (
                <div className="bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin pendientes</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Pacientes Recientes</h3>
              <button onClick={() => navigateTo('patients')} className="text-primary font-bold text-xs hover:underline">Ver todos</button>
            </div>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
              <div className="divide-y divide-slate-100">
                {recentPatients.map(patient => (
                  <div key={patient.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                        {patient.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{patient.fullName}</p>
                        <p className="text-xs text-slate-400">{patient.phone}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigateTo('clinical-history-detail', patient.id)}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
            <h3 className="font-black uppercase tracking-widest text-xs text-secondary mb-6">Accesos Rápidos</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigateTo('patients')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <Users className="w-5 h-5 text-secondary" />
                <span className="font-bold text-sm">Registro de Pacientes</span>
              </button>
              <button 
                onClick={() => navigateTo('clinical-history')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <FileText className="w-5 h-5 text-secondary" />
                <span className="font-bold text-sm">Historial Clínico</span>
              </button>
              <button 
                onClick={() => navigateTo('quotations')}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left"
              >
                <Receipt className="w-5 h-5 text-secondary" />
                <span className="font-bold text-sm">Cotizaciones</span>
              </button>
            </div>
          </div>
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
