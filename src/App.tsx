import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  LayoutDashboard, Users, User, Activity, AlertTriangle, PlusCircle, Clock, 
  ChevronRight, Camera, CheckSquare, Square, FileText, CheckCircle, XCircle, UserCircle, Menu, X, Download,
  Settings, Volume2, Bell, Mic, Eye, EyeOff, Receipt, DollarSign, Plus, Trash2, Shield, FileCheck, CheckCircle2,
  BarChart3, PenTool, Maximize, Printer, Mail, Phone, Award, AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import { Role, Patient, Wound, TreatmentLog, ClinicalComment, Quotation, QuotationItem, MedicalCertificate, TreatmentProposal, Diagnostic, MOCK_PATIENTS, MOCK_WOUNDS, MOCK_TREATMENTS, MOCK_CERTIFICATES, MOCK_PROPOSALS, MOCK_DIAGNOSTICS } from './mockData';
import { supabase } from './lib/supabase';
import { generateFinalReport, generateQuotationPDF, generateClinicalHistoryPDF } from './services/pdfService';
import { requestNotificationPermission, triggerFullNotification, playNotificationSound, speakMessage } from './services/notificationService';
import { syncService } from './services/syncService';
import { Lock, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';

type View = 'dashboard' | 'patients' | 'patient-detail' | 'wound-detail' | 'new-assessment' | 'new-treatment' | 'new-patient' | 'settings' | 'clinical-history' | 'clinical-history-detail' | 'quotations' | 'new-quotation' | 'quotation-detail' | 'privacy-notice' | 'consent-form' | 'certificates' | 'new-certificate' | 'certificate-detail' | 'treatment-proposals' | 'new-treatment-proposal' | 'treatment-proposal-detail' | 'register-nurse' | 'diagnostics' | 'new-diagnostic' | 'diagnostic-detail' | 'profile' | 'nurses-management';

interface UserProfile {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  license?: string;
  specialty?: string;
  photoUrl?: string;
  bio?: string;
  status?: 'active' | 'suspended';
}

function LoginView({ onLogin, profiles }: { onLogin: (role: Role) => void, profiles: UserProfile[] }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Primero buscar en los perfiles dinámicos
    const profile = profiles.find(p => p.username === username && p.password === password);
    
    if (profile) {
      if (profile.status === 'suspended') {
        setError('Tu cuenta ha sido suspendida. Contacta al administrador.');
        return;
      }
      onLogin(profile.role);
      return;
    }

    // Fallback para usuarios iniciales si no están en la lista (aunque deberían estarlo por el useEffect)
    if (username === 'enfermero' && password === '123prueba') {
      onLogin('Enfermero');
    } else if (username === 'doctor' && password === '123prueba') {
      onLogin('Doctor');
    } else if (username === 'admin' && password === '123prueba') {
      onLogin('Administrador');
    } else {
      setError('Usuario o clave incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-12 h-12 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">ViMedical</h1>
          <p className="text-slate-500 font-medium mt-2">Acceso al Sistema Clínico</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
              placeholder="nombre de usuario"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Clave</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner pr-12"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-[#3C6B94] text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-[#3C6B94]/20 hover:bg-[#CBB882] transition-all scale-100 active:scale-95 flex items-center justify-center gap-3"
          >
            Entrar al Panel
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="text-center mt-6">
            <p className="text-slate-500 text-xs font-medium">
              ¿Eres enfermero y no tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => (window as any).navigateToRegister()}
                className="text-[#3C6B94] font-bold hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </form>

        <div className="mt-10 text-center">
          <p className="text-slate-400 text-xs font-medium">
            ¿Olvidaste tus credenciales? <br/>
            <a 
              href="https://wa.me/525624222449" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#3C6B94] font-bold cursor-pointer hover:underline"
            >
              Contacta a soporte técnico
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white border-2 border-secondary rounded-2xl shadow-2xl p-6 z-50 animate-bounce-subtle">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900">Instalar ViMedical</h4>
          <p className="text-sm text-slate-500 mt-1">Accede más rápido y recibe notificaciones instalando la app en tu dispositivo.</p>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleInstall}
              className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Instalar
            </button>
            <button 
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 text-slate-500 text-sm font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Luego
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [currentRole, setCurrentRole] = useState<Role>(() => (localStorage.getItem('currentRole') as Role) || 'Enfermero');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        syncService.processQueue().then(() => setPendingOps(syncService.getQueue().length));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Actualizar contador de pendientes periódicamente
    const interval = setInterval(() => {
      setPendingOps(syncService.getQueue().length);
    }, 5000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn.toString());
    localStorage.setItem('currentRole', currentRole);
  }, [isLoggedIn, currentRole]);

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedWoundId, setSelectedWoundId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [wounds, setWounds] = useState<Wound[]>(MOCK_WOUNDS);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [proposals, setProposals] = useState<TreatmentProposal[]>(MOCK_PROPOSALS);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>(MOCK_DIAGNOSTICS);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfileData] = useState<UserProfile | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    requestNotificationPermission();

    // Sincronizar cuando vuelva la conexión
    const handleOnline = () => {
      console.log('Conexión restaurada. Iniciando sincronización...');
      syncService.processQueue();
    };
    window.addEventListener('online', handleOnline);

    // Intentar sincronizar al cargar si estamos online
    if (navigator.onLine) {
      syncService.processQueue();
    }

    // Escuchar cambios en tiempo real
    const patientsChannel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => fetchPatients()
      )
      .subscribe();

    const woundsChannel = supabase
      .channel('wounds-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wounds' },
        () => fetchWounds()
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_role=eq.${currentRole}`
        },
        (payload) => {
          const { title, body, voice_text } = payload.new;
          triggerFullNotification(title, body, voice_text);
        }
      )
      .subscribe();

    const fetchPatients = async () => {
      // Cargar desde caché primero para rapidez y offline
      const cachedPatients = syncService.getCache('patients');
      if (cachedPatients) {
        setPatients(cachedPatients);
      }

      if (!navigator.onLine) return;

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        const formattedPatients: Patient[] = data.map(p => ({
          id: p.id,
          fullName: p.full_name,
          dateOfBirth: p.date_of_birth,
          phone: p.phone,
          religion: p.religion,
          educationLevel: p.education_level,
          familyHistory: p.family_history,
          pathologicalHistory: p.pathological_history,
          nonPathologicalHistory: p.non_pathological_history,
          gender: p.gender,
          maritalStatus: p.marital_status,
          occupation: p.occupation,
          address: p.address
        }));
        const finalPatients = [...formattedPatients];
        setPatients(finalPatients);
        syncService.setCache('patients', finalPatients);
      }
    };

    const fetchWounds = async () => {
      const cachedWounds = syncService.getCache('wounds');
      if (cachedWounds) {
        setWounds(cachedWounds);
      }

      if (!navigator.onLine) return;

      const { data, error } = await supabase
        .from('wounds')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        const formattedWounds: Wound[] = data.map(w => ({
          id: w.id,
          patientId: w.patient_id,
          location: w.location,
          description: w.description,
          createdAt: w.created_at,
          status: w.status,
          initialPhotos: w.initial_photos || [],
          proposedPlan: w.proposed_plan,
          doctorComments: w.doctor_comments,
          visitCount: w.visit_count || 0,
          targetVisits: w.target_visits || 4,
          weight: w.weight,
          height: w.height,
          temp: w.temp,
          bloodPressureSystolic: w.blood_pressure_systolic,
          bloodPressureDiastolic: w.blood_pressure_diastolic,
          pulse: w.pulse,
          heartRate: w.heart_rate,
          respiratoryRate: w.respiratory_rate,
          oxygenation: w.oxygenation,
          glycemiaFasting: w.glycemia_fasting,
          glycemiaPostprandial: w.glycemia_postprandial,
          abiArm: w.abi_arm,
          abiLeftToe: w.abi_left_toe,
          abiLeftPedal: w.abi_left_pedal,
          abiLeftPostTibial: w.abi_left_post_tibial,
          abiRightToe: w.abi_right_toe,
          abiRightPedal: w.abi_right_pedal,
          abiRightPostTibial: w.abi_right_post_tibial
        }));
        const finalWounds = [...formattedWounds];
        setWounds(finalWounds);
        syncService.setCache('wounds', finalWounds);
      }
    };

    fetchPatients();
    fetchWounds();
    fetchQuotations();
    fetchCertificates();

    return () => {
      window.removeEventListener('online', handleOnline);
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(woundsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentRole]);

  const fetchQuotations = async () => {
    // Cargar desde caché primero
    const cachedQuotations = syncService.getCache('quotations');
    if (cachedQuotations) {
      setQuotations(cachedQuotations);
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)');
    
    if (error) {
      console.error('Error fetching quotations:', error);
    } else if (data) {
      const formattedQuotations: Quotation[] = data.map((q: any) => ({
        id: q.id,
        patientId: q.patient_id,
        patientName: q.patient_name,
        createdAt: q.created_at,
        totalAmount: q.total_amount,
        status: q.status,
        notes: q.notes,
        items: q.quotation_items.map((i: any) => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unitCost: i.unit_cost,
          total: i.total
        }))
      }));
      setQuotations(formattedQuotations);
      syncService.setCache('quotations', formattedQuotations);
    }
  };

  const fetchCertificates = async () => {
    const cachedCertificates = syncService.getCache('certificates');
    if (cachedCertificates) {
      setCertificates(cachedCertificates);
    } else {
      setCertificates(MOCK_CERTIFICATES);
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
      .from('medical_certificates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching certificates:', error);
    } else if (data) {
      const formattedCertificates: MedicalCertificate[] = data.map((c: any) => ({
        id: c.id,
        patientId: c.patient_id,
        patientName: c.patient_name,
        patientAge: c.patient_age,
        date: c.date,
        doctorName: c.doctor_name,
        doctorCredentials: c.doctor_credentials,
        doctorLicense: c.doctor_license,
        physicalState: c.physical_state,
        woundDetails: c.wound_details,
        treatment: c.treatment,
        visualStatus: c.visual_status,
        auditoryStatus: c.auditory_status,
        locomotorStatus: c.locomotor_status,
        neurologicalStatus: c.neurological_status,
        conclusions: c.conclusions,
        signature: c.signature,
        createdAt: c.created_at
      }));
      setCertificates(formattedCertificates);
      syncService.setCache('certificates', formattedCertificates);
    }
  };

  const navigateTo = useCallback((view: View, patientId?: string, woundId?: string, quotationId?: string, certificateId?: string, proposalId?: string, diagnosticId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    if (woundId) setSelectedWoundId(woundId);
    if (quotationId) setSelectedQuotationId(quotationId);
    if (certificateId) setSelectedCertificateId(certificateId);
    if (proposalId) setSelectedProposalId(proposalId);
    if (diagnosticId) setSelectedDiagnosticId(diagnosticId);
    setCurrentView(view);
    setIsSidebarOpen(false);
  }, []);

  useEffect(() => {
    (window as any).navigateToRegister = () => navigateTo('register-nurse');
  }, [navigateTo]);

  const handleAddPatient = (newPatient: Patient) => {
    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);
    syncService.setCache('patients', updatedPatients);
    navigateTo('patient-detail', newPatient.id);
  };

  const handleSaveQuotation = (newQuotation: Quotation) => {
    const updatedQuotations = [newQuotation, ...quotations];
    setQuotations(updatedQuotations);
    syncService.setCache('quotations', updatedQuotations);
    navigateTo('quotations');
  };

  const handleSaveCertificate = (newCertificate: MedicalCertificate) => {
    const updatedCertificates = [newCertificate, ...certificates];
    setCertificates(updatedCertificates);
    syncService.setCache('certificates', updatedCertificates);
    navigateTo('certificates');
  };

  const handleSaveProposal = (newProposal: TreatmentProposal) => {
    const updatedProposals = [newProposal, ...proposals];
    setProposals(updatedProposals);
    syncService.setCache('proposals', updatedProposals);
    navigateTo('treatment-proposals');
  };

  const handleSaveDiagnostic = (newDiagnostic: Diagnostic) => {
    const updatedDiagnostics = [newDiagnostic, ...diagnostics];
    setDiagnostics(updatedDiagnostics);
    syncService.setCache('diagnostics', updatedDiagnostics);
    navigateTo('diagnostics');
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    const updatedPatients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    setPatients(updatedPatients);
    syncService.setCache('patients', updatedPatients);
  };

  const handleUpdateWoundStatus = (woundId: string, status: Wound['status'], comments?: string) => {
    setWounds(prev => {
      const updated = prev.map(w => 
        w.id === woundId ? { ...w, status, doctorComments: comments || w.doctorComments } : w
      );
      syncService.setCache('wounds', updated);
      return updated;
    });
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) {
        const mappedProfiles: UserProfile[] = data.map(p => ({
          id: p.id,
          role: p.role as Role,
          fullName: p.full_name,
          email: p.email,
          username: p.username,
          password: p.password,
          phone: p.phone,
          license: p.license,
          specialty: p.specialty,
          photoUrl: p.photo_url,
          bio: p.bio,
          status: p.status as 'active' | 'suspended'
        }));
        setProfiles(mappedProfiles);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    // Inicializar perfil basado en el rol si no hay uno
    if (isLoggedIn && !currentProfile) {
      const existingProfile = profiles.find(p => p.role === currentRole);
      if (existingProfile) {
        setCurrentProfileData(existingProfile);
      } else {
        const defaultProfile: UserProfile = {
          id: currentRole === 'Administrador' ? 'admin-1' : currentRole === 'Doctor' ? 'doc-1' : 'nurse-1',
          role: currentRole,
          fullName: currentRole === 'Administrador' ? 'Harold Anguiano' : currentRole === 'Doctor' ? 'Dr. Especialista' : 'Enf. Operativo',
          email: currentRole === 'Administrador' ? 'admin@vimedical.com' : currentRole === 'Doctor' ? 'doctor@vimedical.com' : 'enfermero@vimedical.com',
          username: currentRole === 'Administrador' ? 'admin' : currentRole === 'Doctor' ? 'doctor' : 'enfermero',
          password: '123prueba',
          status: 'active'
        };
        setCurrentProfileData(defaultProfile);
        
        setProfiles(prev => {
          if (!prev.find(p => p.username === defaultProfile.username)) {
            return [...prev, defaultProfile];
          }
          return prev;
        });
      }
    }
  }, [isLoggedIn, currentRole]); // Removed profiles from dependencies

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    setCurrentProfileData(updatedProfile);
    setProfiles(prev => {
      const exists = prev.find(p => p.id === updatedProfile.id);
      if (exists) {
        return prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      }
      return [...prev, updatedProfile];
    });

    const supabaseData = {
      role: updatedProfile.role,
      full_name: updatedProfile.fullName,
      email: updatedProfile.email,
      username: updatedProfile.username,
      password: updatedProfile.password,
      phone: updatedProfile.phone,
      license: updatedProfile.license,
      specialty: updatedProfile.specialty,
      photo_url: updatedProfile.photoUrl,
      bio: updatedProfile.bio,
      status: updatedProfile.status
    };

    try {
      if (updatedProfile.id.length > 20) { // Likely a UUID
        await supabase.from('profiles').upsert([{ id: updatedProfile.id, ...supabaseData }]);
      } else {
        const { data } = await supabase.from('profiles').insert([supabaseData]).select();
        if (data && data[0]) {
          setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? { ...updatedProfile, id: data[0].id } : p));
          if (currentProfile?.id === updatedProfile.id) {
            setCurrentProfileData({ ...updatedProfile, id: data[0].id });
          }
        }
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    }
    
    toast.success('Perfil actualizado correctamente');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentRole');
    setCurrentView('dashboard');
  };

  const sendNotification = async (title: string, body: string, voiceText: string, targetRole: Role) => {
    const { error } = await supabase
      .from('notifications')
      .insert([
        { title, body, voice_text: voiceText, target_role: targetRole }
      ]);
    if (error) console.error('Error enviando notificación:', error);
  };

  useEffect(() => {
    (window as any).navigateToRegister = () => setCurrentView('register-nurse');
    return () => {
      delete (window as any).navigateToRegister;
    };
  }, []);

  if (!isLoggedIn) {
    if (currentView === 'register-nurse') {
      return <RegisterNurseView 
        onLogin={(role) => {
          setCurrentRole(role);
          setIsLoggedIn(true);
          setCurrentView('dashboard');
        }} 
        onBack={() => setCurrentView('dashboard')}
        onRegister={handleUpdateProfile}
      />;
    }
    return <LoginView onLogin={(role) => {
      setCurrentRole(role);
      setIsLoggedIn(true);
      setCurrentView('dashboard');
    }} profiles={profiles} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Toaster />
      <PWAInstallPrompt />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary flex items-center justify-between px-6 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="h-8 w-auto mix-blend-multiply" />
          <span className="text-white font-bold tracking-tight">ViMedical</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-72 bg-primary flex flex-col z-50 transition-transform duration-300 ease-in-out overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl shadow-lg backdrop-blur-sm">
              <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">ViMedical</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'dashboard' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button
            onClick={() => navigateTo('patients')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'patients' || currentView === 'patient-detail' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
            Pacientes
          </button>

          <button
            onClick={() => navigateTo('clinical-history')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'clinical-history' || currentView === 'clinical-history-detail' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-5 h-5" />
            Historial Clínico
          </button>

          <button
            onClick={() => navigateTo('quotations')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'quotations' || currentView === 'new-quotation' || currentView === 'quotation-detail'
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-5 h-5" />
            Cotizaciones
          </button>

          {(currentRole === 'Administrador' || currentRole === 'Doctor') && (
            <button
              onClick={() => navigateTo('certificates')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'certificates' || currentView === 'new-certificate' || currentView === 'certificate-detail'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-5 h-5" />
              Certificados Médicos
            </button>
          )}

          <button
            onClick={() => navigateTo('treatment-proposals')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'treatment-proposals' || currentView === 'new-treatment-proposal' || currentView === 'treatment-proposal-detail'
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <PenTool className="w-5 h-5" />
            Propuesta de Tratamiento
          </button>

          <button
            onClick={() => navigateTo('diagnostics')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'diagnostics' || currentView === 'new-diagnostic' || currentView === 'diagnostic-detail'
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-5 h-5" />
            Diagnósticos
          </button>

          {(currentRole === 'Administrador' || currentRole === 'Doctor') && (
            <button
              onClick={() => navigateTo('nurses-management')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'nurses-management'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Enfermeros
            </button>
          )}

          <button
            onClick={() => navigateTo('profile')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'profile' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCircle className="w-5 h-5" />
            Mi Perfil
          </button>

          <button
            onClick={() => navigateTo('settings')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'settings' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </button>
        </nav>
        
        <div className="p-6 mt-auto">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Estado Sinc.</p>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                {isOnline ? 'En línea' : 'Sin conexión'}
                {pendingOps > 0 && <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded-md text-[8px]">{pendingOps}</span>}
              </p>
            </div>
            {pendingOps > 0 && isOnline && (
              <button 
                onClick={() => syncService.processQueue().then(() => setPendingOps(syncService.getQueue().length))}
                className={`p-2 rounded-lg hover:bg-white/10 text-white/70 transition-all ${isSyncing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          <div 
            onClick={() => navigateTo('profile')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary font-black text-lg shadow-inner overflow-hidden">
              {currentProfile?.photoUrl ? (
                <img src={currentProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                currentProfile?.fullName[0] || currentRole[0]
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentProfile?.fullName || currentRole}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">En línea</p>
              </div>
            </div>
          </div>
          {/* Logout */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-300 hover:bg-red-500/10 transition-all font-bold text-sm group"
            >
              <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-[1600px] mx-auto">
          {currentView === 'dashboard' && currentRole === 'Enfermero' && <NurseDashboard navigateTo={navigateTo} patients={patients} wounds={wounds} treatments={MOCK_TREATMENTS} profile={currentProfile} />}
          {currentView === 'dashboard' && currentRole === 'Administrador' && (
            <AdminDashboard 
              navigateTo={navigateTo} 
              patients={patients} 
              wounds={wounds} 
              sendNotification={sendNotification} 
              onUpdateWoundStatus={handleUpdateWoundStatus}
              profile={currentProfile}
            />
          )}
          {currentView === 'dashboard' && currentRole === 'Doctor' && (
            <DoctorDashboard 
              navigateTo={navigateTo} 
              patients={patients} 
              wounds={wounds} 
              sendNotification={sendNotification} 
              onUpdateWoundStatus={handleUpdateWoundStatus}
              profile={currentProfile}
            />
          )}
          
          {currentView === 'patients' && <PatientsView navigateTo={navigateTo} patients={patients} />}
          {currentView === 'patient-detail' && selectedPatientId && (
            <PatientDetailView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
            />
          )}
          {currentView === 'wound-detail' && selectedWoundId && (
            <WoundDetailView 
              woundId={selectedWoundId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
            />
          )}
          {currentView === 'new-assessment' && selectedPatientId && (
            <AssessmentFormView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients}
            />
          )}
          {currentView === 'new-treatment' && selectedWoundId && (
            <TreatmentFormView 
              woundId={selectedWoundId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
            />
          )}
          {currentView === 'new-patient' && (
            <NewPatientFormView navigateTo={navigateTo} onSave={handleAddPatient} />
          )}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'clinical-history' && <ClinicalHistoryListView navigateTo={navigateTo} patients={patients} />}
          {currentView === 'clinical-history-detail' && selectedPatientId && (
            <ClinicalHistoryDetailView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients} 
              onUpdate={handleUpdatePatient}
              currentRole={currentRole}
            />
          )}
          {currentView === 'quotations' && (
            <QuotationListView 
              navigateTo={navigateTo} 
              quotations={quotations} 
              currentRole={currentRole} 
            />
          )}
          {currentView === 'new-quotation' && (
            <NewQuotationView 
              navigateTo={navigateTo} 
              patients={patients} 
              onSave={handleSaveQuotation} 
              sendNotification={sendNotification}
            />
          )}
          {currentView === 'quotation-detail' && selectedQuotationId && (
            <QuotationDetailView 
              quotationId={selectedQuotationId} 
              navigateTo={navigateTo} 
              quotations={quotations} 
            />
          )}
          {currentView === 'privacy-notice' && selectedPatientId && (
            <PrivacyNoticeView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients} 
              onUpdate={handleUpdatePatient}
            />
          )}
          {currentView === 'consent-form' && selectedPatientId && (
            <ConsentFormView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients} 
              onUpdate={handleUpdatePatient}
            />
          )}
          {currentView === 'certificates' && (
            <CertificatesListView 
              navigateTo={navigateTo} 
              certificates={certificates} 
              currentRole={currentRole} 
            />
          )}
          {currentView === 'new-certificate' && (
            <NewCertificateView 
              navigateTo={navigateTo} 
              patients={patients} 
              wounds={wounds}
              onSave={handleSaveCertificate} 
            />
          )}
          {currentView === 'certificate-detail' && selectedCertificateId && (
            <CertificateDetailView 
              certificateId={selectedCertificateId} 
              navigateTo={navigateTo} 
              certificates={certificates} 
            />
          )}
          {currentView === 'treatment-proposals' && (
            <TreatmentProposalsListView 
              navigateTo={navigateTo} 
              proposals={proposals} 
              currentRole={currentRole} 
            />
          )}
          {currentView === 'new-treatment-proposal' && (
            <NewTreatmentProposalView 
              navigateTo={navigateTo} 
              patients={patients} 
              onSave={handleSaveProposal} 
            />
          )}
          {currentView === 'treatment-proposal-detail' && selectedProposalId && (
            <TreatmentProposalDetailView 
              proposalId={selectedProposalId} 
              navigateTo={navigateTo} 
              proposals={proposals} 
            />
          )}
          {currentView === 'diagnostics' && (
            <DiagnosticsListView 
              navigateTo={navigateTo} 
              diagnostics={diagnostics} 
              currentRole={currentRole} 
            />
          )}
          {currentView === 'new-diagnostic' && (
            <NewDiagnosticView 
              navigateTo={navigateTo} 
              patients={patients} 
              onSave={handleSaveDiagnostic} 
            />
          )}
          {currentView === 'diagnostic-detail' && selectedDiagnosticId && (
            <DiagnosticDetailView 
              diagnosticId={selectedDiagnosticId} 
              navigateTo={navigateTo} 
              diagnostics={diagnostics} 
            />
          )}
          {currentView === 'profile' && currentProfile && (
            <ProfileView 
              profile={currentProfile} 
              onUpdate={handleUpdateProfile} 
              onBack={() => navigateTo('dashboard')} 
            />
          )}
          {currentView === 'nurses-management' && (
            <NursesManagementView 
              profiles={profiles} 
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={(id) => {
                setProfiles(prev => prev.filter(p => p.id !== id));
                toast.success('Enfermero eliminado correctamente');
              }}
              onBack={() => navigateTo('dashboard')} 
            />
          )}
          {currentView === 'register-nurse' && (
            <RegisterNurseView 
              onLogin={(role) => {
                setCurrentRole(role);
                setIsLoggedIn(true);
              }} 
              onBack={() => setCurrentView('dashboard')} 
              onRegister={handleUpdateProfile}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function SettingsView() {
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionStatus(Notification.permission);
    if (granted) {
      triggerFullNotification('Notificaciones Activadas', 'Ahora recibirás alertas sonoras y visuales en este dispositivo.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Configuración</h2>
        <p className="text-slate-500 font-medium">Gestiona las alertas y preferencias del sistema.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Notificaciones */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center flex-shrink-0">
              <Bell className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 mb-2">Notificaciones del Sistema</h3>
              <p className="text-slate-500 text-sm mb-6">Activa las ventanas emergentes para recibir alertas críticas mientras usas otras aplicaciones.</p>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${permissionStatus === 'granted' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-sm font-bold text-slate-700">
                    Estado: {permissionStatus === 'granted' ? 'Activadas' : permissionStatus === 'denied' ? 'Bloqueadas' : 'Pendientes'}
                  </span>
                </div>
                <button 
                  onClick={handleRequestPermission}
                  disabled={permissionStatus === 'granted'}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    permissionStatus === 'granted' 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-indigo-700 shadow-lg shadow-primary/20'
                  }`}
                >
                  {permissionStatus === 'granted' ? 'Ya Activo' : 'Activar Ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sonido y Voz */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-900 mb-2">Sonido y Voz (TTS)</h3>
              <p className="text-slate-500 text-sm mb-6">Prueba los componentes de audio para asegurar que las alertas de voz y sonidos de notificación funcionen correctamente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => playNotificationSound()}
                  className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Bell className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Probar Sonido</span>
                </button>

                <button 
                  onClick={() => speakMessage('Prueba de voz del sistema ViMedical. Las notificaciones están configuradas correctamente.')}
                  className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Mic className="w-5 h-5 text-slate-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700">Probar Voz</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Información Técnica */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/30">
          <div className="flex items-center gap-4 mb-6">
            <Activity className="w-6 h-6 text-secondary" />
            <h3 className="text-lg font-black uppercase tracking-wider">Estado de Conexión</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-slate-400 text-sm font-medium">Servidor Realtime</span>
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Conectado
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-slate-400 text-sm font-medium">Base de Datos</span>
              <span className="text-emerald-400 font-bold">Sincronizada</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-400 text-sm font-medium">Versión del Sistema</span>
              <span className="text-slate-500 font-mono text-xs">v2.4.0-clinical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicalHistoryListView({ navigateTo, patients }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[] }) {
  const [search, setSearch] = useState('');

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Historial Clínico</h2>
          <p className="text-slate-500 font-medium">Consulta y gestión de antecedentes de pacientes.</p>
        </div>
      </header>

      <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Users className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar paciente por nombre o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => navigateTo('clinical-history-detail', patient.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl group-hover:bg-secondary group-hover:text-primary transition-colors">
                {patient.fullName[0]}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{patient.fullName}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{patient.phone}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Nacimiento: {patient.dateOfBirth}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 line-clamp-2">
                {patient.pathologicalHistory || 'Sin antecedentes registrados'}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClinicalHistoryDetailView({ 
  patientId, 
  navigateTo, 
  patients, 
  onUpdate,
  currentRole
}: { 
  patientId: string, 
  navigateTo: (view: View, pId?: string, wId?: string) => void, 
  patients: Patient[], 
  onUpdate: (p: Patient) => void,
  currentRole: Role
}) {
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return <div>Paciente no encontrado</div>;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [newComment, setNewComment] = useState('');

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
    toast.success('Historial actualizado correctamente.');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: ClinicalComment = {
      id: Date.now().toString(),
      author: currentRole === 'Doctor' ? 'Dr. Especialista' : 'Enf. Operativo',
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
    
    // Notificar al otro rol
    const targetRole = currentRole === 'Doctor' ? 'Enfermero' : 'Doctor';
    triggerFullNotification(
      'Nuevo comentario clínico',
      `${comment.author} ha comentado en el historial de ${patient.fullName}`,
      `Atención ${targetRole}: Hay un nuevo comentario clínico para el paciente ${patient.fullName}.`
    );
  };

  const handleExportPDF = () => {
    const patientWounds = MOCK_WOUNDS.filter(w => w.patientId === patient.id);
    const patientTreatments = MOCK_TREATMENTS.filter(t => patientWounds.some(w => w.id === t.woundId));
    
    generateClinicalHistoryPDF(patient, patientWounds, patientTreatments);
    toast.success('Generando historial clínico completo en PDF...');
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
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
                    value={formData.familyHistory}
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
                    value={formData.pathologicalHistory}
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
                    value={formData.nonPathologicalHistory}
                    onChange={(e) => setFormData({...formData, nonPathologicalHistory: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[100px]"
                  />
                ) : (
                  <p className="text-slate-700 font-medium">{patient.nonPathologicalHistory}</p>
                )}
              </div>
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
        </div>
      </div>
    </div>
  );
}

// --- Dashboards por Rol ---


function ProfileView({ profile, onUpdate, onBack }: { profile: UserProfile, onUpdate: (p: UserProfile) => void, onBack: () => void }) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Mi Perfil</h2>
            <p className="text-slate-500 font-medium">Gestiona tu información personal y profesional.</p>
          </div>
        </div>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all"
        >
          {isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Foto y Bio */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-16 h-16 text-slate-300" />
                )}
              </div>
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary text-primary rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900">{formData.fullName}</h3>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{formData.role}</p>
            
            <div className="mt-8 text-left space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biografía / Notas</label>
              {isEditing ? (
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[120px] outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {formData.bio || 'No hay biografía registrada.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datos Personales y Credenciales */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-8 border-b border-slate-100 pb-4">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                  placeholder="No registrado"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula Profesional</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                  placeholder="No registrada"
                />
              </div>
              {formData.role !== 'Administrador' && (
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                    placeholder="Ej. Heridas y Estomas"
                  />
                </div>
              )}
            </div>

            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm mt-12 mb-8 border-b border-slate-100 pb-4">Credenciales de Acceso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    disabled={!isEditing}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 pr-12"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NursesManagementView({ profiles, onUpdateProfile, onDeleteProfile, onBack }: { profiles: UserProfile[], onUpdateProfile: (p: UserProfile) => void, onDeleteProfile: (id: string) => void, onBack: () => void }) {
  const nurses = profiles.filter(p => p.role === 'Enfermero');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Panel
          </button>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Enfermeros</h2>
          <p className="text-slate-500 font-medium">Administra el acceso y perfiles del personal operativo.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {nurses.map(nurse => (
          <div key={nurse.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-colors ${nurse.status === 'suspended' ? 'bg-red-500' : 'bg-emerald-500'}`} />
            
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                {nurse.photoUrl ? (
                  <img src={nurse.photoUrl} alt={nurse.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary text-white font-black text-2xl">
                    {nurse.fullName[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{nurse.fullName}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">@{nurse.username}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  nurse.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {nurse.status === 'suspended' ? 'Suspendido' : 'Activo'}
                </span>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-slate-600 font-medium truncate">{nurse.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-slate-600 font-medium">{nurse.phone || 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-slate-600 font-medium">Cédula: {nurse.license || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-slate-600 font-medium">{nurse.specialty || 'General'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const newStatus = nurse.status === 'suspended' ? 'active' : 'suspended';
                  onUpdateProfile({ ...nurse, status: newStatus });
                  toast.success(`Enfermero ${newStatus === 'suspended' ? 'suspendido' : 'activado'} correctamente`);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  nurse.status === 'suspended' 
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
              >
                {nurse.status === 'suspended' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {nurse.status === 'suspended' ? 'Activar' : 'Suspender'}
              </button>
              {confirmDeleteId === nurse.id ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      onDeleteProfile(nurse.id);
                      setConfirmDeleteId(null);
                    }}
                    className="flex-1 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Sí
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmDeleteId(nurse.id)}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
        {nurses.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-12 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No hay enfermeros registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ navigateTo, patients, wounds, sendNotification, onUpdateWoundStatus, profile }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>, onUpdateWoundStatus: (id: string, status: Wound['status']) => void, profile: UserProfile | null }) {
  const pendingAdmin = wounds.filter(w => w.status === 'pending_admin');
  const recentPatients = patients.slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {Notification.permission !== 'granted' && (
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
        <div className="flex gap-3">
          <button 
            onClick={() => navigateTo('new-patient')}
            className="flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 rounded-xl font-black hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
          <button 
            onClick={() => navigateTo('new-quotation')}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20"
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
                  <div key={wound.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-slate-200/50 hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary-dark font-black text-2xl">
                        {patient?.fullName[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900">{patient?.fullName}</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{wound.location} • {wound.description}</p>
                        <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Plan propuesto: {wound.proposedPlan.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if (navigator.onLine) {
                          await supabase.from('wounds').update({ 
                            status: 'pending_doctor' 
                          }).eq('id', wound.id);
                        } else {
                          syncService.addToQueue('wounds', 'UPDATE', { 
                            id: wound.id, 
                            status: 'pending_doctor' 
                          });
                        }

                        await sendNotification(
                          'Nueva Valoración para Revisar',
                          `El administrador ha enviado la valoración de ${patient?.fullName} para su aprobación médica.`,
                          `Atención Doctor: Tiene una nueva valoración de ${patient?.fullName} pendiente de su aprobación.`,
                          'Doctor'
                        );
                        onUpdateWoundStatus(wound.id, 'pending_doctor');
                        toast.success('Valoración revisada y enviada al Doctor exitosamente.');
                      }}
                      className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Revisar y Enviar a Doctor
                    </button>
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
    </div>
  );
}

function DoctorDashboard({ navigateTo, patients, wounds, sendNotification, onUpdateWoundStatus, profile }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>, onUpdateWoundStatus: (id: string, status: Wound['status'], comments?: string) => void, profile: UserProfile | null }) {
  const pendingDoctor = wounds.filter(w => w.status === 'pending_doctor');
  const recentPatients = patients.slice(0, 5);
  const [comments, setComments] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {Notification.permission !== 'granted' && (
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
        <button 
          onClick={() => navigateTo('new-patient')}
          className="flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-secondary-dark transition-all shadow-xl shadow-secondary/20 scale-100 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Nuevo Paciente
        </button>
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
                            
                            if (navigator.onLine) {
                              await supabase.from('wounds').update({ 
                                status: 'rejected', 
                                doctor_comments: comments 
                              }).eq('id', wound.id);
                            } else {
                              syncService.addToQueue('wounds', 'UPDATE', { 
                                id: wound.id, 
                                status: 'rejected', 
                                doctor_comments: comments 
                              });
                            }

                            await sendNotification(
                              'Plan de Tratamiento con Correcciones',
                              `El Doctor ha solicitado correcciones para ${patient?.fullName}: ${comments}`,
                              `Atención Enfermero: El Doctor ha enviado comentarios de corrección para el paciente ${patient?.fullName}. Por favor revise las indicaciones.`,
                              'Enfermero'
                            );
                            onUpdateWoundStatus(wound.id, 'rejected', comments);
                            toast.success('Plan Rechazado. Se notificará al enfermero.');
                            setComments('');
                          }} 
                          className="flex-1 md:flex-none text-white bg-red-500 px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          <XCircle className="w-5 h-5" /> Rechazar
                        </button>
                        <button 
                          onClick={async () => {
                            if (navigator.onLine) {
                              await supabase.from('wounds').update({ 
                                status: 'approved', 
                                doctor_comments: comments || 'Aprobado sin comentarios adicionales.' 
                              }).eq('id', wound.id);
                            } else {
                              syncService.addToQueue('wounds', 'UPDATE', { 
                                id: wound.id, 
                                status: 'approved', 
                                doctor_comments: comments || 'Aprobado sin comentarios adicionales.' 
                              });
                            }

                            await sendNotification(
                              'Plan de Tratamiento Aprobado',
                              `El Doctor ha aprobado el plan para ${patient?.fullName}. Ya puede iniciar las visitas.`,
                              `Atención Enfermero: El Doctor ha aprobado el plan de tratamiento para ${patient?.fullName}. Ya puede consultar las indicaciones e iniciar las visitas.`,
                              'Enfermero'
                            );
                            onUpdateWoundStatus(wound.id, 'approved', comments || 'Aprobado sin comentarios adicionales.');
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
                              onClick={() => window.open(photo, '_blank')}
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
    </div>
  );
}

// --- Componentes Compartidos ---

function CameraCapture({ onCapture, onClose }: { onCapture: (blob: string) => void, onClose: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Por favor, asegúrese de dar los permisos necesarios.");
      }
    }
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-slate-800">
        {error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-white font-bold">{error}</p>
            <button onClick={onClose} className="mt-8 bg-white text-slate-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs">Cerrar</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover aspect-[3/4]" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-6 right-6">
              <button onClick={onClose} className="bg-black/50 text-white p-3 rounded-full backdrop-blur-md hover:bg-black/70 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-10 inset-x-0 flex justify-center">
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl scale-100 active:scale-90 transition-transform border-8 border-white/20"
              >
                <div className="w-14 h-14 bg-white border-4 border-slate-900 rounded-full" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SignaturePad({ onSave, onCancel, title }: { onSave: (signature: string) => void, onCancel: () => void, title: string }) {
  const sigCanvas = React.useRef<SignatureCanvas>(null);

  const clear = () => sigCanvas.current?.clear();
  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor, proporcione una firma.');
      return;
    }
    onSave(sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 bg-slate-50">
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ className: 'w-full h-64 cursor-crosshair' }}
            />
          </div>
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Firme dentro del recuadro</p>
        </div>
        <div className="p-8 flex gap-4">
          <button 
            onClick={clear}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Limpiar
          </button>
          <button 
            onClick={save}
            className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-primary/20 transition-all"
          >
            Guardar Firma
          </button>
        </div>
      </div>
    </div>
  );
}

// --- M1: Gestión de Pacientes ---

function PatientsView({ navigateTo, patients }: { navigateTo: (view: View, pId?: string) => void, patients: Patient[] }) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Pacientes</h2>
          <p className="text-slate-500 font-medium">Registro y búsqueda de pacientes.</p>
        </div>
        <button 
          onClick={() => navigateTo('new-patient')}
          className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/20 hover:bg-secondary-dark transition-all scale-100 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Nuevo Paciente
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {patients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => navigateTo('patient-detail', patient.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="flex items-center gap-5 mb-6 relative">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors">{patient.fullName}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{patient.occupation || 'Paciente'}</p>
              </div>
            </div>

            <div className="space-y-4 relative">
              <div className="flex items-center gap-3 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold">{patient.dateOfBirth}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-bold">{patient.phone}</span>
              </div>
              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ver Expediente</span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientDetailView({ patientId, navigateTo, patients, wounds }: { patientId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[] }) {
  const patient = patients.find(p => p.id === patientId);
  const patientWounds = wounds.filter(w => w.patientId === patientId);
  const [activeTab, setActiveTab] = useState<'wounds' | 'history' | 'charts'>('wounds');

  if (!patient) return <div>Paciente no encontrado</div>;

  // Datos para la gráfica de progreso (ejemplo basado en el área de las heridas)
  const chartData = patientWounds.flatMap(w => 
    MOCK_TREATMENTS.filter(t => t.woundId === w.id).map(log => ({
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
            <div className="flex gap-2">
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

      <div className="flex gap-4 border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab('wounds')}
          className={`pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'wounds' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Heridas y Tratamientos
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
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Heridas</h3>
              <button 
                onClick={() => navigateTo('new-assessment', patient.id)}
                className="bg-secondary text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-secondary/20 hover:bg-secondary-dark transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                Nueva Valoración
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {MOCK_TREATMENTS.filter(t => t.woundId === wound.id).length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Última</p>
                      <p className="font-black text-slate-900">
                        {(() => {
                          const woundTreatments = MOCK_TREATMENTS.filter(t => t.woundId === wound.id);
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
                </div>
              ))}
              {patientWounds.length === 0 && (
                <div className="col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-[2.5rem] p-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Activity className="w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Sin registros de heridas</p>
                  <p className="text-slate-500 mt-2 font-medium">Comienza realizando una valoración inicial.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-lg shadow-slate-200/30">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Signos Vitales
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">T. Arterial</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.ta || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">F. Cardiaca</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.fc || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">F. Resp.</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.fr || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Peso</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.peso || 'N/A'} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Talla</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.talla || 'N/A'} m</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">IMC</p>
                    <p className="font-black text-slate-900">{patient.physicalExploration?.imc || 'N/A'}</p>
                  </div>
                </div>
              </section>

              <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  Antecedentes
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Patológicos</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {patient.pathologicalHistoryDetails?.endocrino?.diabetes && <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase">Diabetes</span>}
                      {patient.pathologicalHistoryDetails?.cardiovascular?.hipertension && <span className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase">HTA</span>}
                    </div>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{patient.pathologicalHistory}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">No Patológicos</p>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{patient.nonPathologicalHistory}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-4 h-4" />
                  </div>
                  Padecimiento Actual
                </h3>
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {patient.currentCondition || 'No se ha registrado el padecimiento actual.'}
                </p>
                
                <div className="mt-10 pt-10 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Regiones y Segmentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {patient.regionsSegments ? Object.entries(patient.regionsSegments).map(([key, value]) => (
                      value && (
                        <div key={key} className="bg-slate-50 p-4 rounded-xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                          <p className="text-sm text-slate-700 font-medium">{value}</p>
                        </div>
                      )
                    )) : (
                      <p className="text-slate-500 italic text-sm">Sin datos de exploración por regiones.</p>
                    )}
                  </div>
                </div>
              </section>
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

// --- M2: Formulario de Valoración Guiado ---

function AssessmentFormView({ patientId, navigateTo, patients }: { patientId: string, navigateTo: (view: View, pId?: string) => void, patients: Patient[] }) {
  const patient = patients.find(p => p.id === patientId);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map((file: File) => URL.createObjectURL(file));
      const totalPhotos = [...photos, ...newPhotos].slice(0, 5);
      setPhotos(totalPhotos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error('Debe incluir al menos una foto inicial de la herida.');
      return;
    }
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const woundData: Partial<Wound> = {
      patientId: patientId,
      location: formData.get('location') as string || 'No especificada',
      description: formData.get('description') as string || '',
      proposedPlan: formData.get('proposed_plan') as string || '',
      status: 'pending_doctor',
      initialPhotos: photos,
      weight: formData.get('weight') as string,
      height: formData.get('height') as string,
      temp: formData.get('temp') as string,
      bloodPressureSystolic: formData.get('bloodPressureSystolic') as string,
      bloodPressureDiastolic: formData.get('bloodPressureDiastolic') as string,
      pulse: formData.get('pulse') as string,
      heartRate: formData.get('heartRate') as string,
      respiratoryRate: formData.get('respiratoryRate') as string,
      oxygenation: formData.get('oxygenation') as string,
      glycemiaFasting: formData.get('glycemiaFasting') as string,
      glycemiaPostprandial: formData.get('glycemiaPostprandial') as string,
      // Nuevos campos de valoración detallada
      width: formData.get('width') as string,
      length: formData.get('length') as string,
      depth: formData.get('depth') as string,
      tunneling: formData.get('tunneling') as string,
      sinusTract: formData.get('sinusTract') as string,
      undermining: formData.get('undermining') as string,
      painLevel: parseInt(formData.get('painLevel') as string) || 0,
      shape: formData.get('shape') as Wound['shape'],
      tissueType: {
        escara: formData.get('tissueType_escara') as string || '',
        necrosis: formData.get('tissueType_necrosis') as string || '',
        esfacelo: formData.get('tissueType_esfacelo') as string || '',
        granulacion: formData.get('tissueType_granulacion') as string || '',
        fibrina: formData.get('tissueType_fibrina') as string || '',
        hiperqueratosis: formData.get('tissueType_hiperqueratosis') as string || '',
        hipergranulacion: formData.get('tissueType_hipergranulacion') as string || '',
        subcutaneo: formData.get('tissueType_subcutaneo') as string || '',
        muscular: formData.get('tissueType_muscular') as string || '',
        tendon: formData.get('tissueType_tendon') as string || '',
        hueso: formData.get('tissueType_hueso') as string || '',
        capsula: formData.get('tissueType_capsula') as string || '',
        frictena: formData.get('tissueType_frictena') as string || '',
      },
      etiology: {
        porPresion: formData.get('etiology_porPresion') === 'on',
        venosa: formData.get('etiology_venosa') === 'on',
        arterial: formData.get('etiology_arterial') === 'on',
        mixta: formData.get('etiology_mixta') === 'on',
        diabetica: formData.get('etiology_diabetica') === 'on',
        quemadura: formData.get('etiology_quemadura') === 'on',
        quirurgica: formData.get('etiology_quirurgica') === 'on',
        neoplasica: formData.get('etiology_neoplasica') === 'on',
      },
      classification: {
        estadio: formData.get('classification_estadio') as string || '',
        martorell: formData.get('classification_martorell') === 'on',
        calcifilaxis: formData.get('classification_calcifilaxis') === 'on',
        mixta: formData.get('classification_mixta') === 'on',
        sinbad: {
          s: formData.get('sinbad_s') === 'on',
          i: formData.get('sinbad_i') === 'on',
          n: formData.get('sinbad_n') === 'on',
          b: formData.get('sinbad_b') === 'on',
          a: formData.get('sinbad_a') === 'on',
          d: formData.get('sinbad_d') === 'on',
        },
        thickness: formData.get('classification_thickness') as Wound['classification']['thickness'],
      },
      characteristics: {
        borders: formData.get('characteristics_borders') as Wound['characteristics']['borders'],
        perilesionalSkin: formData.get('characteristics_perilesionalSkin') as Wound['characteristics']['perilesionalSkin'],
        exudateType: formData.get('characteristics_exudateType') as Wound['characteristics']['exudateType'],
        exudateAmount: formData.get('characteristics_exudateAmount') as Wound['characteristics']['exudateAmount'],
        contaminationGrade: formData.get('characteristics_contaminationGrade') as Wound['characteristics']['contaminationGrade'],
      },
      abiArm: formData.get('abiArm') as string,
      abiLeftToe: formData.get('abiLeftToe') as string,
      abiLeftPedal: formData.get('abiLeftPedal') as string,
      abiLeftPostTibial: formData.get('abiLeftPostTibial') as string,
      abiRightToe: formData.get('abiRightToe') as string,
      abiRightPedal: formData.get('abiRightPedal') as string,
      abiRightPostTibial: formData.get('abiRightPostTibial') as string,
    };
    
    const notificationData = [
      {
        title: 'Nueva Valoración Inicial',
        body: `El enfermero ha registrado una valoración inicial para ${patient?.fullName}.`,
        voice_text: `Atención Administrador: Se ha recibido una nueva valoración inicial para el paciente ${patient?.fullName}. Por favor, revise y valide el registro.`,
        target_role: 'Administrador'
      },
      {
        title: 'Nueva Valoración Inicial',
        body: `El enfermero ha registrado una valoración inicial para ${patient?.fullName}.`,
        voice_text: `Atención Doctor: Se ha registrado una nueva valoración inicial para su paciente ${patient?.fullName}.`,
        target_role: 'Doctor'
      }
    ];

    if (!navigator.onLine) {
      syncService.addToQueue('wounds', 'INSERT', woundData);
      syncService.addToQueue('notifications', 'INSERT', notificationData);
    } else {
      await supabase.from('wounds').insert([woundData]);
      await supabase.from('notifications').insert(notificationData);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigateTo('patient-detail', patientId);
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Valoración Enviada!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          La valoración inicial ha sido registrada exitosamente y enviada para aprobación médica.
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

      <form className="space-y-10" onSubmit={handleSubmit}>
        
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            1. Exploración Física
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peso (kg) *</label>
              <input name="weight" required type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Talla (m) *</label>
              <input name="height" required type="number" step="0.01" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Temp. (°C) *</label>
              <input name="temp" required type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pulso *</label>
              <input name="pulse" required type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.C. *</label>
              <input name="heartRate" required type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.R. *</label>
              <input name="respiratoryRate" required type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Oxigenación (%) *</label>
              <input name="oxygenation" required type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div className="col-span-2 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Tensión Arterial *</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Sistólica</label>
                <input name="bloodPressureSystolic" required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Diastólica</label>
                <input name="bloodPressureDiastolic" required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
            </div>

            <div className="col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Glicemia *</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Ayuno</label>
                <input name="glycemiaFasting" required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Posprandial</label>
                <input name="glycemiaPostprandial" required type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 overflow-hidden">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Activity className="w-4 h-4" />
            </div>
            2. Índice Tobillo - Brazo (ABI)
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
                    <input name="abiArm" type="text" placeholder="Brazo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftToe" type="text" placeholder="Dedo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftPedial" type="text" placeholder="Pedial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiLeftTibial" type="text" placeholder="Tibial" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
                  </td>
                  <td className="border border-slate-200 p-0">
                    <input name="abiRightToe" type="text" placeholder="Dedo" className="w-full h-full p-4 text-center outline-none focus:bg-primary/5 font-medium" />
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
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Maximize className="w-4 h-4" />
            </div>
            3. Dimensiones de la Herida
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ancho (cm)</label>
              <input name="width" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Largo (cm)</label>
              <input name="length" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Profundidad (cm)</label>
              <input name="depth" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tunelización (cm)</label>
              <input name="tunneling" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tracto Sinusal (cm)</label>
              <input name="sinusTract" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Socavamiento (cm)</label>
              <input name="undermining" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
            4. Evaluación Detallada
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
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Clasificación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Wagner 0-5', 'Texas A-D', 'CEAP C0-C6', 'Grado 1-4'].map(item => (
                  <label key={item} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" name="classification" value={item} className="w-5 h-5 rounded border-slate-200 text-primary" />
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nivel de Dolor (0-10)</label>
                <input name="painLevel" type="range" min="0" max="10" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary mt-4" />
                <div className="flex justify-between text-[10px] font-black text-slate-400 mt-2">
                  <span>0 - Sin dolor</span>
                  <span>10 - Máximo</span>
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
              5. Fotos Iniciales (Mínimo 1) *
            </h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{photos.length}/5 fotos</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {photos.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 relative group">
                <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
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
                  <span className="text-[10px] font-black uppercase tracking-widest">Tomar Foto</span>
                </button>
              </>
            )}
          </div>
        </section>

        {showCamera && (
          <CameraCapture 
            onCapture={(dataUrl) => {
              setPhotos(prev => [...prev, dataUrl].slice(0, 5));
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Diagnóstico / Ubicación *</label>
              <input name="location" required type="text" placeholder="Ej. Dehiscencia de herida quirúrgica abdominal" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pronóstico *</label>
              <div className="relative">
                <select name="prognosis" required className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Plan Terapéutico Propuesto *</label>
              <textarea name="proposed_plan" required rows={5} placeholder="Ej. Prontosan solución (lavado)&#10;Prontosan gel&#10;Empaquetar con Kerlix&#10;Cubrir con Telfa&#10;Avintra 1 diario&#10;Curación c/ 24 horas." className="w-full border border-slate-200 rounded-[2rem] p-6 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all scale-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : 'Enviar a Aprobación'}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- M5: Informe Final en PDF & Detalle de Herida ---

function WoundDetailView({ woundId, navigateTo, patients, wounds }: { woundId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[] }) {
  const wound = wounds.find(w => w.id === woundId);
  const treatments = MOCK_TREATMENTS.filter(t => t.woundId === woundId).sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());

  if (!wound) return <div>Herida no encontrada</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigateTo('patient-detail', wound.patientId)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Expediente
          </button>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">{wound.location}</h2>
          <p className="text-slate-500 font-medium">{wound.description}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {wound.status === 'approved' && (
            <button onClick={() => navigateTo('new-treatment', wound.patientId, wound.id)} className="flex-1 md:flex-none bg-secondary text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-secondary/20 hover:bg-secondary-dark">
              <PlusCircle className="w-5 h-5" /> Registrar Visita
            </button>
          )}
          {wound.status === 'completed' && (
            <button 
              onClick={() => {
                const patient = patients.find(p => p.id === wound.patientId);
                if (patient) {
                  generateFinalReport(patient, wound, treatments);
                }
              }} 
              className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 hover:bg-emerald-700"
            >
              <FileText className="w-5 h-5" /> Generar Informe PDF
            </button>
          )}
        </div>
      </header>

      {/* Plan Aprobado */}
      {wound.status === 'approved' && (
        <section className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10 shadow-inner">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Plan de Tratamiento Aprobado</h3>
          <p className="text-slate-700 font-medium text-lg leading-relaxed">{wound.proposedPlan}</p>
          {wound.doctorComments && (
            <div className="mt-6 pt-6 border-t border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Comentarios del Doctor:</p>
              <p className="text-slate-600 font-medium italic">"{wound.doctorComments}"</p>
            </div>
          )}
        </section>
      )}

      {/* Galería Comparativa */}
      <section className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-slate-900/30">
        <h3 className="text-xl font-black mb-10 flex items-center gap-3">
          <Camera className="w-6 h-6 text-secondary" />
          Evolución Fotográfica
        </h3>
        <div className="flex gap-8 overflow-x-auto pb-8 snap-x scrollbar-hide">
          {/* Foto Inicial */}
          <div className="min-w-[320px] snap-center">
            <div className="aspect-[4/5] bg-slate-800 rounded-[2rem] overflow-hidden border-2 border-secondary relative group">
              <img src={wound.initialPhotos[0]} alt="Inicial" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">Valoración Inicial</p>
                <p className="text-sm font-medium text-slate-300">{new Date(wound.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          {/* Fotos de Tratamientos */}
          {treatments.map((t, idx) => (
            <div key={t.id} className="min-w-[320px] snap-center">
              <div className="aspect-[4/5] bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 relative group">
                <img src={t.photos[0]} alt="Herida" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Visita {treatments.length - idx}</p>
                  <p className="text-sm font-medium text-slate-300">{new Date(t.evaluationDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- M4: Registro de Visitas y Curaciones ---

function TreatmentFormView({ woundId, navigateTo, patients, wounds }: { woundId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[] }) {
  const wound = wounds.find(w => w.id === woundId);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [patientSignature, setPatientSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!wound) return null;
  const patient = patients.find(p => p.id === wound.patientId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map((file: File) => URL.createObjectURL(file));
      const totalPhotos = [...photos, ...newPhotos].slice(0, 5);
      setPhotos(totalPhotos);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSignature) {
      toast.error('El paciente debe firmar la asistencia.');
      return;
    }
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const treatmentData = {
      wound_id: woundId,
      evaluation_date: new Date().toISOString(),
      fluid_leakage: formData.get('fluidLeakage') === 'on',
      foreign_material: formData.get('foreignMaterial') === 'on',
      slough_presence: formData.get('sloughPresence') === 'on',
      peripheral_tracts_measurements: formData.get('peripheralTractsMeasurements') as string || '',
      prognosis: formData.get('prognosis') as string || 'Reservado',
      photos: photos,
      prontosan_solution: formData.get('prontosanSolution') === 'on',
      prontosan_gel: formData.get('prontosanGel') === 'on',
      kerlix: formData.get('kerlix') === 'on',
      telfa: formData.get('telfa') === 'on',
      avintra_administered: formData.get('avintraAdministered') === 'on',
      notes: formData.get('notes') as string || '',
      patient_signature: patientSignature
    };
    
    const notificationData = [
      {
        title: 'Nueva Curación Registrada',
        body: `Se ha registrado una visita de curación para ${patient?.fullName}.`,
        voice_text: `Atención: El enfermero ha registrado una nueva curación para el paciente ${patient?.fullName} con ${photos.length} fotos de seguimiento.`,
        target_role: 'Administrador'
      },
      {
        title: 'Nueva Curación Registrada',
        body: `Se ha registrado una visita de curación para ${patient?.fullName}.`,
        voice_text: `Atención Doctor: Se ha registrado una nueva curación para su paciente ${patient?.fullName}.`,
        target_role: 'Doctor'
      }
    ];

    if (!navigator.onLine) {
      syncService.addToQueue('treatment_logs', 'INSERT', treatmentData);
      syncService.addToQueue('notifications', 'INSERT', notificationData);
    } else {
      await supabase.from('treatment_logs').insert([treatmentData]);
      // Actualizar contador de visitas en la herida
      await supabase.from('wounds').update({ visit_count: (wound.visitCount || 0) + 1 }).eq('id', wound.id);
      await supabase.from('notifications').insert(notificationData);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigateTo('wound-detail', wound.patientId, wound.id);
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Visita Guardada!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          El registro de la curación ha sido guardado exitosamente en el historial del paciente.
        </p>
        <div className="mt-8 flex items-center gap-2 text-primary font-bold">
          <Clock className="w-5 h-5 animate-spin-slow" />
          Volviendo al detalle de la herida...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('wound-detail', wound.patientId, wound.id)} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Cancelar
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Registrar Visita</h2>
        <p className="text-slate-500 font-medium">Visita {wound.visitCount + 1} de {wound.targetVisits} • {patient?.fullName}</p>
      </header>

      {/* Recordatorio del Plan */}
      <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 shadow-inner">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Plan Aprobado a Seguir:</p>
        <p className="text-slate-700 font-medium leading-relaxed">{wound.proposedPlan}</p>
      </div>

      <form className="space-y-10" onSubmit={handleSubmit}>
        
        {/* M4: Hasta 5 fotos */}
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-4 h-4" />
              </div>
              1. Evidencia de Seguimiento
            </h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{photos.length}/5 fotos</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {photos.map((url, idx) => (
              <div key={idx} className="aspect-square rounded-3xl overflow-hidden border border-slate-200 relative group">
                <img src={url} alt={`Seguimiento ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
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
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
                >
                  <PlusCircle className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Añadir Foto</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
                >
                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tomar Foto</span>
                </button>
              </>
            )}
          </div>
        </section>

        {showCamera && (
          <CameraCapture 
            onCapture={(dataUrl) => {
              setPhotos(prev => [...prev, dataUrl].slice(0, 5));
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
            2. Procedimiento y Materiales
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['Prontosan Solución', 'Kerlix', 'Telfa', 'Iruxol', 'Microdacyn'].map(item => (
              <label key={item} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group">
                <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-200 text-primary focus:ring-primary" />
                <span className="font-black text-sm text-slate-700 group-hover:text-primary transition-colors">{item}</span>
              </label>
            ))}
          </div>

          <div className="pt-10">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Observaciones de la Visita</label>
            <textarea required rows={4} placeholder="Evolución, cantidad de exudado, cambios en el lecho de la herida..." className="w-full border border-slate-200 rounded-[2rem] p-6 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PenTool className="w-4 h-4" />
            </div>
            3. Confirmación de Asistencia
          </h3>
          <p className="text-slate-500 text-sm mb-6">El paciente debe firmar para confirmar la visita del enfermero.</p>
          
          <div className="flex flex-col items-center gap-6">
            {patientSignature ? (
              <div className="w-full text-center">
                <div className="relative inline-block">
                  <img src={patientSignature} alt="Firma del Paciente" className="h-32 border border-slate-200 rounded-2xl p-4 bg-slate-50" />
                  <button 
                    type="button"
                    onClick={() => setPatientSignature(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Firma Registrada</p>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setShowSignaturePad(true)}
                className="w-full py-10 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary transition-all group"
              >
                <PenTool className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-black text-xs uppercase tracking-widest">Solicitar Firma del Paciente</span>
              </button>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all scale-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : 'Guardar Visita'}
          </button>
        </div>
      </form>

      {showSignaturePad && (
        <SignaturePad 
          title="Firma de Asistencia del Paciente"
          onCancel={() => setShowSignaturePad(false)}
          onSave={(sig) => {
            setPatientSignature(sig);
            setShowSignaturePad(false);
          }}
        />
      )}
    </div>
  );
}

// --- M6: Cotizaciones ---

function QuotationListView({ navigateTo, quotations, currentRole }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string) => void, quotations: Quotation[], currentRole: Role }) {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Cotizaciones</h2>
          <p className="text-slate-500 font-medium">Gestión de presupuestos de tratamiento.</p>
        </div>
        {currentRole === 'Administrador' && (
          <button 
            onClick={() => navigateTo('new-quotation')}
            className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/20 hover:bg-secondary-dark transition-all scale-100 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nueva Cotización
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quotations.map(quotation => (
          <div 
            key={quotation.id} 
            onClick={() => navigateTo('quotation-detail', undefined, undefined, quotation.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                quotation.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {quotation.status === 'sent' ? 'Enviada' : 'Pendiente'}
              </span>
            </div>
            
            <h3 className="font-black text-xl text-slate-900 mb-1">{quotation.patientName}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              {new Date(quotation.createdAt).toLocaleDateString()}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-500 font-bold text-sm">Total:</span>
              <span className="text-primary font-black text-xl">${quotation.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        ))}
        {quotations.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-20 text-center">
            <Receipt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hay cotizaciones</p>
            <p className="text-slate-500 mt-2">Aún no se han generado presupuestos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewQuotationView({ navigateTo, patients, onSave, sendNotification }: { navigateTo: (view: View) => void, patients: Patient[], onSave: (q: Quotation) => void, sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void> }) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [items, setItems] = useState<Partial<QuotationItem>[]>([{ id: '1', description: '', quantity: 1, unitCost: 0, total: 0 }]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', quantity: 1, unitCost: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updatedItem.total = (updatedItem.quantity || 0) * (updatedItem.unitCost || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      toast.error('Selecciona un paciente');
      return;
    }
    
    setIsSubmitting(true);
    const patient = patients.find(p => p.id === selectedPatientId);

    const quotationData = {
      patient_id: selectedPatientId,
      patient_name: patient?.fullName,
      total_amount: totalAmount,
      status: 'sent',
      notes: notes
    };

    if (!navigator.onLine) {
      // Modo Offline para Cotizaciones
      const tempId = crypto.randomUUID();
      const newQuotation: Quotation = {
        id: tempId,
        patientId: selectedPatientId,
        patientName: patient?.fullName || '',
        createdAt: new Date().toISOString(),
        totalAmount: totalAmount,
        status: 'sent',
        notes: notes,
        items: items.map(i => ({ ...i, id: crypto.randomUUID() } as QuotationItem))
      };

      // En un sistema real, guardaríamos también los items en el sync queue
      // Para este prototipo, guardamos la cotización principal
      syncService.addToQueue('quotations', 'INSERT', quotationData);
      onSave(newQuotation);
      setIsSubmitting(false);
      toast.success('Cotización guardada localmente (Modo Offline). Se sincronizará al recuperar la conexión.');
      return;
    }

    try {
      // 1. Save Quotation
      const { data: qData, error: qError } = await supabase
        .from('quotations')
        .insert([quotationData])
        .select()
        .single();

      if (qError) throw qError;

      // 2. Save Items
      const itemsToInsert = items.map(item => ({
        quotation_id: qData.id,
        description: item.description,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total: item.total
      }));

      const { error: iError } = await supabase
        .from('quotation_items')
        .insert(itemsToInsert);

      if (iError) throw iError;

      const newQuotation: Quotation = {
        id: qData.id,
        patientId: selectedPatientId,
        patientName: patient?.fullName || '',
        createdAt: qData.created_at,
        totalAmount: totalAmount,
        status: 'sent',
        notes: notes,
        items: items.map(i => i as QuotationItem)
      };

      // 3. Notifications
      await sendNotification(
        'Nueva Cotización Generada',
        `Se ha generado una cotización para ${patient?.fullName} por $${totalAmount.toLocaleString()}.`,
        `Atención Enfermero: El administrador ha enviado una nueva cotización para el paciente ${patient?.fullName}.`,
        'Enfermero'
      );

      await sendNotification(
        'Nueva Cotización Generada',
        `Se ha generado una cotización para ${patient?.fullName} por $${totalAmount.toLocaleString()}.`,
        `Atención Doctor: Se ha registrado una nueva cotización para el paciente ${patient?.fullName}.`,
        'Doctor'
      );

      onSave(newQuotation);
      toast.success('Cotización enviada exitosamente.');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Error al guardar la cotización.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('quotations')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Cancelar
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nueva Cotización</h2>
        <p className="text-slate-500 font-medium">Carga de insumos y costos para el tratamiento.</p>
      </header>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <div className="mb-8">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Seleccionar Paciente *</label>
            <select 
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 appearance-none"
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Insumos y Materiales</h3>
              <button 
                type="button"
                onClick={addItem}
                className="text-primary hover:text-primary-dark font-bold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Añadir Insumo
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Descripción</label>
                    <input 
                      required
                      type="text" 
                      value={item.description}
                      onChange={(e) => updateItem(item.id!, 'description', e.target.value)}
                      placeholder="Ej. Prontosan Gel 250ml"
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Cant.</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id!, 'quantity', parseInt(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Costo U.</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={item.unitCost}
                      onChange={(e) => updateItem(item.id!, 'unitCost', parseFloat(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Total</label>
                    <div className="w-full p-3 text-sm font-black text-slate-700 text-center bg-white rounded-xl border border-slate-200">
                      ${item.total?.toLocaleString()}
                    </div>
                  </div>
                  <div className="md:col-span-1 flex justify-center">
                    <button 
                      type="button"
                      onClick={() => removeItem(item.id!)}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Notas Adicionales</label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre la cotización..."
                className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>
            <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 text-center min-w-[240px]">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Total Cotización</p>
              <p className="text-4xl font-black text-primary">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all scale-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : 'Generar y Compartir Cotización'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PrivacyNoticeView({ patientId, navigateTo, patients, onUpdate }: { patientId: string, navigateTo: (view: View) => void, patients: Patient[], onUpdate: (p: Patient) => void }) {
  const patient = patients.find(p => p.id === patientId);
  const [showSignature, setShowSignature] = useState(false);
  const [type, setType] = useState<'casa' | 'hospital'>('casa');

  if (!patient) return <div>Paciente no encontrado</div>;

  const handleSaveSignature = (signature: string) => {
    const updatedPatient: Patient = {
      ...patient,
      privacyNoticeSigned: true,
      privacyNoticeSignature: signature,
      privacyNoticeDate: new Date().toISOString(),
      privacyNoticeType: type
    };
    onUpdate(updatedPatient);
    setShowSignature(false);
    toast.success('Aviso de privacidad firmado correctamente.');
    navigateTo('patient-detail');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('patient-detail')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Expediente
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Aviso de Privacidad</h2>
        <p className="text-slate-500 font-medium">VIMEDICAL – Cuidados en {type === 'casa' ? 'Casa' : 'Hospital'}</p>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setType('casa')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${type === 'casa' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border border-slate-200 text-slate-400'}`}
        >
          Cuidados en Casa
        </button>
        <button 
          onClick={() => setType('hospital')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${type === 'hospital' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border border-slate-200 text-slate-400'}`}
        >
          Cuidados en Hospital
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 prose prose-slate max-w-none">
        <h3 className="text-center uppercase font-black text-slate-900 mb-8">AVISO DE PRIVACIDAD</h3>
        <p className="font-bold">VIMEDICAL – Cuidados en {type === 'casa' ? 'Casa' : 'Hospital'}</p>
        <p>En cumplimiento con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong>, VIMEDICAL informa lo siguiente:</p>
        
        <h4>1. Responsable del tratamiento de datos</h4>
        <p>VIMEDICAL es responsable del uso y protección de sus datos personales recabados para la prestación de servicios de atención domiciliaria.</p>
        
        <h4>2. Datos personales recabados</h4>
        <p>Se podrán solicitar:</p>
        <ul>
          <li><strong>Datos de identificación:</strong> Nombre, Teléfono, Dirección, Edad.</li>
          <li><strong>Datos de salud:</strong> Diagnóstico, Evolución clínica, Fotografías de heridas (si autoriza).</li>
        </ul>

        <h4>3. Finalidad del uso de datos</h4>
        <p>Sus datos serán utilizados para:</p>
        <ul>
          <li>Brindar atención clínica domiciliaria</li>
          <li>Integrar expediente médico</li>
          <li>Programar y dar seguimiento a citas</li>
          <li>Control administrativo y facturación</li>
          <li>Evaluación de calidad del servicio</li>
        </ul>

        <h4>4. Protección y confidencialidad</h4>
        <p>VIMEDICAL se compromete a:</p>
        <ul>
          <li>Mantener la confidencialidad de la información</li>
          <li>Utilizar sistemas seguros de registro</li>
          <li>No compartir datos con terceros sin autorización, salvo requerimiento legal o necesidad médica.</li>
        </ul>

        <h4>5. Derechos ARCO</h4>
        <p>Usted tiene derecho a: Acceder a sus datos, Rectificarlos, Cancelarlos, Oponerse a su uso. Puede solicitarlo a través de los canales oficiales de VIMEDICAL.</p>

        <h4>6. Transferencia de datos</h4>
        <p>Sus datos solo podrán compartirse con: Profesionales de salud involucrados en su atención, Autoridades sanitarias cuando la ley lo requiera.</p>

        <h4>7. Aceptación del aviso</h4>
        <p>Declaro haber leído y comprendido el presente Aviso de Privacidad.</p>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
          {patient.privacyNoticeSigned ? (
            <div className="text-center">
              <p className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-4">Firmado el {new Date(patient.privacyNoticeDate!).toLocaleDateString()}</p>
              <img src={patient.privacyNoticeSignature} alt="Firma" className="h-32 mx-auto border border-slate-200 rounded-xl p-2" />
            </div>
          ) : (
            <button 
              onClick={() => setShowSignature(true)}
              className="bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all flex items-center gap-3"
            >
              <PenTool className="w-5 h-5" /> Firmar Aviso de Privacidad
            </button>
          )}
        </div>
      </div>

      {showSignature && (
        <SignaturePad 
          title="Firma de Aviso de Privacidad"
          onCancel={() => setShowSignature(false)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
}

function ConsentFormView({ patientId, navigateTo, patients, onUpdate }: { patientId: string, navigateTo: (view: View) => void, patients: Patient[], onUpdate: (p: Patient) => void }) {
  const patient = patients.find(p => p.id === patientId);
  const [showSignature, setShowSignature] = useState(false);
  const [type, setType] = useState<'casa' | 'hospital'>('casa');

  if (!patient) return <div>Paciente no encontrado</div>;

  const handleSaveSignature = (signature: string) => {
    const updatedPatient: Patient = {
      ...patient,
      consentFormSigned: true,
      consentFormSignature: signature,
      consentFormDate: new Date().toISOString(),
      consentFormType: type
    };
    onUpdate(updatedPatient);
    setShowSignature(false);
    toast.success('Consentimiento informado firmado correctamente.');
    navigateTo('patient-detail');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header>
        <button onClick={() => navigateTo('patient-detail')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Expediente
        </button>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Consentimiento Informado</h2>
        <p className="text-slate-500 font-medium">VIMEDICAL – Cuidados en {type === 'casa' ? 'Casa' : 'Hospital'}</p>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setType('casa')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${type === 'casa' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border border-slate-200 text-slate-400'}`}
        >
          Cuidados en Casa
        </button>
        <button 
          onClick={() => setType('hospital')}
          className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${type === 'hospital' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white border border-slate-200 text-slate-400'}`}
        >
          Cuidados en Hospital
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 prose prose-slate max-w-none">
        <h3 className="text-center uppercase font-black text-slate-900 mb-8">CONSENTIMIENTO INFORMADO</h3>
        <p className="font-bold">VIMEDICAL – Cuidados en {type === 'casa' ? 'Casa' : 'Hospital'}</p>
        
        <p>Yo, <strong>{patient.fullName}</strong>, en calidad de paciente o responsable del paciente, autorizo a VIMEDICAL a proporcionar servicios de atención y curaciones a domicilio, de acuerdo con las siguientes condiciones:</p>

        <h4>1. Naturaleza del servicio</h4>
        <p>Entiendo que el servicio incluye:</p>
        <ul>
          <li>Valoración de la herida</li>
          <li>Limpieza y curación</li>
          <li>Aplicación de apósitos o materiales</li>
          <li>Educación sobre cuidados en casa</li>
          <li>Seguimiento clínico según evolución</li>
        </ul>

        <h4>2. Riesgos y limitaciones</h4>
        <p>Se me ha explicado que:</p>
        <ul>
          <li>Toda herida tiene riesgo de infección o complicaciones.</li>
          <li>El tratamiento domiciliario no sustituye la valoración médica cuando sea necesaria.</li>
          <li>En caso de detectar signos de alarma, el personal podrá recomendar atención médica inmediata.</li>
        </ul>

        <h4>3. Registro clínico</h4>
        <p>Autorizo que mi información clínica sea registrada en el expediente institucional de VIMEDICAL y en el sistema electrónico correspondiente para fines de:</p>
        <ul>
          <li>Seguimiento del tratamiento</li>
          <li>Continuidad de la atención</li>
          <li>Control clínico y administrativo</li>
        </ul>

        <h4>4. Uso de imágenes clínicas</h4>
        <p>Autorizo la toma de fotografías de la herida con fines de:</p>
        <ul>
          <li>Seguimiento clínico</li>
          <li>Evaluación de evolución</li>
          <li>Auditoría médica interna</li>
        </ul>
        <p>Las imágenes serán confidenciales y no se utilizarán con fines publicitarios sin autorización adicional.</p>

        <h4>5. Gestión de citas y comunicación</h4>
        <p>Entiendo que:</p>
        <ul>
          <li>La programación y seguimiento de citas se realiza únicamente a través de los canales oficiales de VIMEDICAL.</li>
          <li>Mi atención forma parte del programa institucional “Cuidados en Casa”.</li>
          <li>El personal actúa bajo coordinación de VIMEDICAL.</li>
        </ul>

        <h4>6. Aceptación</h4>
        <p>Declaro que he recibido información suficiente sobre el servicio, he podido realizar preguntas y acepto voluntariamente la atención domiciliaria.</p>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
          {patient.consentFormSigned ? (
            <div className="text-center">
              <p className="text-emerald-500 font-black uppercase tracking-widest text-xs mb-4">Firmado el {new Date(patient.consentFormDate!).toLocaleDateString()}</p>
              <img src={patient.consentFormSignature} alt="Firma" className="h-32 mx-auto border border-slate-200 rounded-xl p-2" />
            </div>
          ) : (
            <button 
              onClick={() => setShowSignature(true)}
              className="bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all flex items-center gap-3"
            >
              <PenTool className="w-5 h-5" /> Firmar Consentimiento Informado
            </button>
          )}
        </div>
      </div>

      {showSignature && (
        <SignaturePad 
          title="Firma de Consentimiento Informado"
          onCancel={() => setShowSignature(false)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
}

function QuotationDetailView({ quotationId, navigateTo, quotations }: { quotationId: string, navigateTo: (view: View) => void, quotations: Quotation[] }) {
  const quotation = quotations.find(q => q.id === quotationId);

  if (!quotation) return <div>Cotización no encontrada</div>;

  const handleExportPDF = () => {
    generateQuotationPDF(quotation);
    toast.success('Generando PDF de la cotización...');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button onClick={() => navigateTo('quotations')} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver a Lista
          </button>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Detalle de Cotización</h2>
          <p className="text-slate-500 font-medium">Presupuesto para {quotation.patientName}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Download className="w-5 h-5" /> Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha de Emisión</p>
            <p className="font-bold text-slate-900">{new Date(quotation.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
              {quotation.status === 'sent' ? 'Enviada' : quotation.status}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Desglose de Insumos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Descripción</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-center">Cant.</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-right">Costo U.</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quotation.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-4 text-sm font-medium text-slate-700">{item.description}</td>
                    <td className="py-4 text-sm font-bold text-slate-500 text-center">{item.quantity}</td>
                    <td className="py-4 text-sm font-bold text-slate-500 text-right">${item.unitCost.toLocaleString()}</td>
                    <td className="py-4 text-sm font-black text-slate-900 text-right">${item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-8 text-right font-black text-slate-400 uppercase tracking-widest text-xs">Total General:</td>
                  <td className="pt-8 text-right font-black text-2xl text-primary">${quotation.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {quotation.notes && (
          <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas Adicionales</p>
            <p className="text-sm text-slate-600 font-medium italic">"{quotation.notes}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewPatientFormView({ navigateTo, onSave }: { navigateTo: (view: View, patientId?: string) => void, onSave: (p: Patient) => void }) {
  const [formData, setFormData] = useState<Partial<Patient>>({
    fullName: '',
    dateOfBirth: '',
    phone: '',
    religion: '',
    educationLevel: '',
    familyHistory: '',
    pathologicalHistory: '',
    nonPathologicalHistory: '',
    gender: '',
    maritalStatus: '',
    occupation: '',
    address: '',
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
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const patientData = {
      full_name: formData.fullName || '',
      date_of_birth: formData.dateOfBirth || null,
      phone: formData.phone || '',
      religion: formData.religion || '',
      education_level: formData.educationLevel || '',
      family_history: formData.familyHistory || '',
      pathological_history: formData.pathologicalHistory || '',
      non_pathological_history: formData.nonPathologicalHistory || '',
      gender: formData.gender || '',
      marital_status: formData.maritalStatus || '',
      occupation: formData.occupation || '',
      address: formData.address || '',
      pathological_history_details: formData.pathologicalHistoryDetails,
      non_path_history_details: formData.nonPathologicalHistoryDetails,
      gyneco_obstetric_history: formData.gynecoObstetricHistory,
      current_condition: formData.currentCondition,
      physical_exploration: formData.physicalExploration,
      regions_segments: formData.regionsSegments
    };

    if (!navigator.onLine) {
      // Modo Offline
      const tempId = crypto.randomUUID();
      const newPatient: Patient = {
        id: tempId,
        fullName: patientData.full_name,
        dateOfBirth: patientData.date_of_birth || '',
        phone: patientData.phone,
        religion: patientData.religion,
        educationLevel: patientData.education_level,
        familyHistory: patientData.family_history,
        pathologicalHistory: patientData.pathological_history,
        nonPathologicalHistory: patientData.non_pathological_history,
        gender: patientData.gender,
        maritalStatus: patientData.marital_status,
        occupation: patientData.occupation,
        address: patientData.address
      };
      
      syncService.addToQueue('patients', 'INSERT', patientData);
      syncService.addToQueue('notifications', 'INSERT', [
        {
          title: 'Nuevo Paciente Registrado (Offline)',
          body: `Se ha dado de alta a ${newPatient.fullName}.`,
          voice_text: `Atención Administrador: Se ha registrado un nuevo paciente en el sistema: ${newPatient.fullName}.`,
          target_role: 'Administrador'
        },
        {
          title: 'Nuevo Paciente Registrado (Offline)',
          body: `Se ha dado de alta a ${newPatient.fullName}.`,
          voice_text: `Atención Doctor: Se ha registrado un nuevo paciente: ${newPatient.fullName}.`,
          target_role: 'Doctor'
        }
      ]);
      setCreatedPatientId(tempId);
      onSave(newPatient);
      setIsSubmitting(false);
      setIsSuccess(true);
      return;
    }

    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      console.error('Error guardando paciente:', error);
      toast.error('Hubo un error al guardar el paciente. Por favor, intenta de nuevo.');
    } else if (data) {
      const newPatient: Patient = {
        id: data.id,
        fullName: data.full_name,
        dateOfBirth: data.date_of_birth,
        phone: data.phone,
        religion: data.religion,
        educationLevel: data.education_level,
        familyHistory: data.family_history,
        pathologicalHistory: data.pathological_history,
        nonPathologicalHistory: data.non_pathological_history,
        gender: data.gender,
        maritalStatus: data.marital_status,
        occupation: data.occupation,
        address: data.address,
        pathologicalHistoryDetails: data.pathological_history_details,
        nonPathologicalHistoryDetails: data.non_path_history_details,
        gynecoObstetricHistory: data.gyneco_obstetric_history,
        currentCondition: data.current_condition,
        physicalExploration: data.physical_exploration,
        regionsSegments: data.regions_segments
      };
      onSave(newPatient);
      
      // Notificar al Administrador y al Doctor vía Supabase
      await supabase.from('notifications').insert([
        {
          title: 'Nuevo Paciente Registrado',
          body: `Se ha dado de alta a ${newPatient.fullName}.`,
          voice_text: `Atención Administrador: Se ha registrado un nuevo paciente en el sistema: ${newPatient.fullName}.`,
          target_role: 'Administrador'
        },
        {
          title: 'Nuevo Paciente Registrado',
          body: `Se ha dado de alta a ${newPatient.fullName}.`,
          voice_text: `Atención Doctor: Se ha registrado un nuevo paciente: ${newPatient.fullName}.`,
          target_role: 'Doctor'
        }
      ]);

      setCreatedPatientId(newPatient.id);
      setIsSuccess(true);
    }
  };
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Paciente Registrado!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          El nuevo paciente ha sido dado de alta exitosamente en el sistema.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <button 
            onClick={() => navigateTo('new-assessment', createdPatientId || undefined)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Añadir Valoración de Herida
          </button>
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <Clock className="w-4 h-4 animate-spin-slow" />
            Abriendo expediente...
          </div>
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
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Alta de Nuevo Paciente</h2>
        <p className="text-slate-500 font-medium">Paso {step} de 4: {step === 1 ? 'Ficha de Identificación' : step === 2 ? 'Antecedentes' : step === 3 ? 'Exploración Física' : 'Padecimiento Actual'}</p>
        
        <div className="flex gap-2 mt-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <form className="space-y-10" onSubmit={handleSubmit}>
        
        {step === 1 && (
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
              Ficha de Identificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre Completo *</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fecha de Nacimiento *</label>
                <input required type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Teléfono *</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sexo</label>
                <div className="relative">
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
                    <option value="">Seleccionar...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Estado Civil</label>
                <div className="relative">
                  <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
                    <option value="">Seleccionar...</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Unión Libre">Unión Libre</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Religión</label>
                <input type="text" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Escolaridad</label>
                <input type="text" value={formData.educationLevel} onChange={e => setFormData({...formData, educationLevel: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ocupación</label>
                <input type="text" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Dirección</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-4 h-4" />
              </div>
              Antecedentes
            </h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Heredo Familiares</label>
                <textarea rows={3} value={formData.familyHistory} onChange={e => setFormData({...formData, familyHistory: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Personales Patológicos</label>
                
                <div className="space-y-6">
                  {/* Endocrino */}
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Endocrino</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {['diabetes', 'hipertiroidismo', 'hipotiroidismo'].map(key => (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-primary transition-all">
                          <input 
                            type="checkbox" 
                            checked={(formData.pathologicalHistoryDetails?.endocrino as any)?.[key]} 
                            onChange={e => setFormData({
                              ...formData, 
                              pathologicalHistoryDetails: {
                                ...formData.pathologicalHistoryDetails!,
                                endocrino: {
                                  ...formData.pathologicalHistoryDetails!.endocrino!,
                                  [key]: e.target.checked
                                }
                              }
                            })}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-slate-700 capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Tiempo de evolución" 
                        value={formData.pathologicalHistoryDetails?.endocrino?.tiempo}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            endocrino: { ...formData.pathologicalHistoryDetails!.endocrino!, tiempo: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                      <input 
                        type="text" 
                        placeholder="Tratamiento" 
                        value={formData.pathologicalHistoryDetails?.endocrino?.tratamiento}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            endocrino: { ...formData.pathologicalHistoryDetails!.endocrino!, tratamiento: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Cardiovascular */}
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Cardiovascular</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {['hipertension', 'palpitaciones', 'fiebreReumatica', 'varices'].map(key => (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-primary transition-all">
                          <input 
                            type="checkbox" 
                            checked={(formData.pathologicalHistoryDetails?.cardiovascular as any)?.[key]} 
                            onChange={e => setFormData({
                              ...formData, 
                              pathologicalHistoryDetails: {
                                ...formData.pathologicalHistoryDetails!,
                                cardiovascular: {
                                  ...formData.pathologicalHistoryDetails!.cardiovascular!,
                                  [key]: e.target.checked
                                }
                              }
                            })}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-slate-700 capitalize">{key === 'hipertension' ? 'HTA' : key === 'fiebreReumatica' ? 'F. Reumática' : key}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Tiempo de evolución" 
                        value={formData.pathologicalHistoryDetails?.cardiovascular?.tiempo}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            cardiovascular: { ...formData.pathologicalHistoryDetails!.cardiovascular!, tiempo: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                      <input 
                        type="text" 
                        placeholder="Tratamiento" 
                        value={formData.pathologicalHistoryDetails?.cardiovascular?.tratamiento}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            cardiovascular: { ...formData.pathologicalHistoryDetails!.cardiovascular!, tratamiento: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Respiratorio */}
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Respiratorio</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {['asma', 'bronquitis', 'neumonia', 'tuberculosis'].map(key => (
                        <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-primary transition-all">
                          <input 
                            type="checkbox" 
                            checked={(formData.pathologicalHistoryDetails?.respiratorio as any)?.[key]} 
                            onChange={e => setFormData({
                              ...formData, 
                              pathologicalHistoryDetails: {
                                ...formData.pathologicalHistoryDetails!,
                                respiratorio: {
                                  ...formData.pathologicalHistoryDetails!.respiratorio!,
                                  [key]: e.target.checked
                                }
                              }
                            })}
                            className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-slate-700 capitalize">{key}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="Tiempo de evolución" 
                        value={formData.pathologicalHistoryDetails?.respiratorio?.tiempo}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            respiratorio: { ...formData.pathologicalHistoryDetails!.respiratorio!, tiempo: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                      <input 
                        type="text" 
                        placeholder="Tratamiento" 
                        value={formData.pathologicalHistoryDetails?.respiratorio?.tratamiento}
                        onChange={e => setFormData({
                          ...formData,
                          pathologicalHistoryDetails: {
                            ...formData.pathologicalHistoryDetails!,
                            respiratorio: { ...formData.pathologicalHistoryDetails!.respiratorio!, tratamiento: e.target.value }
                          }
                        })}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Alergias</label>
                      <input type="text" value={formData.pathologicalHistoryDetails?.alergias} onChange={e => setFormData({...formData, pathologicalHistoryDetails: {...formData.pathologicalHistoryDetails!, alergias: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fracturas</label>
                      <input type="text" value={formData.pathologicalHistoryDetails?.fracturas} onChange={e => setFormData({...formData, pathologicalHistoryDetails: {...formData.pathologicalHistoryDetails!, fracturas: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">No Patológicos</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/30 cursor-pointer hover:bg-slate-50 transition-all">
                    <input 
                      type="checkbox" 
                      checked={formData.nonPathologicalHistoryDetails?.sports} 
                      onChange={e => setFormData({
                        ...formData, 
                        nonPathologicalHistoryDetails: {
                          ...formData.nonPathologicalHistoryDetails!,
                          sports: e.target.checked
                        }
                      })}
                      className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-bold text-slate-700">¿Realiza algún deporte?</span>
                  </label>
                  
                  {formData.nonPathologicalHistoryDetails?.sports && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Frecuencia de Deporte</label>
                      <input type="text" value={formData.nonPathologicalHistoryDetails?.sportsFrequency} onChange={e => setFormData({...formData, nonPathologicalHistoryDetails: {...formData.nonPathologicalHistoryDetails!, sportsFrequency: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Frecuencia de Baño</label>
                    <input type="text" value={formData.nonPathologicalHistoryDetails?.bathFrequency} onChange={e => setFormData({...formData, nonPathologicalHistoryDetails: {...formData.nonPathologicalHistoryDetails!, bathFrequency: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Frecuencia de Lavado Dental</label>
                    <input type="text" value={formData.nonPathologicalHistoryDetails?.dentalFrequency} onChange={e => setFormData({...formData, nonPathologicalHistoryDetails: {...formData.nonPathologicalHistoryDetails!, dentalFrequency: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                  </div>
                </div>
                <textarea rows={2} placeholder="Otros antecedentes no patológicos..." value={formData.nonPathologicalHistory} onChange={e => setFormData({...formData, nonPathologicalHistory: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner mt-6"></textarea>
              </div>

              {formData.gender === 'Femenino' && (
                <div className="border-t border-slate-100 pt-8">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gineco-Obstétricos</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Menarca</label>
                      <input type="text" value={formData.gynecoObstetricHistory?.menarche} onChange={e => setFormData({...formData, gynecoObstetricHistory: {...formData.gynecoObstetricHistory!, menarche: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">FUM</label>
                      <input type="date" value={formData.gynecoObstetricHistory?.lastMenstrualPeriod} onChange={e => setFormData({...formData, gynecoObstetricHistory: {...formData.gynecoObstetricHistory!, lastMenstrualPeriod: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Gestas</label>
                      <input type="text" value={formData.gynecoObstetricHistory?.embarazos} onChange={e => setFormData({...formData, gynecoObstetricHistory: {...formData.gynecoObstetricHistory!, embarazos: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Partos</label>
                      <input type="text" value={formData.gynecoObstetricHistory?.partos} onChange={e => setFormData({...formData, gynecoObstetricHistory: {...formData.gynecoObstetricHistory!, partos: e.target.value}})} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="w-4 h-4" />
              </div>
              Exploración Física
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tensión Arterial</label>
                <input type="text" placeholder="120/80" value={formData.physicalExploration?.ta} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, ta: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Frec. Cardiaca</label>
                <input type="text" placeholder="70 lpm" value={formData.physicalExploration?.fc} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, fc: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Frec. Resp.</label>
                <input type="text" placeholder="16 rpm" value={formData.physicalExploration?.fr} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, fr: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Temperatura</label>
                <input type="text" placeholder="36.5 °C" value={formData.physicalExploration?.adicionales} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, adicionales: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peso (kg)</label>
                <input type="text" value={formData.physicalExploration?.peso} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, peso: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Talla (m)</label>
                <input type="text" value={formData.physicalExploration?.talla} onChange={e => setFormData({...formData, physicalExploration: {...formData.physicalExploration!, talla: e.target.value}})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">IMC</label>
                <input type="text" readOnly value={formData.physicalExploration?.imc} className="w-full border border-slate-200 rounded-2xl p-4 font-medium bg-slate-100 outline-none" />
              </div>
            </div>
            <div className="mt-8 space-y-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Regiones y Segmentos</label>
              {Object.keys(formData.regionsSegments || {}).map(key => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <textarea 
                    rows={2} 
                    value={(formData.regionsSegments as any)?.[key]} 
                    onChange={e => setFormData({
                      ...formData, 
                      regionsSegments: {
                        ...formData.regionsSegments!,
                        [key]: e.target.value
                      }
                    })} 
                    className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"
                  ></textarea>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-4 h-4" />
              </div>
              Padecimiento Actual
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Descripción del Padecimiento</label>
                <textarea rows={8} value={formData.currentCondition} onChange={e => setFormData({...formData, currentCondition: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
              </div>
            </div>
          </section>
        )}

        <div className="flex justify-between gap-4">
          {step > 1 ? (
            <button 
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
            >
              Anterior
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-primary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all"
            >
              Siguiente
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Finalizar Registro'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function CertificatesListView({ navigateTo, certificates, currentRole }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string) => void, certificates: MedicalCertificate[], currentRole: Role }) {
  const [search, setSearch] = useState('');

  const filteredCertificates = certificates.filter(c => 
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Certificados Médicos</h2>
          <p className="text-slate-500 font-medium">Gestión de certificados emitidos por el personal médico.</p>
        </div>
        {(currentRole === 'Administrador' || currentRole === 'Doctor') && (
          <button 
            onClick={() => navigateTo('new-certificate')}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Certificado
          </button>
        )}
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <FileCheck className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente o médico..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map(cert => (
          <div 
            key={cert.id} 
            onClick={() => navigateTo('certificate-detail', undefined, undefined, undefined, cert.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{cert.patientName}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cert.date}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <UserCircle className="w-4 h-4" />
                <span className="truncate">Dr. {cert.doctorName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 line-clamp-2 italic">
                "{cert.conclusions}"
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewCertificateView({ navigateTo, patients, wounds, onSave }: { navigateTo: (view: View) => void, patients: Patient[], wounds: Wound[], onSave: (c: MedicalCertificate) => void }) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = React.useRef<SignatureCanvas>(null);

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
      const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      
      const newCertificate: MedicalCertificate = {
        id: `cert-${Date.now()}`,
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

      try {
        await supabase.from('medical_certificates').insert([{
          id: newCertificate.id,
          patient_id: newCertificate.patientId,
          patient_name: newCertificate.patientName,
          patient_age: newCertificate.patientAge,
          date: newCertificate.date,
          doctor_name: newCertificate.doctorName,
          doctor_credentials: newCertificate.doctorCredentials,
          doctor_license: newCertificate.doctorLicense,
          physical_state: newCertificate.physicalState,
          wound_details: newCertificate.woundDetails,
          treatment: newCertificate.treatment,
          visual_status: newCertificate.visualStatus,
          auditory_status: newCertificate.auditoryStatus,
          locomotor_status: newCertificate.locomotorStatus,
          neurological_status: newCertificate.neurologicalStatus,
          conclusions: newCertificate.conclusions,
          signature: newCertificate.signature,
          created_at: newCertificate.createdAt
        }]);
      } catch (e) {
        console.warn('Supabase insert failed, continuing with local state', e);
      }

      onSave(newCertificate);
      toast.success('Certificado generado correctamente');
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
                value={formData.physicalState}
                onChange={e => setFormData({...formData, physicalState: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Detalles de la Herida</label>
              <textarea 
                rows={2}
                value={formData.woundDetails}
                onChange={e => setFormData({...formData, woundDetails: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tratamiento Actual</label>
              <textarea 
                rows={3}
                value={formData.treatment}
                onChange={e => setFormData({...formData, treatment: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Campo Visual</label>
                <input type="text" value={formData.visualStatus} onChange={e => setFormData({...formData, visualStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Agudeza Auditiva</label>
                <input type="text" value={formData.auditoryStatus} onChange={e => setFormData({...formData, auditoryStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Aparato Locomotor</label>
                <input type="text" value={formData.locomotorStatus} onChange={e => setFormData({...formData, locomotorStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Examen Neurológico</label>
                <input type="text" value={formData.neurologicalStatus} onChange={e => setFormData({...formData, neurologicalStatus: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Conclusiones</label>
              <textarea 
                rows={4}
                value={formData.conclusions}
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
          className="w-full bg-secondary text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all scale-100 active:scale-95 flex items-center justify-center gap-3"
        >
          {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileCheck className="w-6 h-6" />}
          {isSubmitting ? 'Generando...' : 'Generar Certificado Médico'}
        </button>
      </form>
    </div>
  );
}

function CertificateDetailView({ certificateId, navigateTo, certificates }: { certificateId: string, navigateTo: (view: View) => void, certificates: MedicalCertificate[] }) {
  const certificate = certificates.find(c => c.id === certificateId);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(60, 107, 148);
    doc.text('VIMEDICAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('CERTIFICADO MÉDICO', 105, 30, { align: 'center' });
    
    doc.setDrawColor(60, 107, 148);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    
    const text = `El Doctor ${certificate.doctorName} legalmente autorizado por la Dirección General de Profesiones para ejercer la profesión de Médico Cirujano, Maestro en heridas por la Universidad Autónoma de México del Estado de Hidalgo y Universidad Panamericana, con cédula profesional ${certificate.doctorLicense}.`;
    
    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 50);
    
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICA', 105, 75, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    
    const bodyText = `Que habiendo practicado reconocimiento médico el día ${certificate.date}, a ${certificate.patientName}, de ${certificate.patientAge} años de edad, lo encontré:`;
    doc.text(bodyText, 20, 85);
    
    doc.text(`${certificate.physicalState}`, 20, 95);
    doc.text(`${certificate.woundDetails}`, 20, 105);
    
    const treatmentText = `Con tratamiento de: ${certificate.treatment}`;
    const splitTreatment = doc.splitTextToSize(treatmentText, 170);
    doc.text(splitTreatment, 20, 115);
    
    doc.text(`Campo visual: ${certificate.visualStatus}`, 20, 135);
    doc.text(`Agudeza auditiva: ${certificate.auditoryStatus}`, 20, 145);
    doc.text(`Aparato locomotor: ${certificate.locomotorStatus}`, 20, 155);
    doc.text(`Examen neurológico: ${certificate.neurologicalStatus}`, 20, 165);
    
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSIONES:', 20, 185);
    doc.setFont('helvetica', 'normal');
    const splitConclusions = doc.splitTextToSize(certificate.conclusions, 170);
    doc.text(splitConclusions, 20, 195);
    
    if (certificate.signature) {
      doc.addImage(certificate.signature, 'PNG', 75, 220, 60, 30);
    }
    
    doc.text('__________________________', 105, 255, { align: 'center' });
    doc.text(`Dr. ${certificate.doctorName}`, 105, 262, { align: 'center' });
    doc.text(`Cédula: ${certificate.doctorLicense}`, 105, 268, { align: 'center' });
    
    doc.save(`Certificado_${certificate.patientName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF exportado correctamente');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('certificates')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Detalle del Certificado</h2>
            <p className="text-slate-500 font-medium">Visualiza y exporta el certificado médico.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Imprimir
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-2xl shadow-slate-200/50 max-w-[800px] mx-auto print:shadow-none print:border-none print:p-0 print:rounded-none">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-16 h-16 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#3C6B94]">VIMEDICAL</h1>
        </div>

        <div className="space-y-8 text-slate-800 leading-relaxed text-justify">
          <p className="text-sm">
            El Doctor <span className="font-bold">{certificate.doctorName}</span> legalmente autorizado por la Dirección General de Profesiones para ejercer la profesión de Médico Cirujano, Maestro en heridas por la Universidad Autónoma de México del Estado de Hidalgo y Universidad Panamericana, con cédula profesional {certificate.doctorLicense}.
          </p>

          <h2 className="text-center text-xl font-black tracking-widest uppercase mt-12 mb-8">CERTIFICA</h2>

          <p>
            Que habiendo practicado reconocimiento médico el día <span className="font-bold">{certificate.date}</span>, a <span className="font-bold">{certificate.patientName}</span>, de <span className="font-bold">{certificate.patientAge}</span> años de edad, lo encontré:
          </p>

          <p>{certificate.physicalState}</p>
          <p>{certificate.woundDetails}</p>
          
          <p>
            Con tratamiento de: <span className="italic">{certificate.treatment}</span>
          </p>

          <div className="grid grid-cols-1 gap-2 text-sm mt-8">
            <p><span className="font-bold">Campo visual:</span> {certificate.visualStatus}</p>
            <p><span className="font-bold">Agudeza auditiva:</span> {certificate.auditoryStatus}</p>
            <p><span className="font-bold">Aparato locomotor:</span> {certificate.locomotorStatus}</p>
            <p><span className="font-bold">Examen neurológico:</span> {certificate.neurologicalStatus}</p>
          </div>

          <div className="mt-12">
            <h3 className="font-black text-lg mb-4">CONCLUSIONES:</h3>
            <p className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
              {certificate.conclusions}
            </p>
          </div>

          <div className="mt-24 flex flex-col items-center">
            {certificate.signature && (
              <img src={certificate.signature} alt="Firma" className="h-24 object-contain mb-4" />
            )}
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900">Dr. {certificate.doctorName}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cédula: {certificate.doctorLicense}</p>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <div>
            <p>Agua potable 113 Col. Pri Chacón</p>
            <p>Mineral de la Reforma, Hgo.</p>
          </div>
          <div className="text-right">
            <p>admon.vipach@gmail.com</p>
            <p>771.285.40-46</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NurseDashboard({ navigateTo, patients, wounds, treatments, profile }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatments: TreatmentLog[], profile: UserProfile | null }) {
  const myPatients = patients.filter(p => p.registeredBy === 'n1' || !p.registeredBy); // Mocking 'n1' as current nurse
  const myTreatments = treatments.filter(t => t.nurseId === 'n1');
  const approvedWounds = wounds.filter(w => w.status === 'approved');

  // Metrics calculations
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const dailyEarnings = myTreatments
    .filter(t => t.evaluationDate.startsWith(today))
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const weeklyEarnings = myTreatments
    .filter(t => t.evaluationDate >= oneWeekAgo)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const monthlyEarnings = myTreatments
    .filter(t => t.evaluationDate >= oneMonthAgo)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const chartData = [
    { name: 'Lun', earnings: 400 },
    { name: 'Mar', earnings: 300 },
    { name: 'Mie', earnings: 600 },
    { name: 'Jue', earnings: 800 },
    { name: 'Vie', earnings: 500 },
    { name: 'Sab', earnings: 900 },
    { name: 'Dom', earnings: dailyEarnings || 200 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Panel de Enfermería</h2>
          <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">{profile?.fullName || 'Enf. Operativo'}</h3>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigateTo('new-patient')}
            className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 scale-100 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mis Pacientes</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">{myPatients.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos Hoy</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">${dailyEarnings}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos Mes</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">${monthlyEarnings}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pendientes</p>
          </div>
          <h3 className="text-4xl font-black text-amber-500">{approvedWounds.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Desempeño Semanal</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                +12% vs semana pasada
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '1rem', 
                      color: '#fff',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3C6B94" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#3C6B94', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#CBB882', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Lista de Trabajo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Paciente</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Herida</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Progreso</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedWounds.map(wound => {
                    const patient = patients.find(p => p.id === wound.patientId);
                    return (
                      <tr key={wound.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                              {patient?.fullName[0]}
                            </div>
                            <span className="font-bold text-slate-900">{patient?.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-600 font-medium">{wound.location}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${(wound.visitCount / wound.targetVisits) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-slate-400">{wound.visitCount}/{wound.targetVisits}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => navigateTo('new-treatment', wound.patientId, wound.id)}
                            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
                          >
                            Registrar Visita
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/30">
            <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-secondary">Resumen de Ingresos</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Esta Semana</p>
                  <p className="text-2xl font-black">${weeklyEarnings}</p>
                </div>
                <div className="text-emerald-400 text-xs font-bold">+8%</div>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[65%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Visitas</p>
                  <p className="text-lg font-black">{myTreatments.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Promedio</p>
                  <p className="text-lg font-black">${Math.round(monthlyEarnings / (myTreatments.length || 1))}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Mis Pacientes</h3>
              <button onClick={() => navigateTo('patients')} className="text-primary font-bold text-xs hover:underline">Ver todos</button>
            </div>
            <div className="space-y-4">
              {myPatients.slice(0, 4).map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => navigateTo('patient-detail', patient.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {patient.fullName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{patient.fullName}</p>
                      <p className="text-[10px] font-medium text-slate-500">{patient.phone}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function RegisterNurseView({ onLogin, onBack, onRegister }: { onLogin: (role: Role) => void, onBack: () => void, onRegister: (profile: UserProfile) => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    license: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProfile: UserProfile = {
      id: `nurse-${Date.now()}`,
      role: 'Enfermero',
      fullName: formData.fullName,
      email: formData.email,
      username: formData.username,
      password: formData.password,
      license: formData.license,
      status: 'active'
    };

    onRegister(newProfile);
    toast.success('Registro exitoso. Bienvenido al equipo ViMedical.');
    onLogin('Enfermero');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-12 h-12 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Registro de Enfermería</h1>
          <p className="text-slate-500 font-medium mt-2">Únete a nuestro equipo de especialistas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nombre Completo</label>
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                placeholder="Ej. Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Cédula Profesional</label>
              <input 
                type="text" 
                required
                value={formData.license}
                onChange={(e) => setFormData({...formData, license: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                placeholder="Número de cédula"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Usuario</label>
              <input 
                type="text" 
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                placeholder="usuario123"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Contraseña</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
          >
            Completar Registro
          </button>

          <button 
            type="button"
            onClick={onBack}
            className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </form>
      </div>
    </div>
  );
}

function TreatmentProposalsListView({ navigateTo, proposals, currentRole }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string) => void, proposals: TreatmentProposal[], currentRole: Role }) {
  const [search, setSearch] = useState('');

  const filteredProposals = proposals.filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Propuestas de Tratamiento</h2>
          <p className="text-slate-500 font-medium">Gestión de planes de cuidados en casa e inversión.</p>
        </div>
        <button 
          onClick={() => navigateTo('new-treatment-proposal')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-5 h-5" />
          Nueva Propuesta
        </button>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Users className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.map(proposal => (
          <div 
            key={proposal.id} 
            onClick={() => navigateTo('treatment-proposal-detail', undefined, undefined, undefined, undefined, proposal.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center font-black">
                  {proposal.patientName[0]}
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{proposal.patientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{proposal.date}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                proposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                proposal.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {proposal.status}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Programa</span>
                <span className="font-bold text-slate-900">{proposal.program}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Curaciones</span>
                <span className="font-bold text-slate-900">{proposal.numCurations}</span>
              </div>
              <div className="flex justify-between items-center text-lg pt-4 border-t border-slate-100">
                <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Inversión</span>
                <span className="font-black text-primary">${proposal.investment}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTreatmentProposalView({ navigateTo, patients, onSave }: { navigateTo: (view: View) => void, patients: Patient[], onSave: (p: TreatmentProposal) => void }) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    program: 'VIMEDICAL CUIDADOS EN CASA',
    numCurations: 12,
    materials: 'sin materiales',
    investment: 2500,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    const newProposal: TreatmentProposal = {
      id: Date.now().toString(),
      patientId: formData.patientId,
      patientName: patient.fullName,
      date: formData.date,
      program: formData.program,
      numCurations: formData.numCurations,
      materials: formData.materials,
      investment: formData.investment,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    onSave(newProposal);
    toast.success('Propuesta guardada correctamente.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigateTo('treatment-proposals')}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nueva Propuesta</h2>
          <p className="text-slate-500 font-medium">Define el plan de tratamiento e inversión para el paciente.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Paciente</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            >
              <option value="">Seleccionar Paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Programa</label>
          <input 
            type="text" 
            required
            value={formData.program}
            onChange={(e) => setFormData({...formData, program: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            placeholder="Ej. VIMEDICAL CUIDADOS EN CASA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Número de Curaciones</label>
            <input 
              type="number" 
              required
              value={formData.numCurations}
              onChange={(e) => setFormData({...formData, numCurations: parseInt(e.target.value)})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Materiales e Insumos</label>
            <input 
              type="text" 
              required
              value={formData.materials}
              onChange={(e) => setFormData({...formData, materials: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
              placeholder="Ej. sin materiales"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Inversión ($)</label>
            <input 
              type="number" 
              required
              value={formData.investment}
              onChange={(e) => setFormData({...formData, investment: parseInt(e.target.value)})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <button 
            type="submit"
            className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all"
          >
            Guardar Propuesta
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('treatment-proposals')}
            className="px-10 py-5 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function TreatmentProposalDetailView({ proposalId, navigateTo, proposals }: { proposalId: string, navigateTo: (view: View) => void, proposals: TreatmentProposal[] }) {
  const proposal = proposals.find(p => p.id === proposalId);
  if (!proposal) return <div>Propuesta no encontrada</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(60, 107, 148);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VIMEDICAL', 20, 25);
    
    doc.setFontSize(10);
    doc.text('CENTRO ESPECIALIZADO DE ATENCIÓN A', 100, 20);
    doc.text('HERIDAS COMPLEJAS Y PIE DIABÉTICO', 100, 26);

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`PACIENTE: ${proposal.patientName}`, 20, 55);
    doc.text(`FECHA: ${proposal.date}`, 150, 55);

    doc.setFontSize(16);
    doc.text('PROPUESTA DE TRATAMIENTO', 105, 75, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Agradecemos infinitamente su confianza, puede tener la seguridad que la atención que esta recibiendo su', 20, 90);
    doc.text('familiar es de la mas alta calidad, con el uso de terapias de última tecnología y con personal certificado que', 20, 95);
    doc.text('nos permite otorgar un servicio profesional.', 20, 100);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROGRAMA: ${proposal.program}`, 20, 115);

    doc.setFont('helvetica', 'normal');
    doc.text(`Número de curaciones: ${proposal.numCurations}`, 20, 130);
    doc.text(`Materiales e insumos: ${proposal.materials}`, 20, 140);
    doc.text(`Inversión: $${proposal.investment}`, 20, 150);

    doc.setFont('helvetica', 'bold');
    doc.text('Condiciones de prestación de servicios', 20, 165);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const conditions = [
      'El pago de la propuesta presentada, podrá ser liquidado vía trasferencia electrónica, pago en efectivo o pago con tarjeta de crédito o débito.',
      'La inversión deberá realizarse al iniciar el plan de tratamiento en su totalidad.',
      'Los horarios de visita para curaciones y procedimientos será establecido previo al inicio del plan de tratamiento en conjunto con familiar responsable y/o paciente.',
      'En todas las visitas se realizará toma de evidencia fotográfica, con la finalidad de observar el avance clínico.',
      'Tras finalizar la visita no. 15 se realizará el reporte final de la intervención y se podrá establecer una nueva sugerencia de manejo.',
      'En las intervenciones por parte de nuestro personal, el médico tratante podrá enlazarse a través de videoconsulta.',
      'Cualquier duda respecto al manejo y/o evolución de la lesión se solicita se realice con el médico tratante y/o el especialista a cargo.'
    ];

    conditions.forEach((condition, index) => {
      doc.text(`- ${condition}`, 20, 175 + (index * 6), { maxWidth: 170 });
    });

    // Footer
    doc.setFontSize(10);
    doc.text('Responsable Médico MD.', 140, 250);
    doc.text('Victor Ismael Medécigo Escudero', 140, 255);
    doc.text('3490622-7218923', 140, 260);

    doc.save(`Propuesta_${proposal.patientName.replace(' ', '_')}.pdf`);
    toast.success('PDF generado correctamente.');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo('treatment-proposals')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900">Detalle de Propuesta</h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Propuesta #{proposal.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">VIMEDICAL</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Centro Especializado de Atención a Heridas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fecha de Emisión</p>
            <p className="font-black text-slate-900">{proposal.date}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">PROPUESTA DE TRATAMIENTO</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">
              Agradecemos infinitamente su confianza, puede tener la seguridad que la atención que esta recibiendo su familiar es de la mas alta calidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Paciente</p>
                <p className="text-2xl font-black text-slate-900">{proposal.patientName}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Programa</p>
                <p className="text-xl font-black text-primary">{proposal.program}</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Número de curaciones:</span>
                <span className="font-black text-slate-900">{proposal.numCurations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Materiales e insumos:</span>
                <span className="font-black text-slate-900">{proposal.materials}</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-900 font-black uppercase tracking-widest text-xs">Inversión Total</span>
                <span className="text-3xl font-black text-primary">${proposal.investment}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Condiciones de prestación de servicios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Pago vía transferencia, efectivo o tarjeta.',
                'Inversión al iniciar el plan en su totalidad.',
                'Horarios establecidos en conjunto con familiares.',
                'Toma de evidencia fotográfica en cada visita.',
                'Reporte final tras la visita no. 15.',
                'Videoconsulta con médico tratante si es necesario.',
                'Dudas con el médico tratante o especialista.'
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col items-center">
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900">Victor Ismael Medécigo Escudero</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Responsable Médico MD. | 3490622-7218923</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiagnosticsListView({ navigateTo, diagnostics, currentRole }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, diagId?: string) => void, diagnostics: Diagnostic[], currentRole: Role }) {
  const [search, setSearch] = useState('');

  const filteredDiagnostics = diagnostics.filter(d => 
    d.patientName.toLowerCase().includes(search.toLowerCase()) ||
    d.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Diagnósticos Electrónicos</h2>
          <p className="text-slate-500 font-medium">Gestión y consulta de diagnósticos clínicos.</p>
        </div>
        <button 
          onClick={() => navigateTo('new-diagnostic')}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-3"
        >
          <PlusCircle className="w-5 h-5" />
          Nuevo Diagnóstico
        </button>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Activity className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente o diagnóstico..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiagnostics.map(diagnostic => (
          <div 
            key={diagnostic.id} 
            onClick={() => navigateTo('diagnostic-detail', undefined, undefined, undefined, undefined, undefined, diagnostic.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center font-black">
                  {diagnostic.patientName[0]}
                </div>
                <div>
                  <h3 className="font-black text-slate-900">{diagnostic.patientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{diagnostic.date}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnóstico</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-2">{diagnostic.diagnosis}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Médico</p>
                <p className="text-xs font-medium text-slate-600">{diagnostic.doctorName}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewDiagnosticView({ navigateTo, patients, onSave }: { navigateTo: (view: View) => void, patients: Patient[], onSave: (d: Diagnostic) => void }) {
  const [formData, setFormData] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    clinicalSummary: '',
    diagnosis: '',
    treatmentPlan: '',
    recommendations: '',
    doctorName: 'Victor Ismael Medecigo Escudero',
    doctorLicense: '3490622-7218923',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    const newDiagnostic: Diagnostic = {
      id: Date.now().toString(),
      patientId: formData.patientId,
      patientName: patient.fullName,
      patientAge: patient.age || 0,
      date: formData.date,
      clinicalSummary: formData.clinicalSummary,
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
      recommendations: formData.recommendations,
      doctorName: formData.doctorName,
      doctorLicense: formData.doctorLicense,
      createdAt: new Date().toISOString(),
    };

    onSave(newDiagnostic);
    toast.success('Diagnóstico guardado correctamente.');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigateTo('diagnostics')}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nuevo Diagnóstico</h2>
          <p className="text-slate-500 font-medium">Genera un diagnóstico electrónico detallado.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Paciente</label>
            <select 
              required
              value={formData.patientId}
              onChange={(e) => setFormData({...formData, patientId: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            >
              <option value="">Seleccionar Paciente</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Fecha</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Resumen Clínico</label>
          <textarea 
            required
            value={formData.clinicalSummary}
            onChange={(e) => setFormData({...formData, clinicalSummary: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[100px]"
            placeholder="Describa los hallazgos clínicos relevantes..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Diagnóstico</label>
          <textarea 
            required
            value={formData.diagnosis}
            onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[80px]"
            placeholder="Diagnóstico clínico..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Plan de Tratamiento</label>
          <textarea 
            required
            value={formData.treatmentPlan}
            onChange={(e) => setFormData({...formData, treatmentPlan: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[100px]"
            placeholder="Plan de manejo y tratamiento..."
          />
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Recomendaciones</label>
          <textarea 
            required
            value={formData.recommendations}
            onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
            className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 min-h-[80px]"
            placeholder="Recomendaciones generales para el paciente..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Médico Responsable</label>
            <input 
              type="text" 
              required
              value={formData.doctorName}
              onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cédula Profesional</label>
            <input 
              type="text" 
              required
              value={formData.doctorLicense}
              onChange={(e) => setFormData({...formData, doctorLicense: e.target.value})}
              className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            />
          </div>
        </div>

        <div className="pt-8 flex gap-4">
          <button 
            type="submit"
            className="flex-1 bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all"
          >
            Guardar Diagnóstico
          </button>
          <button 
            type="button"
            onClick={() => navigateTo('diagnostics')}
            className="px-10 py-5 border border-slate-200 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function DiagnosticDetailView({ diagnosticId, navigateTo, diagnostics }: { diagnosticId: string, navigateTo: (view: View) => void, diagnostics: Diagnostic[] }) {
  const diagnostic = diagnostics.find(d => d.id === diagnosticId);
  if (!diagnostic) return <div>Diagnóstico no encontrado</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(60, 107, 148);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VIMEDICAL', 20, 25);
    
    doc.setFontSize(10);
    doc.text('CENTRO ESPECIALIZADO DE ATENCIÓN A', 100, 20);
    doc.text('HERIDAS COMPLEJAS Y PIE DIABÉTICO', 100, 26);

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`PACIENTE: ${diagnostic.patientName}`, 20, 55);
    doc.text(`EDAD: ${diagnostic.patientAge} años`, 120, 55);
    doc.text(`FECHA: ${diagnostic.date}`, 160, 55);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNÓSTICO ELECTRÓNICO', 105, 75, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN CLÍNICO:', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(diagnostic.clinicalSummary, 20, 95, { maxWidth: 170 });

    doc.setFont('helvetica', 'bold');
    doc.text('DIAGNÓSTICO:', 20, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(diagnostic.diagnosis, 20, 125, { maxWidth: 170 });

    doc.setFont('helvetica', 'bold');
    doc.text('PLAN DE TRATAMIENTO:', 20, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(diagnostic.treatmentPlan, 20, 155, { maxWidth: 170 });

    doc.setFont('helvetica', 'bold');
    doc.text('RECOMENDACIONES:', 20, 185);
    doc.setFont('helvetica', 'normal');
    doc.text(diagnostic.recommendations, 20, 190, { maxWidth: 170 });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(diagnostic.doctorName, 105, 250, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Cédula Profesional: ${diagnostic.doctorLicense}`, 105, 255, { align: 'center' });
    doc.text('Firma del Médico Responsable', 105, 265, { align: 'center' });

    doc.save(`Diagnostico_${diagnostic.patientName.replace(' ', '_')}.pdf`);
    toast.success('PDF generado correctamente.');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo('diagnostics')}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900">Detalle del Diagnóstico</h2>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Diagnóstico #{diagnostic.id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
              <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">VIMEDICAL</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Centro Especializado de Atención a Heridas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fecha</p>
            <p className="font-black text-slate-900">{diagnostic.date}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4 uppercase">Diagnóstico Electrónico</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Paciente</p>
              <p className="text-2xl font-black text-slate-900">{diagnostic.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Edad</p>
              <p className="text-2xl font-black text-slate-900">{diagnostic.patientAge} años</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Resumen Clínico</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed">{diagnostic.clinicalSummary}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Diagnóstico</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-900 font-black text-lg">{diagnostic.diagnosis}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Plan de Tratamiento</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed">{diagnostic.treatmentPlan}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Recomendaciones</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed">{diagnostic.recommendations}</p>
              </div>
            </section>
          </div>

          <div className="pt-20 flex flex-col items-center">
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900">{diagnostic.doctorName}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cédula Profesional: {diagnostic.doctorLicense}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Firma del Médico Responsable</p>
          </div>
        </div>
      </div>
    </div>
  );
}
