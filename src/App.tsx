import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Users, User, Activity, AlertTriangle, PlusCircle, Clock, 
  ChevronRight, Camera, CheckSquare, Square, FileText, CheckCircle, XCircle, UserCircle, Menu, X, Download,
  Settings, Volume2, Bell, Mic, Eye, EyeOff, Receipt, DollarSign, Plus, Trash2, Shield, FileCheck, CheckCircle2,
  BarChart3, PenTool, Maximize, Printer, Mail, Phone, Award, AlertCircle, ShoppingBag, UserPlus,
  Lock, LogOut, Wifi, WifiOff, RefreshCw, Edit, Trash, Stethoscope, Package, TrendingUp, TrendingDown,
  ChevronLeft, ArrowLeft, ArrowUpRight, ArrowDownRight, Filter, Save, Send, ShieldCheck, Zap, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area} from 'recharts';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storageService } from './services/storageService';
import { MOCK_PATIENTS, MOCK_WOUNDS, MOCK_TREATMENTS, MOCK_CERTIFICATES, MOCK_PROPOSALS, MOCK_DIAGNOSTICS } from './mockData';
import { supabase, safeDatabaseOp } from './lib/supabase';
import { generateFinalReport, generateQuotationPDF, generateClinicalHistoryPDF, generateDiagnosticPDF, generateCertificatePDF } from './services/pdfService';
import { requestNotificationPermission, triggerFullNotification, playNotificationSound, speakMessage } from './services/notificationService';
import { syncService } from './services/syncService';
import { Role, UserProfile, View, Product, Order, OrderItem, Patient, Wound, TreatmentLog, MedicalCertificate, TreatmentProposal, Diagnostic, ClinicalComment, Quotation, QuotationItem } from './types';
import { LoginView } from './components/LoginView';
import { RegisterNurseView } from './components/RegisterNurseView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ImageViewer } from './components/ImageViewer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CameraCapture } from './components/CameraCapture';
import { SignaturePad } from './components/SignaturePad';

// Lazy load heavy dashboard views
const AdminDashboard = React.lazy(() => import('./views/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const DoctorDashboard = React.lazy(() => import('./views/DoctorDashboard').then(m => ({ default: m.DoctorDashboard })));
const NurseDashboard = React.lazy(() => import('./views/NurseDashboard').then(m => ({ default: m.NurseDashboard })));
const NursesManagementView = React.lazy(() => import('./views/NursesManagementView').then(m => ({ default: m.NursesManagementView })));
const PatientsView = React.lazy(() => import('./views/PatientsView').then(m => ({ default: m.PatientsView })));
const PatientDetailView = React.lazy(() => import('./views/PatientDetailView').then(m => ({ default: m.PatientDetailView })));
const ClinicalHistoryListView = React.lazy(() => import('./views/ClinicalHistoryListView').then(m => ({ default: m.ClinicalHistoryListView })));
const ClinicalHistoryDetailView = React.lazy(() => import('./views/ClinicalHistoryDetailView').then(m => ({ default: m.ClinicalHistoryDetailView })));
const AssessmentFormView = React.lazy(() => import('./views/AssessmentFormView').then(m => ({ default: m.AssessmentFormView })));
const WoundDetailView = React.lazy(() => import('./views/WoundDetailView').then(m => ({ default: m.WoundDetailView })));
const TreatmentFormView = React.lazy(() => import('./views/TreatmentFormView').then(m => ({ default: m.TreatmentFormView })));
const QuotationListView = React.lazy(() => import('./views/QuotationListView').then(m => ({ default: m.QuotationListView })));
const NewQuotationView = React.lazy(() => import('./views/NewQuotationView').then(m => ({ default: m.NewQuotationView })));
const QuotationDetailView = React.lazy(() => import('./views/QuotationDetailView').then(m => ({ default: m.QuotationDetailView })));
const PrivacyNoticeView = React.lazy(() => import('./views/PrivacyNoticeView').then(m => ({ default: m.PrivacyNoticeView })));
const ConsentFormView = React.lazy(() => import('./views/ConsentFormView').then(m => ({ default: m.ConsentFormView })));
const NewPatientFormView = React.lazy(() => import('./views/NewPatientFormView').then(m => ({ default: m.NewPatientFormView })));
const CertificatesListView = React.lazy(() => import('./views/CertificatesListView').then(m => ({ default: m.CertificatesListView })));
const NewCertificateView = React.lazy(() => import('./views/NewCertificateView').then(m => ({ default: m.NewCertificateView })));
const CertificateDetailView = React.lazy(() => import('./views/CertificateDetailView').then(m => ({ default: m.CertificateDetailView })));
const TreatmentProposalsListView = React.lazy(() => import('./views/TreatmentProposalsListView').then(m => ({ default: m.TreatmentProposalsListView })));
const NewTreatmentProposalView = React.lazy(() => import('./views/NewTreatmentProposalView').then(m => ({ default: m.NewTreatmentProposalView })));
const TreatmentProposalDetailView = React.lazy(() => import('./views/TreatmentProposalDetailView').then(m => ({ default: m.TreatmentProposalDetailView })));
const DiagnosticsListView = React.lazy(() => import('./views/DiagnosticsListView').then(m => ({ default: m.DiagnosticsListView })));
const NewDiagnosticView = React.lazy(() => import('./views/NewDiagnosticView').then(m => ({ default: m.NewDiagnosticView })));
const DiagnosticDetailView = React.lazy(() => import('./views/DiagnosticDetailView').then(m => ({ default: m.DiagnosticDetailView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const EcommerceView = React.lazy(() => import('./views/EcommerceView').then(m => ({ default: m.EcommerceView })));
const AnalyticsView = React.lazy(() => import('./views/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const InventoryView = React.lazy(() => import('./views/InventoryView').then(m => ({ default: m.InventoryView })));
const OrdersView = React.lazy(() => import('./views/OrdersView').then(m => ({ default: m.OrdersView })));


// ErrorBoundary moved to /src/components/ErrorBoundary.tsx


// ImageViewer moved to /src/components/ImageViewer.tsx


// ConfirmationModal moved to /src/components/ConfirmationModal.tsx


// LoginView and RegisterNurseView are now in separate files in /src/components/


export default function App() {
  console.log('App: Component starting');
  
  // 1. Definiciones de Estado (al principio para evitar errores de referencia)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('isLoggedIn') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    try {
      return (localStorage.getItem('currentRole') as Role) || 'Enfermero';
    } catch (e) {
      return 'Enfermero';
    }
  });

  const [currentProfile, setCurrentProfileData] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('currentProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthChecking, setIsAuthChecking] = useState(() => {
    try {
      // Si ya tenemos sesión y perfil en caché, no bloqueamos la UI inicialmente para agilizar el acceso
      const hasSession = localStorage.getItem('isLoggedIn') === 'true';
      const hasProfile = localStorage.getItem('currentProfile') !== null;
      return !(hasSession && hasProfile);
    } catch (e) {
      return true;
    }
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOps, setPendingOps] = useState(0);
  const [currentView, setCurrentView] = useState<View>(() => {
    try {
      return (localStorage.getItem('currentView') as View) || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => localStorage.getItem('selectedPatientId'));
  const [selectedWoundId, setSelectedWoundId] = useState<string | null>(() => localStorage.getItem('selectedWoundId'));
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [wounds, setWounds] = useState<Wound[]>(MOCK_WOUNDS);
  const [treatmentLogs, setTreatmentLogs] = useState<TreatmentLog[]>(MOCK_TREATMENTS);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [proposals, setProposals] = useState<TreatmentProposal[]>(MOCK_PROPOSALS);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>(MOCK_DIAGNOSTICS);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(() => localStorage.getItem('selectedQuotationId'));
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(() => localStorage.getItem('selectedCertificateId'));
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(() => localStorage.getItem('selectedProposalId'));
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(() => localStorage.getItem('selectedDiagnosticId'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoadingHelp, setShowLoadingHelp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    }
  };

  function PWAInstallPrompt() {
    if (!deferredPrompt) return null;

    return (
      <div className="fixed bottom-24 left-6 right-6 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-white border-2 border-secondary rounded-[2rem] shadow-2xl p-6 z-[100] animate-in slide-in-from-bottom-10 duration-500 ring-4 ring-secondary/10">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="Logo" className="w-10 h-10 object-contain mix-blend-multiply" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-slate-900 tracking-tight">Instalar ViMedical</h4>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">Accede más rápidamente y sin conexión instalando la app en tu pantalla de inicio.</p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleInstall}
                className="flex-[2] bg-primary text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Instalar Ahora
              </button>
              <button 
                onClick={() => setDeferredPrompt(null)}
                className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Refs para evitar fugas de memoria y llamadas duplicadas
  const lastFetchUserId = useRef<string | null>(null);
  const profileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, options?: { confirmText?: string; cancelText?: string; type?: 'danger' | 'warning' | 'info' }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      ...options
    });
  };

  // 2. Ruta inicial basada en URL
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      console.log('App: Path detected:', path);
      
      if (path === '/enfermeros') {
        if (!isLoggedIn) {
          setCurrentView('register-nurse');
          localStorage.setItem('currentView', 'register-nurse');
        } else {
          // Si ya está logueado, redirigir a raíz y dashboard
          console.log('App: User logged in, redirecting from /enfermeros to dashboard');
          window.history.pushState({}, '', '/');
          setCurrentView('dashboard');
          localStorage.setItem('currentView', 'dashboard');
        }
      } else if (path === '/' || path === '') {
        // En la raíz
        if (isLoggedIn) {
          // Si está logueado, asegurar que estamos en dashboard si no hay otra vista específica
          const savedView = localStorage.getItem('currentView') as View;
          if (savedView === 'register-nurse' || !savedView) {
            setCurrentView('dashboard');
            localStorage.setItem('currentView', 'dashboard');
          }
        } else {
          // No logueado, si venía de registro pero está en raíz, resetear a dashboard (que mostrará login)
          if (localStorage.getItem('currentView') === 'register-nurse') {
            localStorage.removeItem('currentView');
            setCurrentView('dashboard');
          }
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [isLoggedIn]); // Añadimos isLoggedIn como dependencia para re-evaluar la ruta al cambiar estado de sesión

  // 3. Efectos de Autenticación
  useEffect(() => {
    if (isAuthChecking) {
      const timer = setTimeout(() => setShowLoadingHelp(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setShowLoadingHelp(false);
    }
  }, [isAuthChecking]);

  useEffect(() => {
    // Safety timeout for initial auth check (reducido a 3s para mayor agilidad)
    const authTimeout = setTimeout(() => {
      if (isAuthChecking) {
        console.warn('App: Initial auth check timed out, forcing ready state');
        setIsAuthChecking(false);
      }
    }, 3000);

    return () => clearTimeout(authTimeout);
  }, [isAuthChecking]);

  useEffect(() => {
    // Escuchar cambios en la autenticación de Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App: Auth event triggered:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || (event as any) === 'USER_DELETED') {
        console.log('App: User signed out or deleted, checking local state');
        
        // Evitar desloguear al usuario en un refresco de página si hay una sesión local activa.
        // Esto previene que eventos iniciales de SIGNED_OUT cuando Supabase se está inicializando
        // o si la app está sin conexión cierren la sesión del usuario de forma de forma disruptiva.
        if (localStorage.getItem('isLoggedIn') === 'true') {
          console.log('App: Ignorando evento de salida inicial/transitivo en refresco para mantener sesión local activa.');
          setIsAuthChecking(false);
          return;
        }

        console.log('App: Clearing state and logging out...');
        setIsLoggedIn(false);
        setCurrentProfileData(null);
        setIsAuthChecking(false);
        lastFetchUserId.current = null;
        if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('currentProfile');
        return;
      }

      if (session?.user) {
        // Evitar múltiples llamadas al mismo tiempo para el mismo usuario
        if (lastFetchUserId.current === session.user.id) {
          console.log('App: Profile already loading or loaded for user, skipping duplicate fetch');
          return;
        }

        console.log('App: User session found, fetching profile for', session.user.id);
        lastFetchUserId.current = session.user.id;
        
        // Limpiar timeout anterior si existe
        if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);

        // Solo mostramos el cargando si no tenemos datos en caché
        const cachedProfileStr = localStorage.getItem('currentProfile');
        const hasCachedProfile = cachedProfileStr !== null;
        
        if (!hasCachedProfile) {
          setIsAuthChecking(true);
        } else {
          // Si hay caché, la usamos inmediatamente pero intentamos actualizar en segundo plano
          try {
            const cachedProfile = JSON.parse(cachedProfileStr);
            setCurrentProfileData(cachedProfile);
            setCurrentRole(cachedProfile.role);
            setIsLoggedIn(true);
          } catch (e) {
            console.error('App: Error parsing cached profile', e);
          }
        }
        
        // Timeout para la búsqueda de perfil (reducido a 10s para mayor respuesta)
        let timeoutId: any;
        const createTimeout = (ms: number) => new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), ms);
        });

        console.time(`profile_fetch_${session.user.id}`);
        try {
          let result: any = null;
          
          // Intento simplificado y rápido
          try {
            const fetchTimeout = createTimeout(20000); // Aumentado a 20 segundos
            const fetchPromise = supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();

            result = await Promise.race([fetchPromise, fetchTimeout]);
            if (timeoutId) clearTimeout(timeoutId);
          } catch (err: any) {
            if (timeoutId) clearTimeout(timeoutId);
            if (err.message === 'TIMEOUT') {
              console.warn('App: Fast fetch timed out, trying ONE more time with simplified query');
              const secondTimeout = createTimeout(30000); // Segundo intento de 30 segundos
              const secondFetch = supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
              result = await Promise.race([secondFetch, secondTimeout]);
              if (timeoutId) clearTimeout(timeoutId);
            } else {
              throw err;
            }
          }
          
          console.timeEnd(`profile_fetch_${session.user.id}`);
          if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);

          // Si llegamos aquí y no hay resultado por timeout extremo, lanzamos error para el catch
          if (!result && !hasCachedProfile) {
             throw new Error('TIMEOUT');
          }
          
          const { data: profileData, error } = result || { data: null, error: null };

          if (error) {
            console.error('App: Error fetching profile:', error);
            lastFetchUserId.current = null; // Liberar para reintento
            
            if (error.message.includes('JWT') || error.message.includes('token')) {
              if (hasCachedProfile) {
                console.warn('App: Auth token error but session is cached locally. Keeping local session.');
                setIsAuthChecking(false);
                return;
              }
              console.warn('App: Auth token error, signing out...');
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.reload();
              return;
            }

            if (!hasCachedProfile) {
              setAuthError('Error al conectar con el servidor.');
              setIsAuthChecking(false);
            }
            return;
          }

          if (profileData) {
            console.log('App: Profile found:', profileData.full_name);
            let normalizedRole: Role = 'Enfermero';
            const dbRole = profileData.role?.toLowerCase();
            if (dbRole === 'administrador' || dbRole === 'admin') normalizedRole = 'Administrador';
            else if (dbRole === 'doctor' || dbRole === 'médico') normalizedRole = 'Doctor';
            
            const profile: UserProfile = {
              id: profileData.id,
              role: normalizedRole,
              fullName: profileData.full_name,
              email: profileData.email,
              phone: profileData.phone,
              license: profileData.license,
              specialty: profileData.specialty,
              photoUrl: profileData.photo_url,
              signatureUrl: profileData.signature_url,
              bio: profileData.bio,
              status: profileData.status as 'active' | 'suspended'
            };

            setCurrentRole(normalizedRole);
            setCurrentProfileData(profile);
            setIsLoggedIn(true);
            setIsAuthChecking(false);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentRole', normalizedRole);
            localStorage.setItem('currentProfile', JSON.stringify(profile));
            console.log('App: Login state updated successfully');
            setAuthError(null);
          } else {
            console.warn('App: No profile data returned for user', session.user.id, 'attempting auto-repair');
            
            // Try to create profile de forma robusta
            const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', session.user.id).maybeSingle();
            
            let opResult;
            if (existing) {
              opResult = await supabase.from('profiles').update({
                full_name: session.user.user_metadata?.full_name || 'Usuario Registrado',
                email: session.user.email,
                status: 'active'
              }).eq('user_id', session.user.id).select().maybeSingle();
            } else {
              opResult = await supabase.from('profiles').insert({
                user_id: session.user.id,
                full_name: session.user.user_metadata?.full_name || 'Usuario Registrado',
                email: session.user.email,
                role: session.user.user_metadata?.role || 'Enfermero',
                status: 'active'
              }).select().maybeSingle();
            }

            const { data: repairedProfile, error: repairErr } = opResult;

            if (!repairErr && repairedProfile) {
               console.log('App: Profile repaired successfully');
               // Recursive call or just handle here (prefer recursive-like behavior by clearing lastFetch and letting event fire again? No, handle here)
               const normalizedRole: Role = repairedProfile.role === 'Doctor' ? 'Doctor' : repairedProfile.role === 'Administrador' ? 'Administrador' : 'Enfermero';
               const profile: UserProfile = {
                 id: repairedProfile.id,
                 role: normalizedRole,
                 fullName: repairedProfile.full_name,
                 email: repairedProfile.email,
                 status: 'active'
               };
               setCurrentRole(normalizedRole);
               setCurrentProfileData(profile);
               setIsLoggedIn(true);
               setIsAuthChecking(false);
               localStorage.setItem('isLoggedIn', 'true');
               localStorage.setItem('currentRole', normalizedRole);
               localStorage.setItem('currentProfile', JSON.stringify(profile));
               return;
            }

            lastFetchUserId.current = null; // Liberar para reintento
            if (!hasCachedProfile) {
              setAuthError('No se encontró un perfil asociado a esta cuenta.');
              setIsAuthChecking(false);
            }
          }
        } catch (profileErr: any) {
          clearTimeout(timeoutId);
          console.timeEnd(`profile_fetch_${session.user.id}`);
          lastFetchUserId.current = null; // Liberar para que pueda intentar de nuevo si el evento dispara otra vez
          
          if (profileErr.message === 'TIMEOUT') {
            console.error('App: Profile fetch timeout reached for', session.user.id, 'performing emergency repair');
            
          // EMERGENCY REPAIR: Si hay timeout, creamos el perfil de forma robusta
          const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', session.user.id).maybeSingle();
          
          let opResult;
          if (existing) {
            opResult = await supabase.from('profiles').update({
              full_name: session.user.user_metadata?.full_name || 'Enfermero ViMedical',
              email: session.user.email,
              status: 'active'
            }).eq('user_id', session.user.id).select().maybeSingle();
          } else {
            opResult = await supabase.from('profiles').insert({
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || 'Enfermero ViMedical',
              email: session.user.email,
              role: 'Enfermero',
              status: 'active'
            }).select().maybeSingle();
          }
          
          const { data: emergencyProfile, error: repairErr } = opResult;

            if (!repairErr && emergencyProfile) {
              console.log('App: Emergency repair successful');
              const profile: UserProfile = {
                id: emergencyProfile.id,
                role: 'Enfermero',
                fullName: emergencyProfile.full_name,
                email: emergencyProfile.email,
                status: 'active'
              };
              setCurrentRole('Enfermero');
              setCurrentProfileData(profile);
              setIsLoggedIn(true);
              setIsAuthChecking(false);
              localStorage.setItem('isLoggedIn', 'true');
              localStorage.setItem('currentRole', 'Enfermero');
              localStorage.setItem('currentProfile', JSON.stringify(profile));
              return;
            }

            if (!hasCachedProfile) {
              setAuthError('El servidor de perfiles no responde. Por favor recarga la página o intenta más tarde.');
              setIsAuthChecking(false);
            }
          } else {
            console.error('App: Unexpected error fetching profile:', profileErr);
            if (!hasCachedProfile) {
              setAuthError('Error inesperado al verificar tu cuenta.');
              setIsAuthChecking(false);
            }
          }
        }
      } else {
        // No hay sesión activa
        setIsAuthChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
    };
  }, []);

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
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentRole', currentRole);
      if (currentProfile) {
        localStorage.setItem('currentProfile', JSON.stringify(currentProfile));
      }
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentRole');
      localStorage.removeItem('currentProfile');
    }
  }, [isLoggedIn, currentRole, currentProfile]);

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

    const treatmentsChannel = supabase
      .channel('treatments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treatment_logs' },
        () => fetchTreatmentLogs()
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const { title, body, voice_text, target_role } = payload.new;
          if (target_role === currentRole || target_role === 'Todos') {
            triggerFullNotification(title, body, voice_text);
            // Refrescar al instante el feed local
            setTimeout(() => {
              fetchNotifications();
            }, 300);
          }
        }
      )
      .subscribe();

    const quotationsChannel = supabase
      .channel('quotations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        () => fetchQuotations()
      )
      .subscribe();

    const diagnosticsChannel = supabase
      .channel('diagnostics-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'diagnostics' },
        () => fetchDiagnostics()
      )
      .subscribe();

    const certificatesChannel = supabase
      .channel('certificates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_certificates' },
        () => fetchCertificates()
      )
      .subscribe();

    const proposalsChannel = supabase
      .channel('proposals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treatment_proposals' },
        () => fetchProposals()
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
          address: p.address,
          initialWoundPhoto: p.initial_wound_photo,
          initialPhotos: p.initial_photos || (p.initial_wound_photo ? [p.initial_wound_photo] : []),
          privacyNoticeSigned: p.privacy_notice_signed,
          privacyNoticeSignature: p.privacy_notice_signature,
          privacyNoticeDate: p.privacy_notice_date,
          privacyNoticeType: p.privacy_notice_type,
          consentFormSigned: p.consent_form_signed,
          consentFormSignature: p.consent_form_signature,
          consentFormDate: p.privacy_notice_date, // This was likely a copy-paste error in previous turns, but let's keep it consistent with what's there
          consentFormType: p.consent_form_type,
          clinicalComments: p.clinical_comments || [],
          currentCondition: p.current_condition,
          physicalExploration: (() => {
            if (!p.physical_exploration) return undefined;
            if (typeof p.physical_exploration === 'object') return p.physical_exploration;
            try {
              return JSON.parse(p.physical_exploration);
            } catch (e) {
              // Si no es JSON, devolver como string en un objeto para compatibilidad
              return { adicionales: p.physical_exploration };
            }
          })(),
          createdAt: p.created_at
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
          abiRightPostTibial: w.abi_right_post_tibial,
          diagnosis: w.diagnosis,
          width: w.width,
          length: w.length,
          depth: w.depth,
          painLevel: w.pain_level,
          tissueType: w.tissue_type,
          characteristics: w.characteristics,
          prognosis: w.prognosis,
          tunneling: w.tunneling,
          sinusTract: w.sinus_tract,
          undermining: w.undermining
        }));
        const finalWounds = [...formattedWounds];
        setWounds(finalWounds);
        syncService.setCache('wounds', finalWounds);
      }
    };

    const fetchTreatmentLogs = async () => {
      const cachedLogs = syncService.getCache('treatment_logs');
      if (cachedLogs) {
        setTreatmentLogs(cachedLogs);
      }

      if (!navigator.onLine) return;

      const { data, error } = await supabase
        .from('treatment_logs')
        .select('*')
        .order('evaluation_date', { ascending: false });
      
      if (data) {
        const formattedLogs: TreatmentLog[] = data.map(t => ({
          id: t.id,
          woundId: t.wound_id,
          patientId: t.patient_id || '',
          evaluationDate: t.evaluation_date,
          date: t.evaluation_date || new Date().toISOString(),
          type: t.type || 'Curación',
          description: t.description || 'Seguimiento de herida',
          width: t.width,
          length: t.length,
          fluidLeakage: t.fluid_leakage,
          foreignMaterial: t.foreign_material,
          sloughPresence: t.slough_presence,
          peripheralTractsMeasurements: t.peripheral_tracts_measurements,
          prognosis: t.prognosis,
          photos: t.photos || [],
          prontosanSolution: (t as any).prontosan_solution,
          prontosanGel: (t as any).prontosan_gel,
          kerlix: (t as any).kerlix,
          telfa: (t as any).telfa,
          avintraAdministered: (t as any).avintra_administered,
          notes: t.notes,
          patientSignature: t.patient_signature,
          nurseId: t.nurse_id,
          nurseName: t.nurse_name || 'Personal ViMedical',
          cost: t.cost
        }));
        setTreatmentLogs(formattedLogs);
        syncService.setCache('treatment_logs', formattedLogs);
      }
    };

    // Cargar todos los datos en paralelo para mejorar el tiempo de carga inicial
    Promise.all([
      fetchPatients(),
      fetchWounds(),
      fetchTreatmentLogs(),
      fetchQuotations(),
      fetchCertificates(),
      fetchDiagnostics(),
      fetchProposals(),
      fetchNotifications()
    ]).catch(err => console.error('App: Initial data fetch error:', err));

    // Sincronización periódica automática de alta frecuencia como respaldo robusto para tiempo real.
    // Esto asegura que cualquier cambio hecho por un enfermero (pacientes, heridas, curaciones, etc.)
    // se refleje automáticamente en las pantallas de Admin y Doctores de inmediato (máximo 5s).
    const pollInterval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.log('[Realtime Sync] Sincronizando datos de pacientes, historial clínico y curaciones en segundo plano...');
        fetchPatients();
        fetchWounds();
        fetchTreatmentLogs();
        fetchQuotations();
        fetchCertificates();
        fetchDiagnostics();
        fetchProposals();
        fetchNotifications();
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(pollInterval);
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(woundsChannel);
      supabase.removeChannel(treatmentsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(quotationsChannel);
      supabase.removeChannel(diagnosticsChannel);
      supabase.removeChannel(certificatesChannel);
      supabase.removeChannel(proposalsChannel);
    };
  }, [currentRole]);

  const fetchNotifications = async () => {
    if (!navigator.onLine) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`target_role.eq.${currentRole},target_role.eq.Todos`)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (e) {
      console.error('Exception fetching notifications:', e);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    if (navigator.onLine) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    if (navigator.onLine) {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .or(`target_role.eq.${currentRole},target_role.eq.Todos`);
    }
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const fetchQuotations = async () => {
    // Cargar desde caché primero
    const cachedQuotations = syncService.getCache('quotations');
    if (cachedQuotations) {
      setQuotations(cachedQuotations);
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
      .from('quotations')
      .select('*, quotation_items(*)')
      .order('created_at', { ascending: false });
    
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
        reason: c.reason,
        diagnosis: c.diagnosis,
        recommendations: c.recommendations,
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

  const fetchProposals = async () => {
    const cachedProposals = syncService.getCache('proposals');
    if (cachedProposals) {
      setProposals(cachedProposals);
    } else {
      setProposals(MOCK_PROPOSALS);
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
      .from('treatment_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching proposals:', error);
    } else if (data) {
      const formattedProposals: TreatmentProposal[] = data.map((p: any) => ({
        id: p.id,
        patientId: p.patient_id,
        patientName: p.patient_name,
        date: p.date || p.created_at.split('T')[0],
        program: p.program,
        numCurations: p.num_curations,
        materials: p.materials,
        investment: p.investment,
        createdAt: p.created_at,
        status: p.status,
        nurseId: p.nurse_id
      }));
      setProposals(formattedProposals);
      syncService.setCache('proposals', formattedProposals);
    }
  };

  const fetchDiagnostics = async () => {
    const cachedDiagnostics = syncService.getCache('diagnostics');
    if (cachedDiagnostics) {
      setDiagnostics(cachedDiagnostics);
    } else {
      setDiagnostics(MOCK_DIAGNOSTICS);
    }

    if (!navigator.onLine) return;

    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching diagnostics:', error);
    } else if (data) {
      const formattedDiagnostics: Diagnostic[] = data.map((d: any) => ({
        id: d.id,
        patientId: d.patient_id,
        patientName: d.patient_name,
        patientAge: d.patient_age,
        date: d.date,
        clinicalSummary: d.clinical_summary,
        diagnosis: d.diagnosis,
        treatmentPlan: d.treatment_plan,
        recommendations: d.recommendations,
        doctorName: d.doctor_name,
        doctorLicense: d.doctor_license,
        signature: d.signature,
        createdAt: d.created_at
      }));
      setDiagnostics(formattedDiagnostics);
      syncService.setCache('diagnostics', formattedDiagnostics);
    }
  };

  const navigateTo = useCallback((view: View, patientId?: string, woundId?: string, quotationId?: string, certificateId?: string, proposalId?: string, diagnosticId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
      localStorage.setItem('selectedPatientId', patientId);
    }
    if (woundId) {
      setSelectedWoundId(woundId);
      localStorage.setItem('selectedWoundId', woundId);
    }
    if (quotationId) {
      setSelectedQuotationId(quotationId);
      localStorage.setItem('selectedQuotationId', quotationId);
    }
    if (certificateId) {
      setSelectedCertificateId(certificateId);
      localStorage.setItem('selectedCertificateId', certificateId);
    }
    if (proposalId) {
      setSelectedProposalId(proposalId);
      localStorage.setItem('selectedProposalId', proposalId);
    }
    if (diagnosticId) {
      setSelectedDiagnosticId(diagnosticId);
      localStorage.setItem('selectedDiagnosticId', diagnosticId);
    }
    setCurrentView(view);
    localStorage.setItem('currentView', view);
    setIsSidebarOpen(false);
  }, []);

  const handleAddWound = (newWound: Wound) => {
    const updatedWounds = [newWound, ...wounds];
    setWounds(updatedWounds);
    syncService.setCache('wounds', updatedWounds);
  };

  const handleAddTreatment = (newTreatment: TreatmentLog) => {
    const updatedLogs = [newTreatment, ...treatmentLogs];
    setTreatmentLogs(updatedLogs);
    syncService.setCache('treatment_logs', updatedLogs);
  };

  const handleAddPatient = (newPatient: Patient) => {
    const updatedPatients = [newPatient, ...patients];
    setPatients(updatedPatients);
    syncService.setCache('patients', updatedPatients);
    // Removed navigateTo to allow NewPatientFormView to show success screen
  };

  const handleSaveQuotation = async (newQuotation: Quotation) => {
    const updatedQuotations = [newQuotation, ...quotations];
    setQuotations(updatedQuotations);
    syncService.setCache('quotations', updatedQuotations);
    
    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('quotations').insert([{
          id: newQuotation.id,
          patient_id: newQuotation.patientId,
          patient_name: newQuotation.patientName,
          total_amount: newQuotation.totalAmount,
          status: newQuotation.status,
          notes: newQuotation.notes,
          created_at: newQuotation.createdAt
        }]);
        if (error) throw error;
        
        // Items
        const items = newQuotation.items.map(item => ({
          quotation_id: newQuotation.id,
          description: item.description,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total: item.total
        }));
        await supabase.from('quotation_items').insert(items);

        // Notificaciones
        const authorName = currentProfile?.fullName || 'Administrador';
        const pName = newQuotation.patientName || 'un paciente';
        const targets = 
          currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
          currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
          ['Enfermero', 'Doctor'];

        try {
          await supabase.from('notifications').insert(targets.map(targetRole => ({
            title: 'Nueva Cotización',
            body: `${authorName} ha registrado una cotización para ${pName}.`,
            voice_text: `Atención: Nueva cotización de servicios por $${newQuotation.totalAmount.toLocaleString()} registrada para ${pName} por ${authorName}.`,
            target_role: targetRole
          })));
        } catch (err) {
          console.error('Error sending quotation notifications:', err);
        }

        toast.success('Cotización guardada y sincronizada');
      } else {
        syncService.addToQueue('quotations', 'INSERT', newQuotation);
        toast.success('Cotización guardada (offline)');
      }
    } catch (err) {
      console.error('Error syncing quotation:', err);
      toast.error('Error de sincronización');
    }
    navigateTo('quotations');
  };

  const handleSaveCertificate = async (newCertificate: MedicalCertificate) => {
    const updatedCertificates = [newCertificate, ...certificates];
    setCertificates(updatedCertificates);
    syncService.setCache('certificates', updatedCertificates);
    
    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('medical_certificates').insert([{
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
        if (error) throw error;

        // Notificaciones
        const authorName = currentProfile?.fullName || 'Médico';
        const pName = newCertificate.patientName || 'un paciente';
        const targets = 
          currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
          currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
          ['Enfermero', 'Doctor'];

        try {
          await supabase.from('notifications').insert(targets.map(targetRole => ({
            title: 'Nuevo Certificado Médico',
            body: `${authorName} ha emitido un certificado para ${pName}.`,
            voice_text: `Atención: Nuevo certificado médico emitido para el paciente ${pName} por ${authorName}.`,
            target_role: targetRole
          })));
        } catch (err) {
          console.error('Error sending certificate notifications:', err);
        }

        toast.success('Certificado guardado y sincronizado');
      } else {
        syncService.addToQueue('medical_certificates', 'INSERT', newCertificate);
        toast.success('Certificado guardado (offline)');
      }
    } catch (err) {
      console.error('Error syncing certificate:', err);
      toast.error('Error de sincronización');
    }
    navigateTo('certificates');
  };

  const handleSaveProposal = async (newProposal: TreatmentProposal) => {
    const updatedProposals = [newProposal, ...proposals];
    setProposals(updatedProposals);
    syncService.setCache('proposals', updatedProposals);
    
    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('treatment_proposals').insert([{
          id: newProposal.id,
          patient_id: newProposal.patientId,
          patient_name: newProposal.patientName,
          program: newProposal.program,
          num_curations: newProposal.numCurations,
          materials: newProposal.materials,
          investment: newProposal.investment,
          status: newProposal.status,
          nurse_id: newProposal.nurseId,
          created_at: newProposal.createdAt
        }]);
        if (error) throw error;

        // Enviar notificaciones al Doctor y al Administrador
        const authorName = currentProfile?.fullName || 'Enfermero';
        const pName = newProposal.patientName || 'un paciente';
        
        try {
          await supabase.from('notifications').insert([
            {
              title: 'Nueva Propuesta de Tratamiento',
              body: `${authorName} ha registrado una nueva propuesta para ${pName}.`,
              voice_text: `Atención: Nueva propuesta de tratamiento registrada para el paciente ${pName} por ${authorName}.`,
              target_role: 'Doctor'
            },
            {
              title: 'Nueva Propuesta de Tratamiento',
              body: `${authorName} ha registrado una nueva propuesta para ${pName}.`,
              voice_text: `Atención: Nueva propuesta de tratamiento registrada para el paciente ${pName} por ${authorName}.`,
              target_role: 'Administrador'
            }
          ]);
        } catch (err) {
          console.error('Error sending proposal notifications:', err);
        }

        toast.success('Propuesta guardada y sincronizada');
      } else {
        syncService.addToQueue('treatment_proposals', 'INSERT', newProposal);
        toast.success('Propuesta guardada (offline)');
      }
    } catch (err) {
      console.error('Error syncing proposal:', err);
      toast.error('Error de sincronización');
    }
    navigateTo('treatment-proposals');
  };

  const handleSaveDiagnostic = async (newDiagnostic: Diagnostic) => {
    const updatedDiagnostics = [newDiagnostic, ...diagnostics];
    setDiagnostics(updatedDiagnostics);
    syncService.setCache('diagnostics', updatedDiagnostics);

    try {
      if (navigator.onLine) {
        const { error } = await supabase.from('diagnostics').insert([{
          id: newDiagnostic.id,
          patient_id: newDiagnostic.patientId,
          patient_name: newDiagnostic.patientName,
          patient_age: newDiagnostic.patientAge,
          date: newDiagnostic.date,
          clinical_summary: newDiagnostic.clinicalSummary,
          diagnosis: newDiagnostic.diagnosis,
          treatment_plan: newDiagnostic.treatmentPlan,
          recommendations: newDiagnostic.recommendations,
          doctor_name: newDiagnostic.doctorName,
          doctor_license: newDiagnostic.doctorLicense,
          signature: newDiagnostic.signature,
          created_at: newDiagnostic.createdAt
        }]);
        if (error) throw error;

        // Notificaciones
        const authorName = currentProfile?.fullName || 'Doctor';
        const pName = newDiagnostic.patientName || 'un paciente';
        const targets = 
          currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
          currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
          ['Enfermero', 'Doctor'];

        try {
          await supabase.from('notifications').insert(targets.map(targetRole => ({
            title: 'Nuevo Diagnóstico Clínico',
            body: `${authorName} ha registrado un diagnóstico para ${pName}.`,
            voice_text: `Atención: Nuevo diagnóstico clínico registrado para ${pName} por El Doctor ${authorName}.`,
            target_role: targetRole
          })));
        } catch (err) {
          console.error('Error sending diagnostic notifications:', err);
        }

        toast.success('Diagnóstico guardado y sincronizado');
      } else {
        syncService.addToQueue('diagnostics', 'INSERT', newDiagnostic);
        toast.success('Diagnóstico guardado (offline)');
      }
    } catch (err) {
      console.error('Error syncing diagnostic:', err);
      toast.error('Error de sincronización');
    }

    navigateTo('diagnostics');
  };

  const handleDeleteQuotation = (id: string) => {
    showConfirm(
      '¿Eliminar Cotización?',
      '¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.',
      async () => {
        setQuotations(prev => prev.filter(q => q.id !== id));
        syncService.setCache('quotations', quotations.filter(q => q.id !== id));
        if (navigator.onLine) await supabase.from('quotations').delete().eq('id', id);
        toast.success('Cotización eliminada');
      },
      { type: 'danger', confirmText: 'Eliminar' }
    );
  };

  const handleDeleteCertificate = (id: string) => {
    showConfirm(
      '¿Eliminar Certificado?',
      '¿Estás seguro de que deseas eliminar este certificado? Esta acción no se puede deshacer.',
      async () => {
        setCertificates(prev => prev.filter(c => c.id !== id));
        syncService.setCache('certificates', certificates.filter(c => c.id !== id));
        if (navigator.onLine) await supabase.from('medical_certificates').delete().eq('id', id);
        toast.success('Certificado eliminado');
      },
      { type: 'danger', confirmText: 'Eliminar' }
    );
  };

  const handleDeleteProposal = (id: string) => {
    showConfirm(
      '¿Eliminar Propuesta?',
      '¿Estás seguro de que deseas eliminar esta propuesta? Esta acción no se puede deshacer.',
      async () => {
        setProposals(prev => prev.filter(p => p.id !== id));
        syncService.setCache('proposals', proposals.filter(p => p.id !== id));
        if (navigator.onLine) await supabase.from('treatment_proposals').delete().eq('id', id);
        toast.success('Propuesta eliminada');
      },
      { type: 'danger', confirmText: 'Eliminar' }
    );
  };

  const handleDeleteDiagnostic = (id: string) => {
    showConfirm(
      '¿Eliminar Diagnóstico?',
      '¿Estás seguro de que deseas eliminar este diagnóstico? Esta acción no se puede deshacer.',
      async () => {
        setDiagnostics(prev => prev.filter(d => d.id !== id));
        syncService.setCache('diagnostics', diagnostics.filter(d => d.id !== id));
        if (navigator.onLine) await supabase.from('diagnostics').delete().eq('id', id);
        toast.success('Diagnóstico eliminado');
      },
      { type: 'danger', confirmText: 'Eliminar' }
    );
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
    const updatedPatients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    setPatients(updatedPatients);
    syncService.setCache('patients', updatedPatients);
    
    const supabaseData = {
      full_name: updatedPatient.fullName,
      date_of_birth: updatedPatient.dateOfBirth,
      phone: updatedPatient.phone,
      religion: updatedPatient.religion,
      education_level: updatedPatient.educationLevel,
      family_history: updatedPatient.familyHistory,
      pathological_history: updatedPatient.pathologicalHistory,
      non_pathological_history: updatedPatient.nonPathologicalHistory,
      gender: updatedPatient.gender,
      marital_status: updatedPatient.maritalStatus,
      occupation: updatedPatient.occupation,
      address: updatedPatient.address,
      initial_wound_photo: updatedPatient.initialWoundPhoto,
      initial_photos: updatedPatient.initialPhotos || (updatedPatient.initialWoundPhoto ? [updatedPatient.initialWoundPhoto] : []),
      clinical_comments: updatedPatient.clinicalComments,
      privacy_notice_signed: updatedPatient.privacyNoticeSigned,
      privacy_notice_signature: updatedPatient.privacyNoticeSignature,
      privacy_notice_date: updatedPatient.privacyNoticeDate,
      privacy_notice_type: updatedPatient.privacyNoticeType,
      consent_form_signed: updatedPatient.consentFormSigned,
      consent_form_signature: updatedPatient.consentFormSignature,
      consent_form_date: updatedPatient.consentFormDate,
      consent_form_type: updatedPatient.consentFormType
    };

    if (!navigator.onLine) {
      syncService.addToQueue('patients', 'UPDATE', { id: updatedPatient.id, ...supabaseData });
      return;
    }

    try {
      const { error } = await safeDatabaseOp<any>(
        'patients',
        'update',
        supabaseData,
        (q) => q.eq('id', updatedPatient.id)
      );
      
      if (error) throw error;

      // Notificaciones
      const authorName = currentProfile?.fullName || (currentRole === 'Doctor' ? 'Doctor' : currentRole === 'Enfermero' ? 'Enfermero' : 'Administrador');
      const targets = 
        currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
        currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
        ['Enfermero', 'Doctor'];

      try {
        await supabase.from('notifications').insert(targets.map(targetRole => ({
          title: 'Expediente de Paciente Actualizado',
          body: `${authorName} ha actualizado los datos del paciente ${updatedPatient.fullName}.`,
          voice_text: `Atención: El expediente del paciente ${updatedPatient.fullName} ha sido modificado por ${authorName}.`,
          target_role: targetRole
        })));
      } catch (err) {
        console.error('Error sending update patient notifications:', err);
      }

      toast.success('Paciente actualizado correctamente');
    } catch (err) {
      console.error("Error updating patient:", err);
      toast.error('Error al sincronizar con la base de datos');
    }
  };

  const handleUpdateWoundStatus = async (woundId: string, status: Wound['status'], comments?: string) => {
    setWounds(prev => {
      const updated = prev.map(w => 
        w.id === woundId ? { ...w, status, doctorComments: comments || w.doctorComments } : w
      );
      syncService.setCache('wounds', updated);
      return updated;
    });

    const wound = wounds.find(w => w.id === woundId);
    const patientName = patients.find(p => p.id === wound?.patientId)?.fullName || 'Paciente';

    try {
      if (navigator.onLine) {
        await supabase
          .from('wounds')
          .update({ 
            status, 
            doctor_comments: comments 
          })
          .eq('id', woundId);
        
        // Notificaciones centralizadas y guiadas por rol
        if (status === 'pending_doctor') {
          await sendNotification(
            'Nueva Valoración para Revisar',
            `El administrador ha enviado la valoración de ${patientName} para su aprobación médica.`,
            `Atención Doctor: Tiene una nueva valoración de ${patientName} pendiente de su aprobación.`,
            'Doctor'
          );

          await sendNotification(
            'Valoración Enviada a Doctor',
            `El administrador ha revisado y enviado la valoración de ${patientName} al Doctor.`,
            `Atención Enfermero: La valoración inicial para ${patientName} ha sido enviada al Doctor para su aprobación.`,
            'Enfermero'
          );
        } else if (status === 'approved') {
          await sendNotification(
            'Plan de Tratamiento Aprobado',
            `El Doctor ha aprobado el plan para ${patientName}. Ya puede iniciar las visitas de curación.`,
            `Atención Enfermero: El Doctor ha aprobado el plan de tratamiento para ${patientName}. Ya puede consultar las indicaciones e iniciar las visitas de curación.`,
            'Enfermero'
          );

          await sendNotification(
            'Plan de Tratamiento Aprobado',
            `El Doctor ha aprobado el plan para ${patientName}.`,
            `Atención Administrador: El Doctor ha aprobado el plan de tratamiento para ${patientName}.`,
            'Administrador'
          );
        } else if (status === 'rejected') {
          await sendNotification(
            'Plan de Tratamiento con Correcciones',
            `El Doctor ha rechazado o solicitado correcciones para ${patientName}${comments ? ': ' + comments : ''}`,
            `Atención Enfermero: El Doctor ha enviado comentarios de corrección para el paciente ${patientName}. Por favor revise las indicaciones.`,
            'Enfermero'
          );

          await sendNotification(
            'Plan de Tratamiento con Correcciones',
            `El Doctor ha solicitado correcciones para ${patientName}.`,
            `Atención Administrador: El Doctor ha enviado correcciones para el plan de ${patientName}.`,
            'Administrador'
          );
        } else {
          // Genérico para otros estados (e.g. completed)
          const statusText = status === 'completed' ? 'Completado' : status;
          const targets: Role[] = ['Enfermero', 'Doctor', 'Administrador'];
          const filteredTargets = targets.filter(t => t !== currentRole);

          for (const targetRole of filteredTargets) {
            await sendNotification(
              'Estado de Plan Actualizado',
              `El plan de ${patientName} ha sido cambiado a ${statusText}.`,
              `Atención: El estado del caso para ${patientName} se ha cambiado a ${statusText}.`,
              targetRole
            );
          }
        }

        const statusTextMsg = status === 'approved' ? 'Aprobado' : 
                               status === 'completed' ? 'Completado' : 
                               status === 'rejected' ? 'Rechazado' : 
                               status === 'pending_doctor' ? 'Enviado al Doctor' : status;
        toast.success(`Estado actualizado a ${statusTextMsg}`);
      } else {
        syncService.addToQueue('wounds', 'UPDATE', { id: woundId, status, doctor_comments: comments });
        toast.success('Estado actualizado (offline)');
      }
    } catch (error) {
      console.error('Error updating wound status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleUpdateProposalStatus = async (proposalId: string, status: 'accepted' | 'rejected') => {
    setProposals(prev => {
      const updated = prev.map(p => 
        p.id === proposalId ? { ...p, status } : p
      );
      syncService.setCache('proposals', updated);
      return updated;
    });

    const proposal = proposals.find(p => p.id === proposalId);
    const candidateName = proposal?.patientName || 'un paciente';

    try {
      if (navigator.onLine) {
        await supabase
          .from('treatment_proposals')
          .update({ status })
          .eq('id', proposalId);

        if (status === 'accepted') {
          await sendNotification(
            'Propuesta de Tratamiento Aprobada',
            `La propuesta para ${candidateName} ha sido aprobada por el Doctor.`,
            `Atención Enfermero: La propuesta de tratamiento para ${candidateName} ha sido aprobada por el Doctor.`,
            'Enfermero'
          );
          await sendNotification(
            'Propuesta de Tratamiento Aprobada',
            `La propuesta para ${candidateName} ha sido aprobada por el Doctor.`,
            `Atención Administrador: La propuesta para ${candidateName} ha sido aprobada por el Doctor.`,
            'Administrador'
          );
        } else if (status === 'rejected') {
          await sendNotification(
            'Propuesta de Tratamiento Rechazada',
            `La propuesta para ${candidateName} ha sido rechazada por el Doctor.`,
            `Atención Enfermero: La propuesta para ${candidateName} ha sido rechazada por el Doctor.`,
            'Enfermero'
          );
          await sendNotification(
            'Propuesta de Tratamiento Rechazada',
            `La propuesta para ${candidateName} ha sido rechazada por el Doctor.`,
            `Atención Administrador: La propuesta para ${candidateName} ha sido rechazada por el Doctor.`,
            'Administrador'
          );
        }

        const statusLabel = status === 'accepted' ? 'Aceptada' : 'Rechazada';
        toast.success(`Propuesta ${statusLabel} correctamente`);
      } else {
        syncService.addToQueue('treatment_proposals', 'UPDATE', { id: proposalId, status });
        toast.success('Estado de propuesta actualizado (offline)');
      }
    } catch (err) {
      console.error('Error updating proposal status:', err);
      toast.error('Error al actualizar el estado de la propuesta');
    }
  };

  const handleDeletePatient = (id: string) => {
    let patientDeleted = patients.find(p => p.id === id);
    let pName = patientDeleted?.fullName || 'un paciente';

    showConfirm(
      '¿Eliminar Paciente?',
      '¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer y eliminará todos sus registros asociados.',
      async () => {
        setPatients(prev => prev.filter(p => p.id !== id));
        syncService.setCache('patients', patients.filter(p => p.id !== id));
        
        if (navigator.onLine) {
          await supabase.from('patients').delete().eq('id', id);

          // Notificaciones
          const authorName = currentProfile?.fullName || 'Usuario';
          const targets = 
            currentRole === 'Enfermero' ? ['Doctor', 'Administrador'] : 
            currentRole === 'Doctor' ? ['Enfermero', 'Administrador'] : 
            ['Enfermero', 'Doctor'];

          try {
            await supabase.from('notifications').insert(targets.map(targetRole => ({
              title: 'Paciente Eliminado',
              body: `${authorName} ha eliminado al paciente ${pName} y todos sus registros asociados.`,
              voice_text: `Atención: El paciente ${pName} ha sido eliminado del sistema por ${authorName}.`,
              target_role: targetRole
            })));
          } catch (err) {
            console.error('Error sending delete patient notifications:', err);
          }

          toast.success('Paciente eliminado');
        } else {
          syncService.addToQueue('patients', 'DELETE', { id });
          toast.success('Paciente marcado para eliminar (offline)');
        }
      },
      { type: 'danger', confirmText: 'Eliminar Paciente' }
    );
  };

  const handleDeleteWound = (id: string) => {
    showConfirm(
      '¿Eliminar Herida?',
      '¿Estás seguro de que deseas eliminar esta herida? Esta acción no se puede deshacer.',
      async () => {
        setWounds(prev => prev.filter(w => w.id !== id));
        syncService.setCache('wounds', wounds.filter(w => w.id !== id));
        
        if (navigator.onLine) {
          await supabase.from('wounds').delete().eq('id', id);
          toast.success('Herida eliminada');
        } else {
          syncService.addToQueue('wounds', 'DELETE', { id });
          toast.success('Herida marcada para eliminar (offline)');
        }
      },
      { type: 'danger', confirmText: 'Eliminar Herida' }
    );
  };

  const handleSaveSignature = async (patientId: string, signature: string, type: 'privacy' | 'consent') => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const updatedPatient: Patient = {
      ...patient,
      [type === 'privacy' ? 'privacyNoticeSigned' : 'consentFormSigned']: true,
      [type === 'privacy' ? 'privacyNoticeSignature' : 'consentFormSignature']: signature,
      [type === 'privacy' ? 'privacyNoticeDate' : 'consentFormDate']: new Date().toISOString(),
      [type === 'privacy' ? 'privacyNoticeType' : 'consentFormType']: 'casa'
    };

    await handleUpdatePatient(updatedPatient);
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const mappedProfiles: UserProfile[] = data.map(p => {
            // Normalizar el rol para evitar problemas de mayúsculas/minúsculas
            let normalizedRole: Role = 'Enfermero';
            const dbRole = p.role?.toLowerCase();
            if (dbRole === 'administrador' || dbRole === 'admin') normalizedRole = 'Administrador';
            else if (dbRole === 'doctor' || dbRole === 'médico') normalizedRole = 'Doctor';
            else normalizedRole = 'Enfermero';

            return {
              id: p.id,
              role: normalizedRole,
              fullName: p.full_name,
              email: p.email,
              username: p.username,
              password: p.password,
              phone: p.phone,
              license: p.license,
              specialty: p.specialty,
              photoUrl: p.photo_url,
              signatureUrl: p.signature_url,
              bio: p.bio,
              status: p.status as 'active' | 'suspended'
            };
          });
          setProfiles(mappedProfiles);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoadingProfiles(false);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    // Inicializar perfil basado en el rol si no hay uno
    if (isLoggedIn && !currentProfile && !loadingProfiles) {
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
  }, [isLoggedIn, currentRole, loadingProfiles]); // Removed profiles from dependencies

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    if (currentProfile?.id === updatedProfile.id) {
      setCurrentProfileData(updatedProfile);
    }
    setProfiles(prev => {
      const exists = prev.find(p => p.id === updatedProfile.id);
      if (exists) {
        return prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      }
      const newList = [...prev, updatedProfile];
      syncService.setCache('profiles', newList);
      return newList;
    });

    const supabaseData: any = {
      role: updatedProfile.role,
      full_name: updatedProfile.fullName,
      email: updatedProfile.email,
      phone: updatedProfile.phone,
      license: updatedProfile.license,
      specialty: updatedProfile.specialty,
      photo_url: updatedProfile.photoUrl,
      signature_url: updatedProfile.signatureUrl,
      bio: updatedProfile.bio,
      status: updatedProfile.status,
      user_id: updatedProfile.user_id
    };

    try {
      // Si tenemos user_id, intentamos upsert de forma robusta
      if (updatedProfile.user_id) {
        // En lugar de upsert con onConflict que falla sin índice único público
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', updatedProfile.user_id)
          .maybeSingle();

        let result;
        if (existing) {
          result = await supabase
            .from('profiles')
            .update({ ...supabaseData })
            .eq('user_id', updatedProfile.user_id)
            .select()
            .single();
        } else {
          result = await supabase
            .from('profiles')
            .insert([{ ...supabaseData }])
            .select()
            .single();
        }
        
        const { data, error } = result;
        if (error) throw error;
        
        if (data) {
          const profileWithId = { ...updatedProfile, id: data.id };
          setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? profileWithId : p));
          if (currentProfile?.id === updatedProfile.id) {
            setCurrentProfileData(profileWithId);
          }
        }
      } else if (updatedProfile.id.length > 20) { // Likely a UUID
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', updatedProfile.id).maybeSingle();
        if (existing) {
          await supabase.from('profiles').update({ ...supabaseData }).eq('id', updatedProfile.id);
        } else {
          await supabase.from('profiles').insert([{ id: updatedProfile.id, ...supabaseData }]);
        }
      } else {
        const { data, error } = await supabase.from('profiles').insert([supabaseData]).select().single();
        if (error) throw error;
        if (data) {
          const profileWithNewId = { ...updatedProfile, id: data.id };
          setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? profileWithNewId : p));
          if (currentProfile?.id === updatedProfile.id) {
            setCurrentProfileData(profileWithNewId);
          }
        }
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Error al guardar el perfil en la base de datos");
    }
    
    toast.success('Perfil actualizado correctamente');
  };

  const handleLogout = async () => {
    console.log('App: handleLogout called');
    setIsLoggedIn(false);
    setCurrentProfileData(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentProfile');
    localStorage.removeItem('currentView');
    localStorage.removeItem('selectedPatientId');
    localStorage.removeItem('selectedWoundId');
    localStorage.removeItem('selectedQuotationId');
    localStorage.removeItem('selectedCertificateId');
    localStorage.removeItem('selectedProposalId');
    localStorage.removeItem('selectedDiagnosticId');
    setCurrentView('dashboard');
    setIsSidebarOpen(false);
    
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
    (window as any).navigateToRegister = () => {
      window.history.pushState({}, '', '/enfermeros');
      setCurrentView('register-nurse');
    };
    return () => {
      delete (window as any).navigateToRegister;
    };
  }, []);

  return (
    <ErrorBoundary>
      <Toaster />
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />
      {isAuthChecking ? (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-8 animate-pulse shadow-xl shadow-primary/20">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-12 h-12 object-contain mix-blend-multiply" />
          </div>
          <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-black text-white tracking-tight">Verificando sesión</h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Por favor espera un momento...</p>

          {authError && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-xs mx-auto animate-in fade-in zoom-in-95">
              <p className="text-red-400 text-xs font-bold">{authError}</p>
            </div>
          )}

          {showLoadingHelp && (
            <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="h-px w-12 bg-slate-800 mx-auto" />
              <div className="space-y-2">
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em]">¿Tienes problemas para entrar?</p>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">La conexión con el servidor está tardando más de lo habitual.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 border border-white/5"
                >
                  <RefreshCw className="w-4 h-4" /> Reintentar
                </button>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    supabase.auth.signOut();
                    window.location.reload();
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-8 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 border border-red-500/10"
                >
                  <LogOut className="w-4 h-4" /> Limpiar y Salir
                </button>
              </div>
            </div>
          )}
        </div>
      ) : !isLoggedIn ? (
        currentView === 'register-nurse' ? (
          <RegisterNurseView 
            onBack={() => setCurrentView('dashboard')}
            sendNotification={sendNotification}
            onLogin={(role, profile) => {
              setCurrentRole(role);
              if (profile) setCurrentProfileData(profile);
              setIsLoggedIn(true);
              setCurrentView('dashboard');
            }}
          />
        ) : (
          <LoginView onLogin={(role, profile) => {
            setCurrentRole(role);
            if (profile) setCurrentProfileData(profile);
            setIsLoggedIn(true);
            setCurrentView('dashboard');
          }} />
        )
      ) : (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
          <PWAInstallPrompt />
          
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary flex items-center justify-between px-6 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="h-8 w-auto mix-blend-multiply" />
          <span className="text-white font-bold tracking-tight">ViMedical</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Campanita Alertas Móvil */}
          <button 
            onClick={() => setShowNotificationCenter(true)}
            className="p-2 text-white hover:bg-white/10 rounded-xl relative transition-all"
            title="Centro de Notificaciones"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          {deferredPrompt && (
            <button 
              onClick={handleInstall}
              className="p-2 text-secondary hover:bg-white/10 rounded-lg transition-all"
              title="Instalar App"
            >
              <Download className="w-6 h-6" />
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(true)} className="text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
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
          {currentProfile?.role === 'Administrador' && (
            <div className="px-6 py-4 mb-4 bg-white/10 rounded-2xl border border-white/20">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Modo de Vista (Admin)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['Enfermero', 'Doctor', 'Administrador'] as Role[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setCurrentRole(role);
                      setCurrentView('dashboard');
                      toast.success(`Vista cambiada a: ${role}`);
                    }}
                    className={`text-[10px] font-bold py-2 rounded-lg transition-all ${
                      currentRole === role 
                        ? 'bg-secondary text-primary shadow-lg shadow-secondary/20' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {role === 'Administrador' ? 'Admin' : role}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            className={`w-full flex items-center justify-start gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'patients' || currentView === 'patient-detail' 
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span>Pacientes</span>
          </button>

          {currentRole !== 'Enfermero' && (
            <button
              onClick={() => navigateTo('clinical-history')}
              className={`w-full flex items-center justify-start gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'clinical-history' || currentView === 'clinical-history-detail' 
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span>Historial Clínico</span>
            </button>
          )}

          <button
            onClick={() => navigateTo('quotations')}
            className={`w-full flex items-center justify-start gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
              currentView === 'quotations' || currentView === 'new-quotation' || currentView === 'quotation-detail'
                ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Receipt className="w-5 h-5 flex-shrink-0" />
            <span>Cotizaciones</span>
          </button>

          {(currentRole === 'Administrador' || currentRole === 'Doctor' || currentRole === 'Enfermero') && (
            <button
              onClick={() => navigateTo('certificates')}
              className={`w-full flex items-center justify-start gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'certificates' || currentView === 'new-certificate' || currentView === 'certificate-detail'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileCheck className="w-5 h-5 flex-shrink-0" />
              <span>Certificados Médicos</span>
            </button>
          )}

          {currentRole === 'Administrador' && (
            <button
              onClick={() => navigateTo('analytics')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'analytics'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Estadísticas
            </button>
          )}

          {currentRole === 'Administrador' && (
            <button
              onClick={() => navigateTo('nurses-management')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'nurses-management'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-5 h-5" />
              Personal
            </button>
          )}

          {currentRole === 'Administrador' && (
            <button
              onClick={() => navigateTo('ecommerce')}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                currentView === 'ecommerce'
                  ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              Tienda
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

          {/* Desktop Install Button in Sidebar - Fixed to be more visible */}
          <button
            onClick={() => {
              if (deferredPrompt) {
                handleInstall();
              } else {
                toast('Para instalar la app, usa el menú de tu navegador (Instalar aplicación) o espera a que aparezca el prompt.', { icon: 'ℹ️' });
              }
            }}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 mt-2 ${
              deferredPrompt 
                ? 'bg-[#CBB882] text-white shadow-lg shadow-primary/20 scale-[1.02] animate-pulse-subtle' 
                : 'text-white/40 border border-white/5 bg-white/5 cursor-not-allowed opacity-50'
            }`}
            title={deferredPrompt ? "Instalar App" : "Instalación no disponible"}
          >
            <Download className="w-5 h-5" />
            Instalar Aplicación
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
                <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                  {currentProfile?.role === 'Administrador' ? `Modo: ${currentRole}` : 'En línea'}
                </p>
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-slate-100 bg-white shadow-xs sticky top-0 z-30">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Panel v2.8</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize">
              {currentView === 'dashboard' ? `Hola, ${currentProfile?.fullName?.split(' ')[0] || currentRole}` : 
               currentView === 'patients' ? 'Gestión de Pacientes' :
               currentView === 'patient-detail' ? 'Paciente & Expediente Clínico' :
               currentView === 'clinical-history' ? 'Control de Historias Clínicas' :
               currentView === 'quotations' ? 'Cotizaciones de Servicio' :
               currentView === 'certificates' ? 'Certificados Médicos' :
               currentView === 'analytics' ? 'Estadísticas & KPIs' :
               currentView === 'nurses-management' ? 'Control de Personal' :
               currentView === 'ecommerce' ? 'Tienda de Productos' :
               currentView === 'profile' ? 'Configuración de Perfil' : 
               currentView === 'settings' ? 'Herramientas y Preferencias' : currentView}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Campanita Escritorio */}
            <button 
              onClick={() => setShowNotificationCenter(true)}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl relative transition-all border border-slate-100 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              title="Centro de Alertas y Notificaciones"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="h-10 w-px bg-slate-100" />

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100/80 px-4 py-2 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                {currentRole[0]}
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 leading-none">{currentProfile?.fullName || currentRole}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{currentRole}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto">
          {currentView === 'dashboard' && currentRole === 'Enfermero' && <NurseDashboard navigateTo={navigateTo} patients={patients} wounds={wounds} treatments={treatmentLogs} profile={currentProfile} onSwitchRole={setCurrentRole} />}
          {currentView === 'dashboard' && currentRole === 'Administrador' && (
            <AdminDashboard 
              navigateTo={navigateTo} 
              patients={patients} 
              wounds={wounds} 
              treatmentLogs={treatmentLogs}
              sendNotification={sendNotification} 
              onUpdateWoundStatus={handleUpdateWoundStatus}
              profile={currentProfile}
              onSwitchRole={setCurrentRole}
              treatmentProposals={proposals}
            />
          )}
          {currentView === 'dashboard' && currentRole === 'Doctor' && (
            <DoctorDashboard 
              navigateTo={navigateTo} 
              patients={patients} 
              wounds={wounds} 
              treatmentLogs={treatmentLogs}
              sendNotification={sendNotification} 
              onUpdateWoundStatus={handleUpdateWoundStatus}
              profile={currentProfile}
              onSwitchRole={setCurrentRole}
              treatmentProposals={proposals}
              onUpdateProposalStatus={handleUpdateProposalStatus}
            />
          )}
          
          {currentView === 'patients' && <PatientsView navigateTo={navigateTo} patients={patients} onDelete={handleDeletePatient} wounds={wounds} />}
          {currentView === 'patient-detail' && selectedPatientId && (
            <PatientDetailView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              treatmentLogs={treatmentLogs}
              treatmentProposals={proposals}
            />
          )}
          {currentView === 'wound-detail' && selectedWoundId && (
            <WoundDetailView 
              woundId={selectedWoundId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              treatmentLogs={treatmentLogs}
              currentProfile={currentProfile}
            />
          )}
          {currentView === 'new-assessment' && selectedPatientId && (
            <AssessmentFormView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              onSave={handleAddWound}
              onUpdatePatient={handleUpdatePatient}
            />
          )}
          {currentView === 'new-treatment' && selectedWoundId && selectedPatientId && (
            <TreatmentFormView 
              patientId={selectedPatientId}
              woundId={selectedWoundId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              onSave={handleAddTreatment}
              currentUser={currentProfile}
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
              wounds={wounds}
              treatmentLogs={treatmentLogs}
              currentProfile={currentProfile}
              sendNotification={sendNotification}
            />
          )}
          {currentView === 'quotations' && (
            <QuotationListView 
              navigateTo={navigateTo} 
              quotations={quotations} 
              currentRole={currentRole} 
              onDelete={handleDeleteQuotation}
            />
          )}
          {currentView === 'new-quotation' && (
            <NewQuotationView 
              navigateTo={navigateTo} 
              patients={patients} 
              onSave={handleSaveQuotation} 
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
              onSaveSignature={handleSaveSignature}
            />
          )}
          {currentView === 'consent-form' && selectedPatientId && (
            <ConsentFormView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              onSaveSignature={handleSaveSignature}
            />
          )}
          {currentView === 'certificates' && (
            <CertificatesListView 
              navigateTo={navigateTo} 
              certificates={certificates} 
              currentRole={currentRole} 
              onDelete={handleDeleteCertificate}
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
              onDelete={handleDeleteProposal}
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
              onDelete={handleDeleteDiagnostic}
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
          {currentView === 'ecommerce' && (
            <EcommerceView onBack={() => navigateTo('dashboard')} userProfile={currentProfile} sendNotification={sendNotification} />
          )}
          {currentView === 'analytics' && (
            <AnalyticsView patients={patients} wounds={wounds} treatmentLogs={treatmentLogs} />
          )}
          {currentView === 'inventory' && (
            <InventoryView sendNotification={sendNotification} />
          )}
          {currentView === 'orders' && (
            <OrdersView sendNotification={sendNotification} />
          )}
          {currentView === 'nurses-management' && (
            <NursesManagementView 
              nurses={profiles} 
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={async (id) => {
                const profileToDelete = profiles.find(p => p.id === id);
                if (profileToDelete?.user_id) {
                  try {
                    const response = await fetch('/api/delete-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: profileToDelete.user_id })
                    });
                    if (!response.ok) throw new Error('Error al eliminar el usuario de autenticación');
                  } catch (err) {
                    console.error('Error deleting user from auth:', err);
                  }
                }
                
                const { error } = await supabase.from('profiles').delete().eq('id', id);
                if (error) {
                  toast.error('Error al eliminar el perfil');
                  return;
                }
                
                setProfiles(prev => {
                  const newList = prev.filter(p => p.id !== id);
                  syncService.setCache('profiles', newList);
                  return newList;
                });
                toast.success('Personal eliminado correctamente');
              }}
              onBack={() => navigateTo('dashboard')} 
            />
          )}
        </div>
      </main>

      {/* Notification Center Modal/Drawer */}
      <AnimatePresence>
        {showNotificationCenter && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationCenter(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" /> Notificaciones
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Historial de alertas y eventos ({unreadCount} sin leer)</p>
                </div>
                <button 
                  onClick={() => setShowNotificationCenter(false)}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs font-bold text-primary hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar todas como leídas
                </button>
                <button
                  onClick={() => {
                    fetchNotifications();
                    toast.success('Buzón sincronizado');
                  }}
                  className="p-1.5 hover:bg-white text-slate-500 hover:text-slate-700 rounded-lg border border-slate-200 transition-all shadow-xs cursor-pointer"
                  title="Sincronizar ahora"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-4 space-y-4">
                {notifications.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-300">
                      <Bell className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Sin notificaciones</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">No hay alertas registradas que coincidan con tu rol actual de {currentRole}.</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        notification.is_read 
                          ? 'border-slate-100 bg-white opacity-70' 
                          : 'border-blue-100 bg-blue-50/10 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                            )}
                            <h4 className="text-xs font-black text-slate-900">{notification.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{notification.body}</p>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-sm">
                              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            {notification.voice_text && (
                              <button
                                onClick={() => speakMessage(notification.voice_text)}
                                className="text-[9px] font-black text-indigo-500 flex items-center gap-1 hover:text-indigo-700 transition-colors uppercase tracking-wider cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" /> Escuchar
                              </button>
                            )}
                          </div>
                        </div>

                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                            title="Marcar como leída"
                          >
                            Leído
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ViMedical Alertas Inteligentes • Tiempo Real Activo</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    )}
    </ErrorBoundary>
  );
}