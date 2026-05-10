import React, { useState } from 'react';
import { 
  CheckCircle, PlusCircle, FileText, ChevronRight, User, ShieldCheck, 
  Save, Clock, PenTool 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Patient, View } from '../types';
import { supabase } from '../lib/supabase';
import { storageService } from '../services/storageService';
import { syncService } from '../services/syncService';

interface NewPatientFormViewProps {
  navigateTo: (view: View, pId?: string) => void;
  onSave: (p: Patient) => void;
}

export function NewPatientFormView({ 
  navigateTo, 
  onSave 
}: NewPatientFormViewProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    religion: '',
    educationLevel: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    address: '',
    familyHistory: '',
    pathologicalHistory: '',
    nonPathologicalHistory: '',
    privacyNoticeSigned: false,
    privacyNoticeSignature: '',
    privacyNoticeDate: '',
    privacyNoticeType: 'casa' as 'casa' | 'hospital',
    consentFormSigned: false,
    consentFormSignature: '',
    consentFormDate: '',
    consentFormType: 'casa' as 'casa' | 'hospital',
    initialWoundPhoto: '',
    pathologicalHistoryDetails: {
      endocrino: { diabetes: false, hipertiroidismo: false, hipotiroidismo: false, tiempo: '', tratamiento: '' },
      cardiovascular: { hipertension: false, palpitaciones: false, fiebreReumatica: false, varices: false, tiempo: '', tratamiento: '' },
      respiratorio: { asma: false, bronquitis: false, neumonia: false, tuberculosis: false, tiempo: '', tratamiento: '' },
      digestivas: { gastritis: false, colitis: false, tiempo: '', tratamiento: '' },
      alergias: '',
      fracturas: ''
    },
    nonPathologicalHistoryDetails: {
      sports: false,
      sportsFrequency: '',
      bathFrequency: '',
      dentalFrequency: ''
    },
    gynecoObstetricHistory: {
      asintomatico: false,
      menarche: '',
      lastMenstrualPeriod: '',
      partos: '0',
      cesareas: '0',
      abortos: '0',
      embarazos: '0',
      hijos: '0',
      hormonalesOrales: '',
      hormonalesParenterales: ''
    },
    currentCondition: '',
    physicalExploration: {
      ta: '',
      fc: '',
      fr: '',
      oxygenation: '',
      peso: '',
      talla: '',
      imc: '',
      imcPercent: '',
      adicionales: ''
    },
    regionsSegments: {
      cuello: '',
      toraxPulmonar: '',
      toraxCardiaco: '',
      abdomen: '',
      miembrosToracicos: '',
      miembrosPelvicos: '',
      columnaVertebral: '',
      genitalesExteriores: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    const patientData = {
      full_name: formData.fullName || '',
      date_of_birth: formData.dateOfBirth || null,
      phone: formData.phone || '',
      religion: formData.religion || '',
      education_level: formData.educationLevel || '',
      gender: formData.gender || '',
      marital_status: formData.maritalStatus || '',
      occupation: formData.occupation || '',
      address: formData.address || '',
      privacy_notice_signed: formData.privacyNoticeSigned || false,
      privacy_notice_signature: formData.privacyNoticeSignature || '',
      privacy_notice_date: formData.privacyNoticeDate || '',
      privacy_notice_type: formData.privacyNoticeType || 'casa',
      consent_form_signed: formData.consentFormSigned || false,
      consent_form_signature: formData.consentFormSignature || '',
      consent_form_date: formData.consentFormDate || '',
      consent_form_type: formData.consentFormType || 'casa'
    } as any;

    if (!navigator.onLine) {
      const tempId = crypto.randomUUID();
      const newPatient: Patient = {
        id: tempId,
        fullName: patientData.full_name,
        dateOfBirth: patientData.date_of_birth || '',
        phone: patientData.phone,
        religion: patientData.religion,
        educationLevel: patientData.education_level,
        gender: patientData.gender,
        maritalStatus: patientData.marital_status,
        occupation: patientData.occupation,
        address: patientData.address,
        familyHistory: '',
        pathologicalHistory: '',
        nonPathologicalHistory: '',
        privacyNoticeSigned: patientData.privacy_notice_signed,
        privacyNoticeSignature: patientData.privacy_notice_signature,
        privacyNoticeDate: patientData.privacy_notice_date,
        privacyNoticeType: patientData.privacy_notice_type,
        consentFormSigned: patientData.consent_form_signed,
        consentFormSignature: patientData.consent_form_signature,
        consentFormDate: patientData.consent_form_date,
        consentFormType: patientData.consent_form_type
      };
      
      syncService.addToQueue('patients', 'INSERT', patientData);
      setCreatedPatientId(tempId);
      onSave(newPatient);
      setIsSubmitting(false);
      setIsSuccess(true);
      return;
    }

    toast.loading('Guardando paciente...', { id: 'patient-save' });
    try {
      if (patientData.privacy_notice_signature && patientData.privacy_notice_signature.startsWith('data:image')) {
        const url = await storageService.uploadBase64('signatures', `privacy_${Date.now()}.png`, patientData.privacy_notice_signature);
        if (url) patientData.privacy_notice_signature = url;
      }
      if (patientData.consent_form_signature && patientData.consent_form_signature.startsWith('data:image')) {
        const url = await storageService.uploadBase64('signatures', `consent_${Date.now()}.png`, patientData.consent_form_signature);
        if (url) patientData.consent_form_signature = url;
      }

      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        const newPatient: Patient = {
          id: data.id,
          fullName: data.full_name,
          dateOfBirth: data.date_of_birth || '',
          phone: data.phone,
          religion: data.religion,
          educationLevel: data.education_level,
          gender: data.gender,
          maritalStatus: data.marital_status,
          occupation: data.occupation,
          address: data.address,
          familyHistory: data.family_history || '',
          pathologicalHistory: data.pathological_history || '',
          nonPathologicalHistory: data.non_pathological_history || '',
          privacyNoticeSigned: data.privacy_notice_signed,
          privacyNoticeSignature: data.privacy_notice_signature,
          privacyNoticeDate: data.privacy_notice_date,
          privacyNoticeType: data.privacy_notice_type,
          consentFormSigned: data.consent_form_signed,
          consentFormSignature: data.consent_form_signature,
          consentFormDate: data.consent_form_date,
          consentFormType: data.consent_form_type
        };
        
        await supabase.from('notifications').insert([
          {
            title: 'Nuevo Paciente Registrado',
            body: `Se ha dado de alta a ${newPatient.fullName}.`,
            voice_text: `Atención: Se ha registrado un nuevo paciente: ${newPatient.fullName}.`,
            target_role: 'Administrador'
          }
        ]);

        setCreatedPatientId(data.id);
        onSave(newPatient);
        toast.success('Paciente registrado correctamente', { id: 'patient-save' });
        setIsSuccess(true);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      toast.error(`Error: ${error.message}`, { id: 'patient-save' });
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
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Etapa 1 Completada!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
          El paciente ha sido identificado exitosamente. Ahora puedes proceder a llenar la historia clínica y la valoración inicial (Etapa 2).
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigateTo('new-assessment', createdPatientId || undefined)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Ir a Etapa 2: Historia Clínica
          </button>
          <button 
            onClick={() => navigateTo('patient-detail', createdPatientId || undefined)}
            className="bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-300 transition-all"
          >
            <FileText className="w-5 h-5" />
            Finalizar por ahora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('patients')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Cancelar
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Alta de Paciente</h2>
        <p className="text-slate-500 font-medium text-lg mt-1">Etapa 1: Identificación y Datos de Contacto</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-4 h-4" />
            </div>
            Identificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre Completo *</label>
              <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fecha de Nacimiento *</label>
              <input 
                required
                type="date" 
                value={formData.dateOfBirth} 
                onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Teléfono</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sexo</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50">
                <option value="">Seleccionar...</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estado Civil</label>
              <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50">
                <option value="">Seleccionar...</option>
                <option value="Soltero/a">Soltero/a</option>
                <option value="Casado/a">Casado/a</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado/a">Divorciado/a</option>
                <option value="Viudo/a">Viudo/a</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Dirección</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            Documentos Legales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              type="button"
              onClick={() => {
                toast('Completa el registro para firmar documentos en el detalle del paciente.', { icon: 'ℹ️' });
              }}
              className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all group"
            >
              <PenTool className="w-8 h-8 mb-3 transition-transform group-hover:scale-110" />
              <span className="font-black text-[10px] uppercase tracking-widest text-center">Firma pendiente: Aviso y Consentimiento</span>
            </button>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-center">
              <p className="text-xs text-slate-500 font-medium italic text-center">
                Nota: Podrás recolectar las firmas digitales una vez registrado el paciente desde su expediente.
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? <Clock className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Completar Etapa 1
          </button>
        </div>
      </form>
    </div>
  );
}
