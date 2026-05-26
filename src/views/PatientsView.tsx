import React, { useState } from 'react';
import { 
  Download, FileText, Plus, Clock, Activity, Eye, Edit, Trash, ChevronRight, PenTool, Check, X, Shield, FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Patient, Wound, View, TreatmentLog, Role, Attendance } from '../types';
import { ImageViewer } from '../components/ImageViewer';
import { SignaturePad } from '../components/SignaturePad';

interface PatientsViewProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  onDelete: (id: string) => void;
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
  currentRole?: Role;
  attendances?: Attendance[];
  onRegisterAttendance?: (
    patientId: string, 
    patientName: string, 
    status: 'check_in' | 'check_out',
    signature?: string,
    signeeName?: string,
    signeeType?: 'Paciente' | 'Familiar'
  ) => void;
}

export function PatientsView({ 
  navigateTo, 
  patients, 
  onDelete, 
  wounds,
  treatmentLogs = [],
  currentRole = 'Enfermero',
  attendances = [],
  onRegisterAttendance
}: PatientsViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Estados para Registro de Asistencia por Firma Electrónica
  const [activeAttendance, setActiveAttendance] = useState<{
    patientId: string;
    patientName: string;
    status: 'check_in' | 'check_out';
  } | null>(null);
  const [signeeName, setSigneeName] = useState('');
  const [signeeType, setSigneeType] = useState<'Paciente' | 'Familiar'>('Paciente');
  const [capturedSignature, setCapturedSignature] = useState<string>('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const exportToExcel = () => {
    const data = patients.map(p => ({
      'ID': p.id.substring(0, 8),
      'Nombre': p.fullName,
      'F. Nacimiento': p.dateOfBirth,
      'Teléfono': p.phone,
      'Género': p.gender || 'N/A',
      'Dirección': p.address || 'N/A',
      'Ocupación': p.occupation || 'N/A',
      'Religión': p.religion || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
    XLSX.writeFile(workbook, `Pacientes_ViMedical_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Pacientes exportados correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Pacientes - ViMedical", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const tableData = patients.map(p => [
      p.fullName,
      p.dateOfBirth,
      p.phone,
      p.occupation || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Nombre', 'Fecha Nac.', 'Teléfono', 'Ocupación']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save("Pacientes_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">Gestión de Pacientes</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Registro y búsqueda de pacientes activos en el sistema.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex-1 sm:flex-none bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={() => navigateTo('new-patient')}
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-center"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm flex items-center gap-3">
        <Activity className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pacientes por nombre o teléfono..." 
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-600 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map(patient => {
          const patientAttendance = attendances.filter(a => a.patientId === patient.id);
          const latestAttendance = patientAttendance.length > 0 
            ? patientAttendance.reduce((prev, current) => (new Date(prev.timestamp) > new Date(current.timestamp)) ? prev : current)
            : null;
          const isInVisit = latestAttendance?.status === 'check_in';

          return (
            <div 
              key={patient.id} 
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div onClick={() => navigateTo('patient-detail', patient.id)}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                
                <div className="flex items-center gap-5 mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">
                    {patient.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors">{patient.fullName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{patient.occupation || 'Paciente'}</p>
                    {isInVisit && (
                      <div className="mt-1 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg w-fit">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-wider">En visita ({latestAttendance?.nurseName.split(' ')[0]})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-bold text-slate-600">
                      {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('es-MX') : patient.dateOfBirth}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold text-slate-600">{patient.phone}</span>
                  </div>
                  
                  <div id={`patient-status-container-${patient.id}`} className="pt-2 border-t border-slate-100/70 flex flex-wrap gap-2">
                    <span 
                      id={`patient-consent-badge-${patient.id}`}
                      className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                        patient.consentFormSigned 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-500'
                      }`}
                    >
                      <FileCheck className="w-3 h-3" />
                      Consentimiento: {patient.consentFormSigned ? 'FIRMADO' : 'PENDIENTE'}
                    </span>
                    <span 
                      id={`patient-privacy-badge-${patient.id}`}
                      className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                        patient.privacyNoticeSigned 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-500'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      Aviso: {patient.privacyNoticeSigned ? 'FIRMADO' : 'PENDIENTE'}
                    </span>
                  </div>
                </div>

                {/* Evidencias fotográficas (Miniaturas) */}
                {(() => {
                  // Obtener fotos de curaciones posteriores
                  const patientLogs = treatmentLogs.filter(log => log.patientId === patient.id);
                  const progressivePhotos = patientLogs.flatMap(log => log.photos || []);
                  
                  // Obtener fotos iniciales de todas sus heridas
                  const patientWounds = wounds.filter(w => w.patientId === patient.id);
                  const initialPhotos = patientWounds.flatMap(w => w.initialPhotos || []);
                  
                  // Acumular todas las fotos con las más recientes primero
                  const allPhotos = [...progressivePhotos, ...initialPhotos].filter(p => typeof p === 'string' && p.trim().length > 0);
                  const uniquePhotos = Array.from(new Set(allPhotos));

                  if (uniquePhotos.length > 0) {
                    return (
                      <div className="mt-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Galería de Evidencias ({uniquePhotos.length})</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                          {uniquePhotos.slice(0, 5).map((photo, idx) => (
                            <div 
                              key={idx} 
                              className="relative group/img flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(photo);
                              }}
                            >
                              <img 
                                src={photo} 
                                alt={`Progreso ${idx + 1}`} 
                                className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm group-hover/img:scale-115 transition-transform cursor-zoom-in"
                                referrerPolicy="no-referrer"
                              />
                              {idx === 0 && (
                                <span className="absolute bottom-0 right-0 bg-primary text-white text-[7px] font-extrabold px-1 rounded-br-lg rounded-tl-lg uppercase tracking-tight">Última</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="pt-6 mt-6 flex flex-col gap-3 border-t border-slate-100 relative z-10">
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('patient-detail', patient.id);
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver Perfil
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Buscar la primera herida del paciente para iniciar curación
                      const patientWounds = wounds.filter(w => w.patientId === patient.id);
                      if (patientWounds.length > 0) {
                        navigateTo('new-treatment', patient.id, patientWounds[0].id);
                      } else {
                        navigateTo('new-assessment', patient.id);
                      }
                    }}
                    className="flex-1 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Curación
                  </button>
                </div>

                {currentRole === 'Enfermero' && onRegisterAttendance && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAttendance({
                        patientId: patient.id,
                        patientName: patient.fullName,
                        status: isInVisit ? 'check_out' : 'check_in'
                      });
                      setSigneeName('');
                      setSigneeType('Paciente');
                      setCapturedSignature('');
                    }}
                    className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                      isInVisit 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10 animate-pulse' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/10'
                    }`}
                  >
                    {isInVisit ? 'Registrar Retirada (Salida)' : 'Registrar Asistencia (Llegada)'}
                  </button>
                )}

                <div className="flex justify-between items-center px-2">
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateTo('clinical-history-detail', patient.id); }}
                      className="p-2 text-slate-300 hover:text-primary transition-all"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all"
                      title="Eliminar"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div onClick={() => navigateTo('patient-detail', patient.id)} className="flex items-center gap-1 cursor-pointer group/link">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover/link:text-primary transition-colors">Expediente Completo</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover/link:text-primary group-hover/link:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ImageViewer 
        isOpen={selectedPhoto !== null} 
        imageUrl={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
      />

      {/* Modal de Asistencia / Firma */}
      {activeAttendance && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden animate-in zoom-in duration-300 relative text-left">
            <button 
              onClick={() => setActiveAttendance(null)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-1 rounded-full mb-3 tracking-widest ${
                activeAttendance.status === 'check_in' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {activeAttendance.status === 'check_in' ? 'Registro de Llegada' : 'Registro de Retirada'}
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Confirmación de Asistencia</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Paciente: <span className="text-primary font-black">{activeAttendance.patientName}</span>
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quien corrobora la visita:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSigneeType('Paciente')}
                    className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                      signeeType === 'Paciente'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    El Paciente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigneeType('Familiar')}
                    className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                      signeeType === 'Familiar'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Un Familiar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre completo de quien corrobora:</label>
                <input
                  type="text"
                  placeholder={signeeType === 'Paciente' ? activeAttendance.patientName : 'Nombre del familiar...'}
                  value={signeeName}
                  onChange={(e) => setSigneeName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Firma Digital Recabada:</label>
                {capturedSignature ? (
                  <div className="border border-slate-200 rounded-3xl p-4 bg-slate-50 relative flex flex-col items-center">
                    <img src={capturedSignature} alt="Firma recabada" className="max-h-24 object-contain" />
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="mt-3 text-[10px] font-black uppercase text-primary tracking-widest hover:underline flex items-center gap-1"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Cambiar Firma
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full h-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 transition-colors bg-slate-50 gap-1.5"
                  >
                    <PenTool className="w-5 h-5 opacity-70" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Proceder a la Firma</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={() => setActiveAttendance(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const finalName = signeeName.trim() || (signeeType === 'Paciente' ? activeAttendance.patientName : '');
                  if (!finalName) {
                    toast.error('Por favor, ingrese el nombre de quien corrobora la asistencia.');
                    return;
                  }
                  if (!capturedSignature) {
                    toast.error('Por favor, solicite y guarde la firma digital para validar.');
                    return;
                  }

                  if (onRegisterAttendance) {
                    onRegisterAttendance(
                      activeAttendance.patientId,
                      activeAttendance.patientName,
                      activeAttendance.status,
                      capturedSignature,
                      finalName,
                      signeeType
                    );
                  }
                  setActiveAttendance(null);
                }}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Check className="w-4 h-4" />
                Guardar & Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignaturePad && (
        <SignaturePad
          title={`Firma de Corroboración - ${activeAttendance?.patientName}`}
          onSave={(signature) => {
            setCapturedSignature(signature);
            setShowSignaturePad(false);
            toast.success('Firma capturada correctamente.');
          }}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
