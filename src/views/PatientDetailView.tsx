import React, { useState } from 'react';
import { 
  ChevronRight, AlertCircle, PlusCircle, Activity, Clock, Eye, Edit, Trash, 
  RefreshCw, Shield, FileText, Maximize, Camera, Zap, History, BarChart3, Receipt, Plus 
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Patient, Wound, TreatmentLog, TreatmentProposal, View } from '../types';

interface PatientDetailViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, dId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
  treatmentProposals: TreatmentProposal[];
}

export function PatientDetailView({ 
  patientId, 
  navigateTo, 
  patients, 
  wounds, 
  treatmentLogs, 
  treatmentProposals 
}: PatientDetailViewProps) {
  const patient = patients.find(p => p.id === patientId);
  const patientWounds = wounds.filter(w => w.patientId === patientId).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const latestWound = patientWounds[0];
  const patientProposals = treatmentProposals.filter(tp => tp.patientId === patientId);
  const [activeTab, setActiveTab] = useState<'wounds' | 'history' | 'charts'>('wounds');

  if (!patient) return <div className="p-8 text-center font-black text-slate-400">Paciente no encontrado</div>;

  const needsAssessment = !patient.familyHistory || patientWounds.length === 0;

  const chartData = patientWounds.flatMap(w => 
    treatmentLogs.filter(t => t.woundId === w.id).map(log => ({
      date: new Date(log.evaluationDate).toLocaleDateString(),
      area: (Number(log.length) || 0) * (Number(log.width) || 0),
      location: w.location
    }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <button onClick={() => navigateTo('patients')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 transition-colors">
        <ChevronRight className="w-4 h-4 rotate-180" /> Volver a Pacientes
      </button>

      <header className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-center shadow-xl shadow-slate-200/50">
        <div className="w-32 h-32 rounded-[2rem] bg-primary text-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-primary/30 shrink-0">
          {patient.fullName.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900">{patient.fullName}</h2>
              <p className="text-slate-500 font-medium mt-1">{patient.occupation || 'Sin ocupación'} • {patient.gender} • {patient.dateOfBirth}</p>
            </div>
            <div className="flex gap-3">
              {needsAssessment && (
                <button 
                  onClick={() => navigateTo('new-assessment', patientId)}
                  className="bg-amber-100 text-amber-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-200 transition-all flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Falta Historia Clínica
                </button>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => navigateTo('new-assessment', patientId)}
                  className="bg-secondary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-lg shadow-secondary/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  NUEVA CURACION PROPUESTA DE TRATAMIENTO
                </button>
                <button 
                  onClick={() => navigateTo('consent-form', patient.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${patient.consentFormSigned ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  Consentimiento {patient.consentFormSigned ? '✓' : '✗'}
                </button>
                <button 
                  onClick={() => navigateTo('privacy-notice', patient.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${patient.privacyNoticeSigned ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                >
                  Privacidad {patient.privacyNoticeSigned ? '✓' : '✗'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Teléfono</p>
              <p className="font-black text-slate-900">{patient.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Religión</p>
              <p className="font-black text-slate-900">{patient.religion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Escolaridad</p>
              <p className="font-black text-slate-900">{patient.educationLevel || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">ID</p>
              <p className="font-black text-slate-900">#{patient.id.substring(0, 8)}</p>
            </div>
          </div>
        </div>
      </header>
      
      {needsAssessment && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-amber-500/30"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-black mb-2 tracking-tight">Expediente Clínico Incompleto</h3>
            <p className="font-bold opacity-90 text-sm max-w-xl leading-relaxed">
              Es necesario registrar los antecedentes patológicos y realizar la valoración inicial de la herida antes de proceder con tratamientos recurrentes.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('new-assessment', patientId)}
            className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xl"
          >
            <PlusCircle className="w-5 h-5" />
            Iniciar Etapa 2
          </button>
        </motion.div>
      )}

      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab('wounds')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'wounds' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Datos del Paciente
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Historial Clínico
        </button>
        <button 
          onClick={() => setActiveTab('charts')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'charts' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Gráficas de Progreso
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'wounds' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Heridas</h3>
                <button 
                  onClick={() => navigateTo('new-treatment-proposal', patient.id)}
                  className="bg-secondary text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-secondary/20 hover:bg-secondary-dark transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  NUEVA CURACION PROPUESTA DE TRATAMIENTO
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {patientWounds.map(wound => (
                  <div 
                    key={wound.id}
                    onClick={() => navigateTo('wound-detail', patient.id, wound.id)}
                    className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-xl transition-all cursor-pointer group flex flex-col gap-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                          <Activity className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">{wound.location}</h4>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {wound.status === 'pending_admin' && 'Pendiente Admin'}
                            {wound.status === 'pending_doctor' && 'Pendiente Doctor'}
                            {wound.status === 'approved' && 'Aprobado'}
                            {wound.status === 'completed' && 'Completado'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Curaciones</p>
                        <p className="font-black text-slate-900">
                          {treatmentLogs.filter(t => t.woundId === wound.id).length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última</p>
                        <p className="font-black text-slate-900">
                          {(() => {
                            const woundTreatments = treatmentLogs.filter(t => t.woundId === wound.id);
                            return woundTreatments.length 
                              ? new Date(woundTreatments.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())[0].evaluationDate).toLocaleDateString() 
                              : 'N/A';
                          })()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                        <div className={`w-3 h-3 rounded-full mx-auto mt-1 ${wound.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      </div>
                    </div>
                    {wound.status === 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('new-treatment', patient.id, wound.id);
                        }}
                        className="mt-2 w-full py-3 bg-primary/5 text-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Registrar Curación
                      </button>
                    )}
                  </div>
                ))}
                {patientWounds.length === 0 && (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[2.5rem] p-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <Activity className="w-10 h-10" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Sin registros de heridas</p>
                    <p className="text-slate-500 mt-2 font-medium">Comienza realizando una valoración inicial.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Propuestas de Tratamiento</h3>
                <button 
                  onClick={() => navigateTo('new-treatment-proposal', patient.id)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  Nueva Propuesta
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {patientProposals.map(proposal => (
                  <div 
                    key={proposal.id}
                    onClick={() => navigateTo('treatment-proposal-detail', patient.id, undefined, undefined, undefined, proposal.id)}
                    className="bg-white border border-slate-200 rounded-[2rem] p-8 hover:shadow-xl transition-all cursor-pointer group flex flex-col gap-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary">
                          <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 group-hover:text-primary transition-colors">{proposal.program}</h4>
                          <p className="text-xs text-slate-500 font-medium">{proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${proposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {proposal.status === 'accepted' ? 'Aceptado' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión</p>
                        <p className="font-black text-slate-900">${proposal.investment?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Curaciones</p>
                        <p className="font-black text-slate-900">{proposal.numCurations} Sesiones</p>
                      </div>
                    </div>
                  </div>
                ))}
                {patientProposals.length === 0 && (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No hay propuestas de tratamiento registradas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Historial Clínico Completo</h2>
                <p className="text-slate-500 font-medium mt-1">Revisión consolidada de la última valoración</p>
              </div>
              <button 
                onClick={() => navigateTo('new-assessment', patient.id)}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                ACTUALIZAR HISTORIAL
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
                  <h3 className="text-2xl font-black mb-10 flex items-center gap-3 relative z-10">
                    <Shield className="w-7 h-7 text-secondary" />
                    1. Historia Clínica (Antecedentes)
                  </h3>
                  <div className="space-y-10 relative z-10">
                    <div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Heredo-Familiares</p>
                      <p className="text-2xl text-slate-200 font-medium leading-relaxed">{patient.familyHistory || 'No refiere'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Personales Patológicos</p>
                      <p className="text-2xl text-slate-200 font-medium leading-relaxed">{patient.pathologicalHistory || 'No refiere'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Personales No Patológicos</p>
                      <p className="text-2xl text-slate-200 font-medium leading-relaxed">{patient.nonPathologicalHistory || 'No refiere'}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                    <Activity className="w-7 h-7 text-primary" />
                    3. Exploración Física (S. Vitales)
                  </h3>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">T. Arterial</p>
                      <p className="text-3xl font-black text-slate-900">
                        {patient.physicalExploration?.ta || 
                         (latestWound?.bloodPressureSystolic 
                          ? `${latestWound.bloodPressureSystolic}/${latestWound.bloodPressureDiastolic}` 
                          : 'N/A')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F. Cardiaca</p>
                      <p className="text-3xl font-black text-slate-900">{patient.physicalExploration?.fc || latestWound?.heartRate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F. Resp.</p>
                      <p className="text-3xl font-black text-slate-900">{patient.physicalExploration?.fr || latestWound?.respiratoryRate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peso</p>
                      <p className="text-3xl font-black text-slate-900">{patient.physicalExploration?.peso || latestWound?.weight || 'N/A'} <span className="text-sm">kg</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Talla</p>
                      <p className="text-3xl font-black text-slate-900">{patient.physicalExploration?.talla || latestWound?.height || 'N/A'} <span className="text-sm">m</span></p>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">IMC</p>
                      <p className="text-3xl font-black text-slate-900">
                        {patient.physicalExploration?.imc || 
                         ((latestWound?.weight && latestWound?.height) 
                          ? (Number(latestWound.weight) / (Number(latestWound.height) * Number(latestWound.height))).toFixed(1) 
                          : 'N/A')}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <section className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-xl shadow-slate-200/40">
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    2. Padecimiento Actual
                  </h3>
                  <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100">
                    <p className="text-3xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {patient.currentCondition || 'No se ha registrado el padecimiento actual.'}
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40">
                    <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                      <Maximize className="w-7 h-7 text-emerald-600" />
                      4. Dimensión Herida
                    </h3>
                    <div className="space-y-8">
                      <div className="p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/50">
                        <div className="flex justify-between items-center mb-6"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Localización</span> <span className="text-xl font-black text-slate-900">{latestWound?.location || 'N/A'}</span></div>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-emerald-100">
                          <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase mb-2">Medidas (cm)</p>
                            <p className="text-3xl font-black text-slate-900">{latestWound?.width}x{latestWound?.length}x{latestWound?.depth}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase mb-2">Dolor (EVA)</p>
                            <div className="flex items-center gap-3">
                              <p className="text-3xl font-black text-slate-900">{latestWound?.painLevel}/10</p>
                              <div className={`w-4 h-4 rounded-full ${Number(latestWound?.painLevel) > 7 ? 'bg-red-500' : Number(latestWound?.painLevel) > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40">
                    <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-3">
                      <Activity className="w-7 h-7 text-amber-600" />
                      5. Evaluación Detallada Lecho
                    </h3>
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Nivel del Dolor (EVA)</h4>
                          <span className="text-xl font-black text-slate-900">{latestWound?.painLevel}/10</span>
                        </div>
                         <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tejidos y Hallazgos</h4>
                         <div className="flex flex-wrap gap-2 text-[11px] font-black text-slate-700">
                            {latestWound?.tissueType && Object.entries(latestWound.tissueType).map(([k,v]) => v && <span key={k} className="bg-white px-3 py-1 rounded-lg border border-slate-200 uppercase">{k}: {v}</span>)}
                            {latestWound?.characteristics && Object.entries(latestWound.characteristics).map(([k,v]) => v && <span key={k} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-lg border border-orange-100 uppercase">{k}</span>)}
                         </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <Camera className="w-7 h-7 text-blue-500" />
                      5. Fotos Iniciales (Evidencia)
                    </h3>
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest leading-none">
                      {latestWound?.initialPhotos?.length || 0} Fotos
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {latestWound?.initialPhotos?.map((img, i) => (
                      <div key={i} className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-md relative group cursor-zoom-in">
                        <img src={img} alt={`Evidencia herida ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    ))}
                    {(!latestWound?.initialPhotos || latestWound.initialPhotos.length === 0) && (
                      <div className="col-span-full py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-sm">Sin evidencia fotográfica</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary/50" />
                  <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                    <Zap className="w-8 h-8 text-secondary" />
                    6. Diagnóstico y Plan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em] mb-4">Diagnóstico / Ubicación</p>
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                          <p className="text-2xl font-bold text-white leading-relaxed">
                            {latestWound?.diagnosis || 'No se registró diagnóstico específico.'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                        <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                          <History className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Pronóstico</p>
                          <p className="text-xl font-black text-white">{latestWound?.prognosis || 'Reservado'}</p>
                        </div>
                      </div>
                    </div>
                      <div>
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em] mb-4">Plan Terapéutico Propuesto</p>
                        <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 h-full">
                          <p className="text-2xl font-medium text-indigo-50 leading-loose whitespace-pre-wrap">
                            {latestWound?.proposedPlan || 'No se ha definido un plan de tratamiento aún.'}
                          </p>
                        </div>
                      </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in duration-500">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="w-4 h-4" />
              </div>
              Evolución del Área de Heridas (cm²)
            </h3>
            
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      itemStyle={{fontWeight: 800, fontSize: 12}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Line 
                      type="monotone" 
                      dataKey="area" 
                      name="Área Total" 
                      stroke="#FF6321" 
                      strokeWidth={4} 
                      dot={{r: 6, fill: '#FF6321', strokeWidth: 2, stroke: '#fff'}} 
                      activeDot={{r: 8, strokeWidth: 0}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Sin datos suficientes</p>
                <p className="text-slate-500 mt-2 font-medium">Se requieren al menos dos valoraciones con medidas para generar la gráfica.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
