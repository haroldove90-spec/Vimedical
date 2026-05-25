import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, ShoppingBag, PlusCircle, Receipt, 
  CheckCircle, Users, FileText, ChevronRight, UserCircle, Stethoscope, Camera 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { syncService } from '../services/syncService';
import { toast } from 'react-hot-toast';
import { Patient, Wound, TreatmentLog, Role, UserProfile, View, TreatmentProposal, Attendance } from '../types';
import { ImageViewer } from '../components/ImageViewer';

interface AdminDashboardProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
  onUpdateWoundStatus: (id: string, status: Wound['status']) => void;
  profile: UserProfile | null;
  onSwitchRole: (role: Role) => void;
  treatmentProposals?: TreatmentProposal[];
  attendances?: Attendance[];
}

export function AdminDashboard({ 
  navigateTo, 
  patients, 
  wounds, 
  treatmentLogs, 
  sendNotification, 
  onUpdateWoundStatus, 
  profile, 
  onSwitchRole,
  treatmentProposals = [],
  attendances = []
}: AdminDashboardProps) {
  const pendingAdmin = wounds.filter(w => w.status === 'pending_admin');
  const pendingProposals = treatmentProposals.filter(p => p.status === 'pending');
  const recentPatients = patients.slice(0, 5);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Quick Role Switcher for Admin */}
      <section className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
              <Shield className="w-6 h-6 text-secondary" />
              Accesos Rápidos por Rol
            </h3>
            <p className="text-white/70 font-medium">Como Administrador, puedes visualizar la plataforma como otros roles:</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                onSwitchRole('Doctor');
                toast.success('Cambiado a vista de Médico');
              }}
              className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-black transition-all border border-white/10 flex items-center justify-center gap-3 group"
            >
              <Stethoscope className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
              Vista Médico
            </button>
            <button 
              onClick={() => {
                onSwitchRole('Enfermero');
                toast.success('Cambiado a vista de Enfermero');
              }}
              className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-black transition-all border border-white/10 flex items-center justify-center gap-3 group"
            >
              <UserCircle className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
              Vista Enfermero
            </button>
          </div>
        </div>
      </section>

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
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Panel de Administración</h2>
          <p className="text-slate-500 font-medium">Bienvenido de nuevo, <span className="text-primary">{profile?.fullName || 'Harold Anguiano'}</span>.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigateTo('ecommerce')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"
          >
            <ShoppingBag className="w-5 h-5" />
            E-commerce
          </button>
          <button 
            onClick={() => navigateTo('new-patient')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-black hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
          <button 
            onClick={() => navigateTo('new-quotation')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20"
          >
            <Receipt className="w-5 h-5" />
            Nueva Cotización
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-4">Valoraciones Pendientes</h3>
            <div className="grid grid-cols-1 gap-6">
              {pendingAdmin.map(wound => {
                const patient = patients.find(p => p.id === wound.patientId);
                return (
                  <div key={wound.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col gap-6 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary-dark font-black text-2xl">
                          {patient?.fullName[0]}
                        </div>
                        <div>
                          <h3 className="font-black text-xl text-slate-900">{patient?.fullName}</h3>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{wound.location} • {wound.description}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          await onUpdateWoundStatus(wound.id, 'pending_doctor');
                          toast.success('Valoración revisada y enviada al Doctor exitosamente.');
                        }}
                        className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Revisar y Enviar a Doctor
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Plan propuesto por enfermería</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{wound.proposedPlan}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Evidencias Fotográficas (Recientes primero)</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {(() => {
                            const logs = treatmentLogs.filter(log => log.woundId === wound.id);
                            const logPhotos = logs.flatMap(l => l.photos || []);
                            const allWoundPhotos = [...logPhotos, ...wound.initialPhotos].filter(p => typeof p === 'string' && p.trim().length > 0);
                            const uniquePhotos = Array.from(new Set(allWoundPhotos));

                            if (uniquePhotos.length > 0) {
                              return uniquePhotos.map((photo, idx) => (
                                <div key={idx} className="relative group/img flex-shrink-0">
                                  <img 
                                    src={photo} 
                                    alt={`Evidencia ${idx + 1}`} 
                                    className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                    onClick={() => setSelectedPhoto(photo)}
                                  />
                                  {idx === 0 && (
                                    <span className="absolute bottom-0 right-0 bg-primary text-white text-[7px] font-extrabold px-1 py-0.5 rounded-br-lg rounded-tl-lg uppercase tracking-tight">Última</span>
                                  )}
                                </div>
                              ));
                            }
                            return (
                              <div className="w-20 h-20 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                <Camera className="w-5 h-5" />
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingAdmin.length === 0 && (
                <div className="bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin pendientes</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-4">Propuestas de Tratamiento Pendientes</h3>
            <div className="grid grid-cols-1 gap-6">
              {pendingProposals.map(proposal => (
                <div key={proposal.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl">
                      {proposal.patientName[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-900">{proposal.patientName}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Programa: {proposal.program} • {proposal.numCurations} curaciones</p>
                      <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Monto Inversión: ${proposal.investment?.toLocaleString()} ({proposal.materials})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="px-4 py-2 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 uppercase tracking-wider">
                      Pte. Autorización Médica
                    </span>
                  </div>
                </div>
              ))}
              {pendingProposals.length === 0 && (
                <div className="bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center text-slate-400">
                  <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sin propuestas de tratamiento pendientes</p>
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
                      onClick={() => navigateTo('patient-detail', patient.id)}
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
          {/* CONTROL DE ASISTENCIAS COLA REALTIME */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Asistencia de Enfermeros
            </h3>
            
            <div className="space-y-4">
              {(() => {
                const nurseStates: { [nurseId: string]: Attendance } = {};
                (attendances || []).forEach(record => {
                  if (!nurseStates[record.nurseId]) {
                    nurseStates[record.nurseId] = record;
                  }
                });

                const activeVisits = Object.values(nurseStates).filter(r => r.status === 'check_in');
                const recentLogs = (attendances || []).slice(0, 5);

                return (
                  <div>
                    {/* Visitas Activas Ahora */}
                    <div className="mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visitas Activas ({activeVisits.length})</p>
                      {activeVisits.length > 0 ? (
                        <div className="space-y-3">
                          {activeVisits.map(visit => (
                            <div key={visit.id} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between gap-3 shadow-inner">
                              <div>
                                <h4 className="font-black text-xs text-emerald-950">{visit.nurseName}</h4>
                                <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                                  Con: <span className="font-black text-primary hover:underline cursor-pointer" onClick={() => navigateTo('patient-detail', visit.patientId)}>{visit.patientName}</span>
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-block bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest animate-pulse">Llegó</span>
                                <p className="text-[9px] font-bold text-emerald-700 mt-1">
                                  {new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 italic bg-slate-50 border border-dashed p-4 rounded-xl text-center">No hay visitas activas hoy</p>
                      )}
                    </div>

                    {/* Historial Reciente */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Historial de Turnos</p>
                      {recentLogs.length > 0 ? (
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {recentLogs.map(log => (
                            <div key={log.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 transition-colors">
                              <div>
                                <p className="font-bold text-slate-800">{log.nurseName}</p>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                  {log.status === 'check_in' ? 'Entrada con: ' : 'Salida de: '}
                                  <span className="font-bold text-slate-600">{log.patientName}</span>
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-tighter ${
                                  log.status === 'check_in' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {log.status === 'check_in' ? 'Llegada' : 'Salida'}
                                </span>
                                <p className="text-[8px] font-bold text-slate-400 mt-1">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-slate-300 italic text-center">Sin actividad registrada</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

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
