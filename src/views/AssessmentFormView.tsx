import React, { useState, useRef } from 'react';
import { 
  ChevronRight, Activity, FileText, Camera, X, PlusCircle, RefreshCw, 
  Save, Send, CheckCircle, Clock, CheckSquare, AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Patient, Wound, View } from '../types';
import { supabase, safeDatabaseOp } from '../lib/supabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';
import { CameraCapture } from '../components/CameraCapture';

interface AssessmentFormViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, dId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  onSave: (w: Wound) => void;
  onUpdatePatient: (p: Patient) => void;
}

export function AssessmentFormView({ 
  patientId, 
  navigateTo, 
  patients, 
  wounds, 
  onSave, 
  onUpdatePatient 
}: AssessmentFormViewProps) {
  const patient = patients.find(p => p.id === patientId);
  const existingWounds = wounds.filter(w => w.patientId === patientId).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const latestWound = existingWounds[0];
  
  const [photos, setPhotos] = useState<Array<{ url: string; file?: File }>>(() => {
    if (latestWound?.initialPhotos && latestWound.initialPhotos.length > 0) {
      return latestWound.initialPhotos.map(url => ({ url }));
    }
    if (patient?.initialPhotos && patient.initialPhotos.length > 0) {
      return patient.initialPhotos.map(url => ({ url }));
    }
    if (patient?.initialWoundPhoto) {
      return [{ url: patient.initialWoundPhoto }];
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [painLevel, setPainLevel] = useState(latestWound?.painLevel || 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPhotoItems = newFiles.map((file: File) => ({
        url: URL.createObjectURL(file),
        file
      }));
      setPhotos(prev => [...prev, ...newPhotoItems].slice(0, 10));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const base64ToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const toNumeric = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: 'approved' | 'pending_doctor' = 'pending_doctor') => {
    e.preventDefault();
    if (photos.length === 0 && submitStatus === 'pending_doctor') {
      toast.error('Debe incluir al menos una foto inicial de la herida.');
      return;
    }
    setIsSubmitting(true);
    toast.loading(submitStatus === 'approved' ? 'Actualizando historial...' : 'Enviando a aprobación...', { id: 'assessment-save' });

    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      // 1. Subir fotos
      const uploadedPhotoUrls: string[] = [];
      for (const item of photos) {
        if (item.file) {
          if (item.file.size > 0) {
            const fileName = `wounds/${patientId}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
            const url = await storageService.uploadFile('wounds', fileName, item.file);
            if (url) {
              uploadedPhotoUrls.push(url);
            }
          }
        } else {
          uploadedPhotoUrls.push(item.url);
        }
      }

      // 2. Preparar Datos de Valoración (Wound)
      const sanitizedWoundData: any = {
        patient_id: patientId,
        location: formData.get('location') as string || 'No especificada',
        description: formData.get('currentCondition') as string || '',
        status: submitStatus,
        initial_photos: uploadedPhotoUrls,
        weight: toNumeric(formData.get('weight')),
        height: toNumeric(formData.get('height')),
        temp: toNumeric(formData.get('temp')),
        blood_pressure_systolic: toNumeric(formData.get('bloodPressureSystolic')),
        blood_pressure_diastolic: toNumeric(formData.get('bloodPressureDiastolic')),
        pulse: toNumeric(formData.get('pulse')),
        heart_rate: toNumeric(formData.get('heartRate')),
        respiratory_rate: toNumeric(formData.get('respiratoryRate')),
        oxygenation: toNumeric(formData.get('oxygenation')),
        glycemia_fasting: toNumeric(formData.get('glycemiaFasting')),
        glycemia_postprandial: toNumeric(formData.get('glycemiaPostprandial')),
        width: toNumeric(formData.get('width')),
        length: toNumeric(formData.get('length')),
        depth: toNumeric(formData.get('depth')),
        pain_level: painLevel,
        diagnosis: formData.get('diagnosis') as string,
        prognosis: formData.get('prognosis') as string,
        proposed_plan: formData.get('proposed_plan') as string,
        abi_arm: toNumeric(formData.get('abiArm')),
        abi_left_toe: toNumeric(formData.get('abiLeftToe')),
        abi_right_toe: toNumeric(formData.get('abiRightToe'))
      };

      // 3. Preparar Datos de Historia Clínica (Patient)
      const physicalExplorationData = {
        peso: formData.get('weight') as string,
        talla: formData.get('height') as string,
        imc: (toNumeric(formData.get('weight')) && toNumeric(formData.get('height'))) 
              ? (toNumeric(formData.get('weight'))! / (toNumeric(formData.get('height'))! * toNumeric(formData.get('height'))!)).toFixed(1) 
              : 'N/A',
        imcPercent: '',
        ta: `${formData.get('bloodPressureSystolic')}/${formData.get('bloodPressureDiastolic')}`,
        fc: formData.get('heartRate') as string,
        fr: formData.get('respiratoryRate') as string,
        oxygenation: formData.get('oxygenation') as string,
        adicionales: `Temp: ${formData.get('temp')}°C, Glucosa: ${formData.get('glycemiaFasting')} / ${formData.get('glycemiaPostprandial')}. Hallazgos: ${formData.get('regionsExploration') || "Ninguno"}`
      };

      const patientUpdateData: any = {
        family_history: formData.get('familyHistory') as string,
        pathological_history: formData.get('pathologicalHistory') as string,
        non_pathological_history: formData.get('nonPathologicalHistory') as string,
        current_condition: formData.get('currentCondition') as string,
        physical_exploration: physicalExplorationData,
        initial_photos: uploadedPhotoUrls,
        initial_wound_photo: uploadedPhotoUrls[0] || ''
      };

      if (!navigator.onLine) {
        syncService.addToQueue('patients', 'UPDATE', { ...patientUpdateData, id: patientId });
        syncService.addToQueue('wounds', 'INSERT', sanitizedWoundData);
        toast('Dispositivo sin conexión a Internet. La valoración inicial se ha guardado de forma segura en este navegador y se sincronizará automáticamente con el servidor cuando recuperes la conexión.', {
          duration: 9000,
          id: 'assessment-save',
          icon: '⚠️'
        });
        setIsSuccess(true);
      } else {
        await safeDatabaseOp<any>(
          'patients',
          'update',
          patientUpdateData,
          (q) => q.eq('id', patientId)
        );
        
        if (patient) {
          onUpdatePatient({
            ...patient,
            familyHistory: patientUpdateData.family_history,
            pathologicalHistory: patientUpdateData.pathological_history,
            nonPathologicalHistory: patientUpdateData.non_pathological_history,
            currentCondition: patientUpdateData.current_condition,
            physicalExploration: physicalExplorationData,
            initialPhotos: uploadedPhotoUrls,
            initialWoundPhoto: uploadedPhotoUrls[0] || ''
          });
        }

        const { data, error } = await safeDatabaseOp<any>(
          'wounds',
          'insert',
          [sanitizedWoundData],
          (q) => q.select().single()
        );
        if (error) throw error;
        
        const titleVal = submitStatus === 'approved' ? 'Valoración Actualizada' : 'Nueva Valoración de Etapa 2';
        const bodyVal = submitStatus === 'approved' 
          ? `Se ha actualizado el historial clínico de ${patient?.fullName}.` 
          : `Se ha completado la historia clínica y valoración inicial para ${patient?.fullName}.`;
        const voiceTextVal = submitStatus === 'approved'
          ? `Historial clínico actualizado para ${patient?.fullName}.`
          : `Atención: Nueva valoración inicial recibida para ${patient?.fullName}. Por favor revise el plan de tratamiento.`;

        const currentRole = localStorage.getItem('currentRole') || 'Enfermero';
        const targets = 
          currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
          currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
          ['Enfermero', 'Doctor'];

        const notificationInserts = targets.map(targetRole => ({
          title: titleVal,
          body: `${bodyVal} (Registrado por ${currentRole})`,
          voice_text: voiceTextVal,
          target_role: targetRole
        }));

        await supabase.from('notifications').insert(notificationInserts);

        toast.success(submitStatus === 'approved' ? 'Historial actualizado correctamente' : 'Valoración enviada a aprobación', { id: 'assessment-save' });
        setIsSuccess(true);
        if (data) onSave(data as any);
      }

      setTimeout(() => navigateTo('patient-detail', patientId), 2000);
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast.error(`Error: ${error.message}`, { id: 'assessment-save' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Operación Exitosa!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Los datos han sido guardados correctamente en el expediente del paciente.
        </p>
        <div className="mt-8 flex items-center gap-2 text-primary font-bold">
          <Clock className="w-5 h-5 animate-spin-slow" />
          Redirigiendo al expediente...
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('patient-detail', patientId)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Cancelar
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Valoración Inicial</h2>
        <p className="text-slate-500 font-medium">Paciente: {patient?.fullName}</p>
      </header>

      {!navigator.onLine && (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md shadow-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-sm">Dispositivo sin conexión a Internet</h4>
              <p className="text-xs text-amber-700 font-semibold mt-1">La valoración inicial se registrará de forma local segura en este navegador y se auto-sincronizará con la nube inmediatamente cuando recuperes la conexión.</p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-10" onSubmit={(e) => handleSubmit(e)}>
        
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
            1. Historia Clínica (Antecedentes)
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Heredo-Familiares</label>
              <textarea name="familyHistory" defaultValue={patient?.familyHistory} rows={2} placeholder="Ej. Diabetes, Hipertensión en familiares..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Personales Patológicos</label>
              <textarea name="pathologicalHistory" defaultValue={patient?.pathologicalHistory} rows={2} placeholder="Ej. Cirugías, Alergias, Enfermedades crónicas..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Personales No Patológicos</label>
              <textarea name="nonPathologicalHistory" defaultValue={patient?.nonPathologicalHistory} rows={2} placeholder="Ej. Tabaquismo, Alcohol, Sedentarismo..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <FileText className="w-4 h-4" />
            </div>
            2. Padecimiento Actual
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Motivo de Consulta y Evolución *</label>
              <textarea required name="currentCondition" defaultValue={patient?.currentCondition} rows={4} placeholder="Describa el inicio y evolución de la lesión, síntomas y tiempo de evolución..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            3. Exploración Física (Signos Vitales)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peso (kg)</label>
              <input name="weight" type="number" step="0.1" defaultValue={patient?.physicalExploration?.peso || latestWound?.weight} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Talla (m)</label>
              <input name="height" type="number" step="0.01" defaultValue={patient?.physicalExploration?.talla || latestWound?.height} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Temp. (°C)</label>
              <input name="temp" type="number" step="0.1" defaultValue={latestWound?.temp} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pulso</label>
              <input name="pulse" type="number" defaultValue={latestWound?.pulse} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.C.</label>
              <input name="heartRate" type="number" defaultValue={patient?.physicalExploration?.fc || latestWound?.heartRate} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.R.</label>
              <input name="respiratoryRate" type="number" defaultValue={patient?.physicalExploration?.fr || latestWound?.respiratoryRate} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Oxigenación (%)</label>
              <input name="oxygenation" type="number" defaultValue={patient?.physicalExploration?.oxygenation || latestWound?.oxygenation} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div className="col-span-2 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Tensión Arterial</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Sistólica</label>
                <input name="bloodPressureSystolic" type="text" defaultValue={latestWound?.bloodPressureSystolic} className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Diastólica</label>
                <input name="bloodPressureDiastolic" type="text" defaultValue={latestWound?.bloodPressureDiastolic} className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
            </div>

            <div className="col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Glicemia</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Ayuno</label>
                <input name="glycemiaFasting" type="number" defaultValue={latestWound?.glycemiaFasting} className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Posprandial</label>
                <input name="glycemiaPostprandial" type="number" defaultValue={latestWound?.glycemiaPostprandial} className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
            </div>

            <div className="md:col-span-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Hallazgos por Regiones (Cabeza, Cuello, Tórax...)</label>
              <textarea name="regionsExploration" rows={3} placeholder="Describa hallazgos en la exploración física general..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 overflow-hidden">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
              <Activity className="w-4 h-4" />
            </div>
            4. Índice Tobillo - Brazo (ABI)
          </h3>
          <div className="overflow-x-auto -mx-10 px-10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left" rowSpan={2}>Brazo</th>
                  <th className="border border-slate-200 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center" colSpan={3}>Pie Izquierdo</th>
                  <th className="border border-slate-200 p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center" colSpan={3}>Pie Derecho</th>
                </tr>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Dedo</th>
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Pedial</th>
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Tibial Pos</th>
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Dedo</th>
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Pedial</th>
                  <th className="border border-slate-200 p-3 text-[10px] font-black text-slate-500 uppercase">Tibial Pos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-0">
                    <input name="abiArm" type="text" defaultValue={latestWound?.abi_arm} placeholder="Brazo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftToe" type="text" defaultValue={latestWound?.abi_left_toe} placeholder="Dedo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftPedial" type="text" placeholder="Pedial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftTibial" type="text" placeholder="Tibial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiRightToe" type="text" defaultValue={latestWound?.abi_right_toe} placeholder="Dedo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiRightPedial" type="text" placeholder="Pedial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiRightTibial" type="text" placeholder="Tibial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-4 h-4" />
            </div>
            5. Dimensiones de la Herida
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Localización Anatómica Exacta *</label>
              <input required name="location" type="text" defaultValue={latestWound?.location} placeholder="Ej. Maleolo interno pie derecho" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ancho (cm)</label>
              <input name="width" type="number" defaultValue={latestWound?.width} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Largo (cm)</label>
              <input name="length" type="number" defaultValue={latestWound?.length} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Profundidad (cm)</label>
              <input name="depth" type="number" defaultValue={latestWound?.depth} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tunelización (cm)</label>
              <input name="tunneling" type="number" defaultValue={latestWound?.tunneling} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tracto Sinusal (cm)</label>
              <input name="sinusTract" type="number" defaultValue={latestWound?.sinusTract} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Socavamiento (cm)</label>
              <input name="undermining" type="number" defaultValue={latestWound?.undermining} step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <CheckCircle className="w-4 h-4" />
            </div>
            6. Evaluación Detallada del Lecho
          </h3>
          
          <div className="space-y-10">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tipo de Tejido</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Epitelización', 'Granulación', 'Efacelo', 'Necrótico', 'Fibrina', 'Músculo', 'Hueso', 'Tendón'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name="tissueType" value={item} className="w-5 h-5 rounded border-slate-200 text-primary" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Etiología</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Venosa', 'Arterial', 'Mixta', 'Pie Diabético', 'Presión', 'Quirúrgica', 'Traumática', 'Quemadura'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name="etiology" value={item} className="w-5 h-5 rounded border-slate-200 text-primary" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Características</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Exudado Seroso', 'Exudado Purulento', 'Eritema', 'Edema', 'Calor Local', 'Olor Fétido', 'Bordes Irregulares', 'Bordes Macerados'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name="characteristics" value={item} className="w-5 h-5 rounded border-slate-200 text-primary" />
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Forma de la Herida</label>
                <input name="shape" type="text" placeholder="Ej. Ovalada, Irregular" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex justify-between">
                  Nivel de Dolor (0-10)
                  <span className={`text-sm font-black px-3 py-1 rounded-full ${painLevel > 7 ? 'bg-red-100 text-red-600' : painLevel > 4 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    Nivel: {painLevel}
                  </span>
                </label>
                <div className="relative pt-6 pb-2">
                  <div 
                    className="absolute top-0 -translate-x-1/2 pointer-events-none transition-all duration-300 z-10"
                    style={{ left: `${painLevel * 10}%` }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${painLevel > 7 ? 'bg-red-500 text-white' : painLevel > 4 ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {painLevel}
                    </div>
                  </div>
                  <input 
                    name="painLevel" 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary hover:bg-slate-300 transition-colors" 
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400 mt-4">
                    <span className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 mb-1" />
                      0 - Sin dolor
                    </span>
                    <span className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-orange-500 mb-1" />
                      5 - Moderado
                    </span>
                    <span className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-red-500 mb-1" />
                      10 - Máximo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-4 h-4" />
              </div>
              5. Fotos Iniciales de la Herida (Máx 10)
            </h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{photos.length}/10 fotos</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {photos.map((item, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 relative group">
                <img src={item.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => {
                    setPhotos(photos.filter((_, i) => i !== idx));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
                >
                  <PlusCircle className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Añadir Foto</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
                >
                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cámara</span>
                </button>
              </>
            )}
          </div>
        </section>

        {showCamera && (
          <CameraCapture 
            onCapture={(dataUrl) => {
              const file = base64ToFile(dataUrl, `camera_${Date.now()}.png`);
              setPhotos(prev => [...prev, { url: dataUrl, file }].slice(0, 10));
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}



        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            6. Diagnóstico y Plan
          </h3>
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Diagnóstico / Ubicación</label>
              <input name="diagnosis" type="text" defaultValue={latestWound?.diagnosis} placeholder="Ej. Dehiscencia de herida quirúrgica abdominal" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pronóstico</label>
              <div className="relative">
                <select name="prognosis" defaultValue={latestWound?.prognosis} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
                  <option value="">Seleccionar...</option>
                  <option value="Favorable">Favorable</option>
                  <option value="Reservado">Reservado</option>
                  <option value="Malo">Malo</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Plan Terapéutico Propuesto</label>
              <textarea name="proposed_plan" rows={5} defaultValue={latestWound?.proposedPlan} placeholder="Ej. Prontosan solución (lavado)&#10;Prontosan gel&#10;Empaquetar con Kerlix&#10;Cubrir con Telfa&#10;Avintra 1 diario&#10;Curación c/ 24 horas." className="w-full border border-slate-200 rounded-[2rem] p-6 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row justify-end gap-6 pt-10 border-t border-slate-100">
          <button 
            type="button" 
            onClick={(e) => {
              const form = e.currentTarget.closest('form');
              if (form) {
                const syntheticEvent = {
                  preventDefault: () => {},
                  currentTarget: form,
                  target: form
                } as unknown as React.FormEvent<HTMLFormElement>;
                handleSubmit(syntheticEvent, 'approved');
              }
            }}
            disabled={isSubmitting}
            className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Solo Actualizar Historial
          </button>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-secondary text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all scale-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? 'Procesando...' : 'Enviar a Aprobación'}
          </button>
        </div>
      </form>
    </div>
  );
}
