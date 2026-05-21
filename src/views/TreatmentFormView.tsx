import React, { useState, useRef } from 'react';
import { 
  ChevronRight, Activity, FileText, Camera, X, PlusCircle, RefreshCw, Save 
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { Patient, Wound, TreatmentLog, View, UserProfile } from '../types';
import { supabase, safeDatabaseOp } from '../lib/supabase';
import { storageService } from '../services/storageService';
import { CameraCapture } from '../components/CameraCapture';

interface TreatmentFormViewProps {
  patientId: string;
  woundId: string;
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, dId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  onSave: (log: TreatmentLog) => void;
  currentUser: UserProfile | null;
}

export function TreatmentFormView({ 
  patientId, 
  woundId, 
  navigateTo, 
  patients, 
  wounds, 
  onSave, 
  currentUser 
}: TreatmentFormViewProps) {
  const patient = patients.find(p => p.id === patientId);
  const wound = wounds.find(w => w.id === woundId);
  
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPhotos = newFiles.map((file: File) => URL.createObjectURL(file));
      
      setPhotoFiles(prev => [...prev, ...newFiles].slice(0, 10));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error('Debe incluir al menos una foto de la curación.');
      return;
    }
    
    setIsSubmitting(true);
    toast.loading('Guardando curación...', { id: 'treatment-save' });

    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      // Subir fotos
      const uploadedPhotoUrls: string[] = [];
      for (const file of photoFiles) {
        if (file.size > 0) {
          const fileName = `treatments/${woundId}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
          const url = await storageService.uploadFile('wounds', fileName, file);
          if (url) uploadedPhotoUrls.push(url);
        }
      }

      const treatmentData = {
        wound_id: woundId,
        patient_id: patientId,
        nurse_id: currentUser?.id || '',
        nurse_name: currentUser?.fullName || 'Enfermero',
        date: new Date().toISOString().split('T')[0],
        type: formData.get('type') as string,
        description: formData.get('description') as string,
        photos: uploadedPhotoUrls,
        observations: formData.get('observations') as string,
        vital_signs: {
          ta: formData.get('ta') as string,
          fc: formData.get('fc') as string,
          fr: formData.get('fr') as string,
          temp: formData.get('temp') as string,
          oxygen: formData.get('oxygen') as string
        }
      };

      const { data, error } = await safeDatabaseOp<any>(
        'treatment_logs',
        'insert',
        [treatmentData],
        (q) => q.select().single()
      );

      if (error) throw error;

      if (data) {
        // Enviar notificaciones
        const authorName = currentUser?.fullName || 'Enfermero';
        const patName = patient?.fullName || 'Paciente';
        try {
          await supabase.from('notifications').insert([
            {
              title: 'Nueva Curación Registrada',
              body: `${authorName} ha registrado una nueva curación para ${patName}.`,
              voice_text: `Atención: Nueva curación registrada para el paciente ${patName} por ${authorName}.`,
              target_role: 'Doctor'
            },
            {
              title: 'Nueva Curación Registrada',
              body: `${authorName} ha registrado una nueva curación para ${patName}.`,
              voice_text: `Atención: Nueva curación registrada para el paciente ${patName} por ${authorName}.`,
              target_role: 'Administrador'
            }
          ]);
        } catch (err) {
          console.error('Error sending treatment notifications:', err);
        }

        onSave(data as any);
        toast.success('Curación registrada correctamente', { id: 'treatment-save' });
        navigateTo('patient-detail', patientId);
      }
    } catch (error: any) {
      console.error('Error saving treatment log:', error);
      toast.error(`Error: ${error.message}`, { id: 'treatment-save' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient || !wound) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('patient-detail', patientId)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Cancelar
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Registro de Curación</h2>
        <p className="text-slate-500 font-medium">Paciente: {patient.fullName} | Herida: {wound.location}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            Signos Vitales Actuales
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">T.A.</label>
              <input name="ta" type="text" placeholder="120/80" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.C.</label>
              <input name="fc" type="text" placeholder="72" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.R.</label>
              <input name="fr" type="text" placeholder="18" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Temp.</label>
              <input name="temp" type="text" placeholder="36.5" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Oxigenación</label>
              <input name="oxygen" type="text" placeholder="98%" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            Detalles de la Intervención
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tipo de Curación</label>
              <select name="type" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50">
                <option value="Curación Avanzada">Curación Avanzada</option>
                <option value="Curación Simple">Curación Simple</option>
                <option value="Debridación">Debridación</option>
                <option value="Colocación de Dispositivo">Colocación de Dispositivo</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Descripción del Procedimiento *</label>
              <textarea required name="description" rows={5} placeholder="Describa paso a paso la técnica utilizada, materiales y respuesta del paciente..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Observaciones Adicionales</label>
              <textarea name="observations" rows={2} placeholder="Cualquier nota relevante sobre el entorno o estado general..." className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"></textarea>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-4 h-4" />
              </div>
              Evidencia Fotográfica
            </h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{photos.length}/10 fotos</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {photos.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 relative group">
                <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => {
                    setPhotos(photos.filter((_, i) => i !== idx));
                    setPhotoFiles(photoFiles.filter((_, i) => i !== idx));
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">Subir Foto</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
                >
                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">Cámara</span>
                </button>
              </>
            )}
          </div>
        </section>

        {showCamera && (
          <CameraCapture 
            onCapture={(dataUrl) => {
              const file = base64ToFile(dataUrl, `treatment_${Date.now()}.png`);
              setPhotoFiles(prev => [...prev, file].slice(0, 10));
              setPhotos(prev => [...prev, dataUrl].slice(0, 10));
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Registro de Curación
          </button>
        </div>
      </form>
    </div>
  );
}
