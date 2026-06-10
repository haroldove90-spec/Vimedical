import React, { useState } from 'react';
import { Download, X, FileText, Activity, ChevronRight, Maximize, Camera, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Patient, Wound, TreatmentLog, View, Role, UserProfile, ClinicalComment } from '../types';
import { generateClinicalHistoryPDF } from '../services/pdfService';
import { storageService } from '../services/storageService';
import { triggerFullNotification } from '../services/notificationService';
import { ImageViewer } from '../components/ImageViewer';

interface ClinicalHistoryDetailViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  onUpdate: (p: Patient) => void;
  currentRole: Role;
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
  currentProfile: UserProfile | null;
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => void;
}

export function ClinicalHistoryDetailView({ 
  patientId, 
  navigateTo, 
  patients, 
  onUpdate,
  currentRole,
  wounds,
  treatmentLogs,
  currentProfile,
  sendNotification
}: ClinicalHistoryDetailViewProps) {
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return <div>Paciente no encontrado</div>;

  const patientWounds = wounds.filter(w => w.patientId === patient.id);
  const firstWoundPhoto = [...patientWounds]
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
    .find(w => w.initialPhotos && w.initialPhotos.length > 0)
    ?.initialPhotos[0];
  const displayPhoto = patient.initialWoundPhoto || firstWoundPhoto;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [newComment, setNewComment] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
    toast.success('Historial actualizado correctamente.');

    const targets = 
      currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
      currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
      ['Enfermero', 'Doctor'];

    const authorName = currentProfile?.fullName || (currentRole === 'Doctor' ? 'Dr. Especialista' : currentRole === 'Enfermero' ? 'Enf. Operativo' : 'Administrador');

    targets.forEach(role => {
      sendNotification(
        'Historial Clínico Editado',
        `${authorName} ha actualizado los datos clínicos de ${patient.fullName}.`,
        `Atención ${role}: El historial clínico del paciente ${patient.fullName} ha sido editado por ${authorName}.`,
        role as any
      );
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: ClinicalComment = {
      id: Date.now().toString(),
      author: currentProfile?.fullName || (
        currentRole === 'Doctor' ? 'Dr. Especialista' : 
        currentRole === 'Administrador' ? 'Personal Administrativo' : 
        currentRole === 'Coordinador' ? 'Coordinador de Enfermería' : 
        'Enf. Operativo'
      ),
      role: currentRole,
      text: newComment,
      createdAt: new Date().toISOString()
    };
    const updatedPatient = {
      ...patient,
      clinicalComments: [comment, ...(patient.clinicalComments || [])]
    };
    onUpdate(updatedPatient);
    setNewComment('');
    
    const targets = 
      currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
      currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
      ['Enfermero', 'Doctor'];

    const authorName = currentProfile?.fullName || (currentRole === 'Doctor' ? 'Dr. Especialista' : currentRole === 'Enfermero' ? 'Enf. Operativo' : 'Administrador');
    
    // Notificar a todos los roles destinatarios
    targets.forEach(role => {
      sendNotification(
        'Nuevo comentario clínico',
        `${authorName} ha comentado en el historial de ${patient.fullName}`,
        `Atención ${role}: Hay un nuevo comentario clínico de ${authorName} para el paciente ${patient.fullName}.`,
        role as any
      );
    });

    // Also trigger full local toast notification
    const recipientText = targets.map(r => r === 'Doctor' ? 'médico' : r === 'Enfermero' ? 'enfermero' : 'administrador').join(' y ');
    triggerFullNotification(
      'Comentario Enviado',
      `Tu comentario ha sido registrado y notificado al ${recipientText}.`,
      `Mensaje enviado correctamente.`
    );
  };

  const handleExportPDF = () => {
    const patientWounds = wounds.filter(w => w.patientId === patient.id);
    const patientTreatments = treatmentLogs.filter(t => patientWounds.some(w => w.id === t.woundId));
    
    generateClinicalHistoryPDF(patient, patientWounds, patientTreatments, currentProfile?.signatureUrl);
    toast.success('Generando historial clínico completo en PDF...');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.loading('Subiendo foto...', { id: 'photo-upload' });
      try {
        const fileName = `wounds/${patient.id}_initial_${Date.now()}.png`;
        const url = await storageService.uploadFile('wounds', fileName, file);
        if (url) {
          const updatedPatient = { ...patient, initialWoundPhoto: url };
          onUpdate(updatedPatient);
          toast.success('Foto de la herida subida correctamente.', { id: 'photo-upload' });
        } else {
          throw new Error('No se pudo obtener la URL de la imagen');
        }
      } catch (error) {
        toast.error('Error al subir la foto', { id: 'photo-upload' });
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* ImageViewer replaces the old modal */}
      <ImageViewer 
        isOpen={selectedPhoto !== null} 
        imageUrl={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
      />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo('clinical-history')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900">{patient.fullName}</h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Expediente Clínico</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
          {currentRole === 'Enfermero' && (
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
            >
              {isEditing ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {isEditing ? 'Guardar Cambios' : 'Editar Historial'}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Antecedentes */}
          <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-4">Antecedentes Clínicos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecedentes Familiares</label>
                {isEditing ? (
                  <textarea 
                    value={formData.familyHistory ?? ''}
                    onChange={(e) => setFormData({...formData, familyHistory: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px]"
                  />
                ) : (
                  <p className="text-slate-700 font-medium">{patient.familyHistory}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecedentes Patológicos</label>
                {isEditing ? (
                  <textarea 
                    value={formData.pathologicalHistory ?? ''}
                    onChange={(e) => setFormData({...formData, pathologicalHistory: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px]"
                  />
                ) : (
                  <p className="text-slate-700 font-medium">{patient.pathologicalHistory}</p>
                )}
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antecedentes No Patológicos</label>
                {isEditing ? (
                  <textarea 
                    value={formData.nonPathologicalHistory ?? ''}
                    onChange={(e) => setFormData({...formData, nonPathologicalHistory: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px]"
                  />
                ) : (
                  <p className="text-slate-700 font-medium">{patient.nonPathologicalHistory}</p>
                )}
              </div>
            </div>
          </div>

          {/* Evolución y Evidencias */}
          <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Historial de Visitas y Evidencias</h3>
              <Activity className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-12">
              {wounds.filter(w => w.patientId === patient.id).map(wound => {
                const logs = treatmentLogs
                  .filter(l => l.woundId === wound.id)
                  .sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());

                return (
                  <div key={wound.id} className="space-y-6">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{wound.location}</h4>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{wound.description}</p>
                      </div>
                    </div>

                    {/* Initial Evidence */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Evidencia Inicial de esta Herida</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {(wound.initialPhotos || []).map((photo, idx) => (
                          <div key={idx} className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border-2 border-white cursor-pointer hover:scale-105 transition-transform flex-shrink-0" onClick={() => setSelectedPhoto(photo)}>
                            <img src={photo} alt={`Inicial ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        ))}
                        {(wound.initialPhotos || []).length === 0 && (
                          <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-xs text-center p-2">
                            Sin fotos iniciales
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                      {logs.map(log => (
                        <div key={log.id} className="relative transition-all hover:translate-x-1">
                          {/* Dot */}
                          <div className="absolute -left-[27px] top-1.5 w-[12px] h-[12px] rounded-full bg-white border-2 border-primary z-10 shadow-sm shadow-primary/20" />
                          
                          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha de Evaluación</span>
                                <span className="text-sm font-bold text-slate-700">{new Date(log.evaluationDate).toLocaleString()}</span>
                              </div>
                              <div className="flex gap-4">
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Medidas</span>
                                  <span className="text-xs font-black text-primary">{log.width}x{log.length} cm</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Costo</span>
                                  <span className="text-xs font-black text-emerald-600">${log.cost?.toLocaleString() || '0'}</span>
                                </div>
                              </div>
                            </div>

                            {log.notes && (
                              <div className="mb-4 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl italic">
                                "{log.notes}"
                              </div>
                            )}

                            {log.photos && log.photos.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {log.photos.map((photo, idx) => (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-sm hover:ring-2 hover:ring-primary transition-all cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                                    <img src={photo} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No hay registros de tratamiento aún</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {wounds.filter(w => w.patientId === patient.id).length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Este paciente no tiene heridas registradas.</p>
                </div>
              )}
            </div>
          </div>

          {/* Comunicación Directa / Comentarios */}
          <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-4">Comunicación Directa y Evolución</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Escribe un comentario o indicación..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button 
                  onClick={handleAddComment}
                  className="bg-secondary text-primary px-6 py-4 rounded-2xl font-black text-sm shadow-lg shadow-secondary/20 whitespace-nowrap"
                >
                  Enviar
                </button>
              </div>

              <div className="space-y-4 mt-6">
                {(patient.clinicalComments || []).map(comment => (
                  <div key={comment.id} className={`p-4 rounded-2xl ${comment.role === 'Doctor' ? 'bg-indigo-50 border-l-4 border-primary' : 'bg-slate-50'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${comment.role === 'Doctor' ? 'text-primary' : 'text-slate-500'}`}>
                        {comment.author} ({comment.role})
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{comment.text}</p>
                  </div>
                ))}
                {(patient.clinicalComments || []).length === 0 && (
                  <p className="text-center py-8 text-slate-400 font-medium italic">No hay comentarios registrados aún.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl">
            <h3 className="font-black uppercase tracking-widest text-xs text-secondary mb-6">Datos Generales</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Religión</p>
                <p className="font-bold">{patient.religion}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Escolaridad</p>
                <p className="font-bold">{patient.educationLevel}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Teléfono</p>
                <p className="font-bold">{patient.phone}</p>
              </div>
            </div>
          </div>

          {/* Foto de la Herida */}
          <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-4">Primera Foto de la Herida</h3>
            
            <div className="space-y-4">
              {displayPhoto ? (
                <div className="relative group">
                  <img 
                    src={displayPhoto} 
                    alt="Foto inicial herida" 
                    className="w-full h-64 object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedPhoto(displayPhoto)}
                  />
                  <button 
                    onClick={() => setSelectedPhoto(displayPhoto)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/20 rounded-2xl"
                  >
                    <div className="bg-white/90 p-3 rounded-full shadow-lg">
                      <Maximize className="w-5 h-5 text-primary" />
                    </div>
                  </button>
                  {currentRole === 'Enfermero' && (
                    <label className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors">
                      <Camera className="w-5 h-5 text-primary" />
                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <Camera className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm mb-4">No hay foto registrada</p>
                  {currentRole === 'Enfermero' && (
                    <label className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all cursor-pointer shadow-lg shadow-primary/20">
                      Tomar o Subir Foto
                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-medium italic text-center">
                Esta foto servirá como referencia inicial para el seguimiento del tratamiento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
