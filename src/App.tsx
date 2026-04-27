import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Users, User, Activity, AlertTriangle, PlusCircle, Clock, 
  ChevronRight, Camera, CheckSquare, Square, FileText, CheckCircle, XCircle, UserCircle, Menu, X, Download,
  Settings, Volume2, Bell, Mic, Eye, EyeOff, Receipt, DollarSign, Plus, Trash2, Shield, FileCheck, CheckCircle2,
  BarChart3, PenTool, Maximize, Printer, Mail, Phone, Award, AlertCircle, ShoppingBag, UserPlus,
  Lock, LogOut, Wifi, WifiOff, RefreshCw, Edit, Trash, Stethoscope, Package, TrendingUp, TrendingDown,
  ChevronLeft, ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
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
import { storageService } from './services/storageService';
import { Role, Patient, Wound, TreatmentLog, ClinicalComment, Quotation, QuotationItem, MedicalCertificate, TreatmentProposal, Diagnostic, MOCK_PATIENTS, MOCK_WOUNDS, MOCK_TREATMENTS, MOCK_CERTIFICATES, MOCK_PROPOSALS, MOCK_DIAGNOSTICS } from './mockData';
import { supabase } from './lib/supabase';
import { generateFinalReport, generateQuotationPDF, generateClinicalHistoryPDF, generateDiagnosticPDF, generateCertificatePDF } from './services/pdfService';
import { requestNotificationPermission, triggerFullNotification, playNotificationSound, speakMessage } from './services/notificationService';
import { syncService } from './services/syncService';

type View = 'dashboard' | 'patients' | 'patient-detail' | 'wound-detail' | 'new-assessment' | 'new-treatment' | 'new-patient' | 'settings' | 'clinical-history' | 'clinical-history-detail' | 'quotations' | 'new-quotation' | 'quotation-detail' | 'privacy-notice' | 'consent-form' | 'certificates' | 'new-certificate' | 'certificate-detail' | 'treatment-proposals' | 'new-treatment-proposal' | 'treatment-proposal-detail' | 'register-nurse' | 'diagnostics' | 'new-diagnostic' | 'diagnostic-detail' | 'profile' | 'nurses-management' | 'ecommerce' | 'analytics' | 'inventory' | 'orders';

interface UserProfile {
  id: string;
  user_id?: string;
  role: Role;
  fullName: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  license?: string;
  specialty?: string;
  photoUrl?: string;
  signatureUrl?: string;
  bio?: string;
  status?: 'active' | 'suspended';
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">Algo salió mal</h1>
          <p className="text-slate-400 mb-8 max-w-md">La aplicación encontró un error inesperado. Por favor, intenta recargar la página.</p>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
          >
            Reiniciar y Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  type = 'info'
}: { 
  isOpen: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: <Trash2 className="w-8 h-8 text-red-500" />,
      button: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      bg: 'bg-red-50'
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
      bg: 'bg-amber-50'
    },
    info: {
      icon: <Shield className="w-8 h-8 text-primary" />,
      button: 'bg-primary hover:bg-indigo-700 shadow-primary/20',
      bg: 'bg-indigo-50'
    }
  };

  const style = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`p-8 ${style.bg} flex flex-col items-center text-center`}>
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
            {style.icon}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{title}</h3>
          <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="p-8 bg-white flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl text-white font-black shadow-lg transition-all active:scale-95 ${style.button}`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: (role: Role, profile?: UserProfile) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginView: handleSubmit called', { email });
    setError('');
    setIsSubmitting(true);

    // Timeout de seguridad de 15 segundos
    const timeoutId = setTimeout(() => {
      setIsSubmitting(current => {
        if (current) {
          console.warn('LoginView: Login timeout reached');
          setError('La verificación está tardando demasiado. Por favor, intenta de nuevo o verifica tu conexión.');
          return false;
        }
        return current;
      });
    }, 15000);

    try {
      console.log('LoginView: Calling signInWithPassword');
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);
      console.log('LoginView: signInWithPassword result', { user: data.user?.id, error: authError?.message });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo o clave incorrectos');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor, confirma tu correo electrónico antes de ingresar.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        console.log('LoginView: Login successful, waiting for profile fetch in App.tsx');
        toast.success('Bienvenido de nuevo');
        // El listener en App.tsx se encargará de cambiarLoggedIn a true
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('LoginView: Unexpected error during login', err);
      setError('Error al conectar con el servidor: ' + (err.message || 'Error desconocido'));
    } finally {
      console.log('LoginView: Setting isSubmitting to false');
      setIsSubmitting(false);
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
              placeholder="correo@ejemplo.com"
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
            disabled={isSubmitting}
            className="w-full bg-[#3C6B94] text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-[#3C6B94]/20 hover:bg-[#CBB882] transition-all scale-100 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? 'Verificando...' : 'Entrar al Panel'}
            <ChevronRight className="w-5 h-5" />
          </button>

          {isSubmitting && (
            <button 
              type="button"
              onClick={() => setIsSubmitting(false)}
              className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 hover:text-slate-600 transition-colors"
            >
              ¿Atascado? Haz clic aquí para reintentar
            </button>
          )}

          <div className="text-center mt-6 space-y-4">
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
            
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
              >
                Limpiar sesión y reintentar
              </button>
            </div>
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
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedWoundId, setSelectedWoundId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [wounds, setWounds] = useState<Wound[]>(MOCK_WOUNDS);
  const [treatmentLogs, setTreatmentLogs] = useState<TreatmentLog[]>(MOCK_TREATMENTS);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>([]);
  const [proposals, setProposals] = useState<TreatmentProposal[]>(MOCK_PROPOSALS);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>(MOCK_DIAGNOSTICS);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoadingHelp, setShowLoadingHelp] = useState(false);
  
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

  // 2. Efectos de Autenticación
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
        console.log('App: User signed out or deleted, clearing state');
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
        
        // Timeout extendido para la búsqueda de perfil (45s)
        profileTimeoutRef.current = setTimeout(() => {
          console.error('App: Profile fetch timeout reached for', session.user.id);
          if (!hasCachedProfile) {
            toast.error('La verificación de perfil está tardando demasiado.');
            setIsAuthChecking(false);
            setShowLoadingHelp(true);
          } else {
            console.warn('App: Background profile fetch timed out, using cached data');
          }
        }, 45000);

        console.time(`profile_fetch_${session.user.id}`);
        try {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .limit(1);

          console.timeEnd(`profile_fetch_${session.user.id}`);
          if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);

          if (error) {
            console.error('App: Error fetching profile:', error);
            
            // Si el error es de autenticación (token inválido), forzar cierre de sesión
            if (error.message.includes('JWT') || error.message.includes('token') || error.message.includes('refresh_token')) {
              console.warn('App: Auth token error detected, signing out...');
              await supabase.auth.signOut();
              localStorage.clear();
              window.location.reload();
              return;
            }

            if (!hasCachedProfile) {
              setAuthError('Error al conectar con el servidor de perfiles.');
              setIsAuthChecking(false);
            }
            return;
          }

          const profileData = profiles && profiles.length > 0 ? profiles[0] : null;

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
            console.warn('App: No profile data returned for user', session.user.id);
            if (!hasCachedProfile) {
              setAuthError('No se encontró un perfil asociado a esta cuenta. Contacta al administrador.');
              setIsAuthChecking(false);
            }
          }
        } catch (profileErr) {
          if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
          console.error('App: Unexpected error fetching profile:', profileErr);
          if (!hasCachedProfile) {
            setAuthError('Error inesperado al verificar tu cuenta.');
            setIsAuthChecking(false);
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
          table: 'notifications',
          filter: `target_role=eq.${currentRole}`
        },
        (payload) => {
          const { title, body, voice_text } = payload.new;
          triggerFullNotification(title, body, voice_text);
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
          privacyNoticeSigned: p.privacy_notice_signed,
          privacyNoticeSignature: p.privacy_notice_signature,
          privacyNoticeDate: p.privacy_notice_date,
          privacyNoticeType: p.privacy_notice_type,
          consentFormSigned: p.consent_form_signed,
          consentFormSignature: p.consent_form_signature,
          consentFormDate: p.consent_form_date,
          consentFormType: p.consent_form_type
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
          evaluationDate: t.evaluation_date,
          width: t.width,
          length: t.length,
          fluidLeakage: t.fluid_leakage,
          foreignMaterial: t.foreign_material,
          sloughPresence: t.slough_presence,
          peripheralTractsMeasurements: t.peripheral_tracts_measurements,
          prognosis: t.prognosis,
          photos: t.photos || [],
          prontosanSolution: t.prontosan_solution,
          prontosanGel: t.prontosan_gel,
          kerlix: t.kerlix,
          telfa: t.telfa,
          avintraAdministered: t.avintra_administered,
          notes: t.notes,
          patientSignature: t.patient_signature,
          nurseId: t.nurse_id,
          cost: t.cost
        }));
        setTreatmentLogs(formattedLogs);
        syncService.setCache('treatment_logs', formattedLogs);
      }
    };

    fetchPatients();
    fetchWounds();
    fetchTreatmentLogs();
    fetchQuotations();
    fetchCertificates();
    fetchDiagnostics();
    fetchProposals();

    return () => {
      window.removeEventListener('online', handleOnline);
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
      const { error } = await supabase
        .from('patients')
        .update(supabaseData)
        .eq('id', updatedPatient.id);
      
      if (error) throw error;
      toast.success('Paciente actualizado correctamente');
    } catch (err) {
      console.error("Error updating patient:", err);
      toast.error('Error al sincronizar con la base de datos');
    }
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

  const handleDeletePatient = (id: string) => {
    showConfirm(
      '¿Eliminar Paciente?',
      '¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer y eliminará todos sus registros asociados.',
      async () => {
        setPatients(prev => prev.filter(p => p.id !== id));
        syncService.setCache('patients', patients.filter(p => p.id !== id));
        
        if (navigator.onLine) {
          await supabase.from('patients').delete().eq('id', id);
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
    setCurrentProfileData(updatedProfile);
    setProfiles(prev => {
      const exists = prev.find(p => p.id === updatedProfile.id);
      if (exists) {
        return prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      }
      return [...prev, updatedProfile];
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
      // Si tenemos user_id, intentamos upsert basado en user_id para evitar duplicados
      if (updatedProfile.user_id) {
        const { data, error } = await supabase
          .from('profiles')
          .upsert([{ ...supabaseData }], { onConflict: 'user_id' })
          .select()
          .single();
          
        if (error) throw error;
        
        if (data) {
          const profileWithId = { ...updatedProfile, id: data.id };
          setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? profileWithId : p));
          if (currentProfile?.id === updatedProfile.id) {
            setCurrentProfileData(profileWithId);
          }
        }
      } else if (updatedProfile.id.length > 20) { // Likely a UUID
        await supabase.from('profiles').upsert([{ id: updatedProfile.id, ...supabaseData }]);
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
    (window as any).navigateToRegister = () => setCurrentView('register-nurse');
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

          {currentRole === 'Administrador' && (
            <>
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
              <button
                onClick={() => navigateTo('inventory')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  currentView === 'inventory'
                    ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Package className="w-5 h-5" />
                Inventario
              </button>
              <button
                onClick={() => navigateTo('orders')}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  currentView === 'orders'
                    ? 'bg-secondary text-primary shadow-lg shadow-secondary/20 scale-[1.02]' 
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Pedidos
              </button>
            </>
          )}

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

          {(currentRole === 'Administrador' || currentRole === 'Enfermero' || currentRole === 'Doctor') && (
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
            />
          )}
          
          {currentView === 'patients' && <PatientsView navigateTo={navigateTo} patients={patients} onDelete={handleDeletePatient} />}
          {currentView === 'patient-detail' && selectedPatientId && (
            <PatientDetailView 
              patientId={selectedPatientId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              treatmentLogs={treatmentLogs}
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
              onSave={handleAddWound}
            />
          )}
          {currentView === 'new-treatment' && selectedWoundId && (
            <TreatmentFormView 
              woundId={selectedWoundId} 
              navigateTo={navigateTo} 
              patients={patients}
              wounds={wounds}
              onSave={handleAddTreatment}
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
              profiles={profiles} 
              onUpdateProfile={handleUpdateProfile}
              onDeleteProfile={async (id) => {
                const profileToDelete = profiles.find(p => p.id === id);
                if (profileToDelete?.user_id) {
                  try {
                    const response = await fetch(`/api/delete-user/${profileToDelete.user_id}`, {
                      method: 'DELETE'
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
                
                setProfiles(prev => prev.filter(p => p.id !== id));
                toast.success('Enfermero eliminado correctamente');
              }}
              onBack={() => navigateTo('dashboard')} 
            />
          )}
        </div>
      </main>
    </div>
    )}
    </ErrorBoundary>
  );
}

function SettingsView() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const handleRequestPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Tu navegador no soporta notificaciones de escritorio.');
      return;
    }
    const granted = await requestNotificationPermission();
    setPermissionStatus(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
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
                {permissionStatus === 'denied' ? (
                  <p className="text-[10px] text-amber-600 font-bold max-w-[200px] leading-tight">
                    Las notificaciones están bloqueadas en tu navegador. Debes habilitarlas manualmente en la configuración del sitio (icono del candado en la barra de direcciones).
                  </p>
                ) : (
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
                )}
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

  const exportToExcel = () => {
    const data = patients.map(p => ({
      Nombre: p.fullName,
      Telefono: p.phone,
      Nacimiento: p.dateOfBirth,
      Antecedentes: p.pathologicalHistory || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historiales");
    XLSX.writeFile(workbook, "Historial_Clinico_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Historial Clínico - ViMedical", 14, 22);
    
    const tableData = patients.map(p => [
      p.fullName,
      p.phone,
      p.dateOfBirth,
      p.pathologicalHistory?.substring(0, 50) || 'N/A'
    ]);

    (doc as any).autoTable({
      head: [['Nombre', 'Teléfono', 'Nacimiento', 'Antecedentes']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Historial_Clinico_ViMedical.pdf");
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
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Historial Clínico</h2>
          <p className="text-slate-500 font-medium">Consulta y gestión de antecedentes de pacientes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
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
  currentRole,
  wounds,
  treatmentLogs,
  currentProfile
}: { 
  patientId: string, 
  navigateTo: (view: View, pId?: string, wId?: string) => void, 
  patients: Patient[], 
  onUpdate: (p: Patient) => void,
  currentRole: Role,
  wounds: Wound[],
  treatmentLogs: TreatmentLog[],
  currentProfile: UserProfile | null
}) {
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return <div>Paciente no encontrado</div>;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [newComment, setNewComment] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-secondary transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoom herida" 
            className="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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

          {/* Foto de la Herida */}
          <div className="bg-white border border-slate-200 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm border-b border-slate-100 pb-4">Primera Foto de la Herida</h3>
            
            <div className="space-y-4">
              {patient.initialWoundPhoto ? (
                <div className="relative group">
                  <img 
                    src={patient.initialWoundPhoto} 
                    alt="Foto inicial herida" 
                    className="w-full h-64 object-cover rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setZoomedImage(patient.initialWoundPhoto!)}
                  />
                  <button 
                    onClick={() => setZoomedImage(patient.initialWoundPhoto!)}
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

// --- Dashboards por Rol ---


function ProfileView({ profile, onUpdate, onBack }: { profile: UserProfile, onUpdate: (p: UserProfile) => void, onBack: () => void }) {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const sigCanvas = React.useRef<SignatureCanvas>(null);

  const handleSave = async () => {
    setIsUploading(true);
    try {
      // Guardar firma si se editó
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const sigData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        const fileName = `signatures/${formData.user_id || formData.id}.png`;
        const url = await storageService.uploadBase64('photos', fileName, sigData);
        if (url) {
          formData.signatureUrl = url;
        }
      }
      onUpdate(formData);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error('Error al guardar los cambios');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const fileName = `profiles/${formData.user_id || formData.id}_${Date.now()}.png`;
        const url = await storageService.uploadFile('photos', fileName, file);
        if (url) {
          setFormData({ ...formData, photoUrl: url });
          toast.success('Foto actualizada');
        }
      } catch (error) {
        toast.error('Error al subir la foto');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
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
          disabled={isUploading}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
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

          {/* Firma Digital */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Digital</label>
              {isEditing && (
                <button onClick={clearSignature} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden aspect-[3/2] flex items-center justify-center relative">
              {isEditing ? (
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#0F172A"
                  canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                />
              ) : (
                formData.signatureUrl ? (
                  <img src={formData.signatureUrl} alt="Firma" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-center p-4">
                    <PenTool className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin firma registrada</p>
                  </div>
                )
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-4 italic">
              Esta firma se utilizará automáticamente en certificados e informes médicos.
            </p>
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

function EcommerceView({ onBack, userProfile, sendNotification }: { onBack: () => void, userProfile: UserProfile | null, sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void> }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProducts(data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.image_url,
            category: p.category
          })));
        } else {
          // Mock data if DB is empty
          setProducts([
            { id: 'p1', name: 'Prontosan Solución 350ml', description: 'Solución para el lavado de heridas.', price: 450, stock: 20, category: 'Lavado', imageUrl: 'https://picsum.photos/seed/prontosan/400/400' },
            { id: 'p2', name: 'Prontosan Gel 30ml', description: 'Gel para el desbridamiento autolítico.', price: 380, stock: 15, category: 'Gel', imageUrl: 'https://picsum.photos/seed/gel/400/400' },
            { id: 'p3', name: 'Apósito de Plata 10x10', description: 'Apósito antimicrobiano.', price: 120, stock: 50, category: 'Apósitos', imageUrl: 'https://picsum.photos/seed/silver/400/400' },
            { id: 'p4', name: 'Gasa Estéril 10x10', description: 'Paquete con 5 gasas.', price: 25, stock: 100, category: 'Consumibles', imageUrl: 'https://picsum.photos/seed/gauze/400/400' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!userProfile) return;
    setIsCheckingOut(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userProfile.user_id,
          total_amount: total,
          status: 'pending',
          shipping_address: 'Dirección de la clínica'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      // Decrementar stock y notificar si es bajo
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
        
        if (newStock < 5) {
          await sendNotification(
            'Alerta de Stock Bajo',
            `El producto ${item.product.name} tiene solo ${newStock} unidades después de la venta.`,
            `Atención Administrador: El producto ${item.product.name} está por agotarse. Quedan solo ${newStock} unidades.`,
            'Administrador'
          );
        }
      }
      
      // Notificar al administrador sobre el nuevo pedido
      await sendNotification(
        'Nuevo Pedido Recibido',
        `Se ha recibido un nuevo pedido de ${userProfile.fullName} por un total de $${total.toLocaleString()}`,
        `Atención Administrador: Se ha registrado un nuevo pedido en la tienda por parte de ${userProfile.fullName}. El monto total es de ${total} pesos.`,
        'Administrador'
      );

      setCart([]);
      setShowCart(false);
      toast.success('Pedido realizado con éxito');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Error al procesar el pedido');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Panel
          </button>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Tienda de Insumos</h2>
          <p className="text-slate-500 font-medium">Adquiere los mejores productos para el cuidado de heridas.</p>
        </div>
        
        <button 
          onClick={() => setShowCart(true)}
          className="relative bg-white border border-slate-200 p-4 rounded-2xl shadow-xl shadow-slate-200/50 hover:border-primary transition-all group"
        >
          <ShoppingBag className="w-6 h-6 text-slate-400 group-hover:text-primary" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2">Sin productos</h3>
          <p className="text-slate-500 font-medium max-w-md text-center px-6">
            No se encontraron productos disponibles en este momento. Por favor, intenta más tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-primary/10 transition-all group">
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm">
                  <span className="text-sm font-black text-primary">${product.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 block">{product.category}</span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{product.name}</h4>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{product.description}</p>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Añadir al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carrito Lateral */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tighter text-slate-900">Tu Carrito</h3>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{item.product.name}</h4>
                      <p className="text-xs text-slate-500 mb-2">{item.quantity} x ${item.product.price.toLocaleString()}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary">${(item.product.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total a pagar</span>
                  <span className="text-3xl font-black text-slate-900">${total.toLocaleString()}</span>
                </div>
                <button 
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  {isCheckingOut ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                  Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NursesManagementView({ profiles, onUpdateProfile, onDeleteProfile, onBack }: { profiles: UserProfile[], onUpdateProfile: (p: UserProfile) => void, onDeleteProfile: (id: string) => void, onBack: () => void }) {
  const nurses = profiles.filter(p => p.role === 'Enfermero');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isAddingNurse, setIsAddingNurse] = useState(false);
  const [newNurseData, setNewNurseData] = useState({
    fullName: '',
    password: '',
    email: '',
    phone: '',
    license: '',
    specialty: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{email: string, password: string} | null>(null);

  const handleAddNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newNurseData.email,
          password: newNurseData.password,
          fullName: newNurseData.fullName,
          role: 'Enfermero',
          license: newNurseData.license,
          phone: newNurseData.phone,
          specialty: newNurseData.specialty
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear el enfermero');
      }

      const profileData = result.profile;
      const newNurse: UserProfile = {
        id: profileData.id,
        user_id: profileData.user_id,
        role: 'Enfermero',
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        license: profileData.license,
        specialty: profileData.specialty,
        status: 'active'
      };

      // Actualizar estado local
      onUpdateProfile(newNurse);
      
      setCreatedCredentials({ email: newNurseData.email, password: newNurseData.password });
      setIsAddingNurse(false);
      setNewNurseData({
        fullName: '',
        password: '',
        email: '',
        phone: '',
        license: '',
        specialty: ''
      });
      toast.success('Enfermero registrado correctamente');
    } catch (err: any) {
      console.error('Error adding nurse:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <button 
          onClick={() => setIsAddingNurse(true)}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all flex items-center gap-3"
        >
          <UserPlus className="w-5 h-5" />
          Registrar Enfermero
        </button>
      </header>

      {createdCredentials && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-emerald-900">¡Enfermero registrado con éxito!</h4>
            </div>
            <button onClick={() => setCreatedCredentials(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-emerald-700 font-medium mb-6">Comparte estas credenciales con el nuevo integrante del equipo:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Email / Usuario</p>
              <p className="text-lg font-black text-slate-900 select-all">{createdCredentials.email}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Contraseña</p>
              <p className="text-lg font-black text-slate-900 select-all">{createdCredentials.password}</p>
            </div>
          </div>
        </div>
      )}

      {isAddingNurse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">Nuevo Registro</h3>
                <p className="text-slate-500 text-sm font-medium">Completa los datos para el nuevo enfermero.</p>
              </div>
              <button onClick={() => setIsAddingNurse(false)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddNurse} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    required
                    type="text"
                    value={newNurseData.fullName}
                    onChange={e => setNewNurseData({...newNurseData, fullName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    required
                    type="email"
                    value={newNurseData.email}
                    onChange={e => setNewNurseData({...newNurseData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                  <input 
                    required
                    type="text"
                    value={newNurseData.password}
                    onChange={e => setNewNurseData({...newNurseData, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Clave de acceso"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="tel"
                    value={newNurseData.phone}
                    onChange={e => setNewNurseData({...newNurseData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="55 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula Profesional</label>
                  <input 
                    type="text"
                    value={newNurseData.license}
                    onChange={e => setNewNurseData({...newNurseData, license: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Número de cédula"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad / Área</label>
                  <input 
                    type="text"
                    value={newNurseData.specialty}
                    onChange={e => setNewNurseData({...newNurseData, specialty: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ej. Heridas y Estomas"
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingNurse(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

function AdminDashboard({ navigateTo, patients, wounds, treatmentLogs, sendNotification, onUpdateWoundStatus, profile, onSwitchRole }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatmentLogs: TreatmentLog[], sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>, onUpdateWoundStatus: (id: string, status: Wound['status']) => void, profile: UserProfile | null, onSwitchRole: (role: Role) => void }) {
  const pendingAdmin = wounds.filter(w => w.status === 'pending_admin');
  const recentPatients = patients.slice(0, 5);

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

function DoctorDashboard({ navigateTo, patients, wounds, treatmentLogs, sendNotification, onUpdateWoundStatus, profile, onSwitchRole }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatmentLogs: TreatmentLog[], sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>, onUpdateWoundStatus: (id: string, status: Wound['status'], comments?: string) => void, profile: UserProfile | null, onSwitchRole?: (role: Role) => void }) {
  const pendingDoctor = wounds.filter(w => w.status === 'pending_doctor');
  const recentPatients = patients.slice(0, 5);
  const [comments, setComments] = useState('');

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
  const containerRef = React.useRef<HTMLDivElement>(null);

  const clear = () => sigCanvas.current?.clear();
  
  const resizeCanvas = () => {
    if (sigCanvas.current && containerRef.current) {
      const canvas = sigCanvas.current.getCanvas();
      const container = containerRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = container.offsetWidth * ratio;
      canvas.height = container.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      sigCanvas.current.clear(); // Resizing clears the canvas
    }
  };

  React.useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    // Initial resize after a short delay to ensure container is rendered
    const timer = setTimeout(resizeCanvas, 100);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timer);
    };
  }, []);

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor, proporcione una firma.');
      return;
    }
    onSave(sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 sm:p-8 bg-slate-50">
          <div ref={containerRef} className="bg-white border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden h-64 sm:h-80 touch-none">
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{ 
                className: 'w-full h-full cursor-crosshair',
                style: { width: '100%', height: '100%' }
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firme dentro del recuadro</p>
            <button 
              onClick={clear}
              className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
        <div className="p-6 sm:p-8 flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancelar
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

function PatientsView({ navigateTo, patients, onDelete }: { navigateTo: (view: View, pId?: string) => void, patients: Patient[], onDelete: (id: string) => void }) {
  const exportToExcel = () => {
    const data = patients.map(p => ({
      Nombre: p.fullName,
      Fecha_Nacimiento: p.dateOfBirth,
      Telefono: p.phone,
      Ocupacion: p.occupation,
      Genero: p.gender,
      Direccion: p.address
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
    XLSX.writeFile(workbook, "Pacientes_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
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

    (doc as any).autoTable({
      head: [['Nombre', 'Fecha Nac.', 'Teléfono', 'Ocupación']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillStyle: [15, 23, 42] }
    });

    doc.save("Pacientes_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Pacientes</h2>
          <p className="text-slate-500 font-medium">Registro y búsqueda de pacientes.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={() => navigateTo('new-patient')}
            className="bg-secondary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/20 hover:bg-secondary-dark transition-all scale-100 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {patients.map(patient => (
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
              </div>
            </div>

            <div className="pt-4 mt-4 flex justify-between items-center border-t border-slate-100 relative z-10">
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigateTo('clinical-history-detail', patient.id); }}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
              <div onClick={() => navigateTo('patient-detail', patient.id)} className="flex items-center gap-1 cursor-pointer group/link">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover/link:text-primary transition-colors">Ver Expediente</span>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover/link:text-primary group-hover/link:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientDetailView({ patientId, navigateTo, patients, wounds, treatmentLogs }: { patientId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatmentLogs: TreatmentLog[] }) {
  const patient = patients.find(p => p.id === patientId);
  const patientWounds = wounds.filter(w => w.patientId === patientId);
  const [activeTab, setActiveTab] = useState<'wounds' | 'history' | 'charts'>('wounds');

  if (!patient) return <div>Paciente no encontrado</div>;

  // Datos para la gráfica de progreso (ejemplo basado en el área de las heridas)
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

function AssessmentFormView({ patientId, navigateTo, patients, onSave }: { patientId: string, navigateTo: (view: View, pId?: string) => void, patients: Patient[], onSave: (w: Wound) => void }) {
  const patient = patients.find(p => p.id === patientId);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPhotos = newFiles.map((file: File) => URL.createObjectURL(file));
      
      setPhotoFiles(prev => [...prev, ...newFiles].slice(0, 5));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      toast.error('Debe incluir al menos una foto inicial de la herida.');
      return;
    }
    setIsSubmitting(true);
    toast.loading('Subiendo fotos y guardando valoración...', { id: 'assessment-save' });

    try {
      const uploadedPhotoUrls: string[] = [];
      for (const file of photoFiles) {
        const fileName = `wounds/${patientId}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const url = await storageService.uploadFile('wounds', fileName, file);
        if (url) uploadedPhotoUrls.push(url);
      }

      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const woundData: any = {
        patient_id: patientId,
        location: formData.get('location') as string || 'No especificada',
        description: formData.get('description') as string || '',
        proposed_plan: formData.get('proposed_plan') as string || '',
        status: 'pending_doctor',
        initial_photos: uploadedPhotoUrls,
        weight: formData.get('weight') as string,
        height: formData.get('height') as string,
        temp: formData.get('temp') as string,
        blood_pressure_systolic: formData.get('bloodPressureSystolic') as string,
        blood_pressure_diastolic: formData.get('bloodPressureDiastolic') as string,
        pulse: formData.get('pulse') as string,
        heart_rate: formData.get('heartRate') as string,
        respiratory_rate: formData.get('respiratoryRate') as string,
        oxygenation: formData.get('oxygenation') as string,
        glycemia_fasting: formData.get('glycemiaFasting') as string,
        glycemia_postprandial: formData.get('glycemiaPostprandial') as string,
        width: formData.get('width') as string,
        length: formData.get('length') as string,
        depth: formData.get('depth') as string,
        tunneling: formData.get('tunneling') as string,
        sinus_tract: formData.get('sinusTract') as string,
        undermining: formData.get('undermining') as string,
        pain_level: parseInt(formData.get('painLevel') as string) || 0,
        shape: formData.get('shape') as Wound['shape'],
        tissue_type: {
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
        abi_arm: formData.get('abiArm') as string,
        abi_left_toe: formData.get('abiLeftToe') as string,
        abi_left_pedal: formData.get('abiLeftPedal') as string,
        abi_left_post_tibial: formData.get('abiLeftPostTibial') as string,
        abi_right_toe: formData.get('abiRightToe') as string,
        abi_right_pedal: formData.get('abiRightPedal') as string,
        abi_right_post_tibial: formData.get('abiRightPostTibial') as string,
      };
      
      const notificationData = [
        {
          title: 'Nueva Valoración Inicial',
          body: `El enfermero ha registrado una valoración inicial para ${patient?.fullName}. Esperando autorización.`,
          voice_text: `Atención Administrador: Se ha recibido una nueva valoración inicial para el paciente ${patient?.fullName}. Por favor, revise y valide el registro.`,
          target_role: 'Administrador'
        },
        {
          title: 'Nueva Valoración Inicial',
          body: `El enfermero ha registrado una valoración inicial para ${patient?.fullName}. Esperando su autorización para seguir el procedimiento.`,
          voice_text: `Atención Doctor: Se ha registrado una nueva valoración inicial para su paciente ${patient?.fullName}. El paciente está esperando su autorización para seguir el procedimiento.`,
          target_role: 'Doctor'
        }
      ];

      if (!navigator.onLine) {
        const tempId = crypto.randomUUID();
        const newWound: Wound = {
          id: tempId,
          patientId: patientId,
          location: woundData.location,
          description: woundData.description,
          proposedPlan: woundData.proposed_plan,
          status: 'pending_doctor',
          initialPhotos: uploadedPhotoUrls,
          createdAt: new Date().toISOString(),
          visitCount: 0,
          targetVisits: 10
        } as Wound;
        
        syncService.addToQueue('wounds', 'INSERT', woundData);
        syncService.addToQueue('notifications', 'INSERT', notificationData);
        onSave(newWound);
      } else {
        const { data, error } = await supabase.from('wounds').insert([woundData]).select().single();
        if (error) throw error;
        if (data) {
          const newWound: Wound = {
            id: data.id,
            patientId: data.patient_id,
            location: data.location,
            description: data.description,
            proposedPlan: data.proposed_plan,
            status: data.status,
            initialPhotos: data.initial_photos,
            createdAt: data.created_at,
            visitCount: 0,
            targetVisits: 10
          } as Wound;
          onSave(newWound);
        }
        await supabase.from('notifications').insert(notificationData);
      }

      toast.success('Valoración guardada correctamente', { id: 'assessment-save' });
      setIsSuccess(true);
      setTimeout(() => {
        navigateTo('patient-detail', patientId);
      }, 2000);
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Error al guardar la valoración', { id: 'assessment-save' });
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Peso (kg)</label>
              <input name="weight" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Talla (m)</label>
              <input name="height" type="number" step="0.01" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Temp. (°C)</label>
              <input name="temp" type="number" step="0.1" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pulso</label>
              <input name="pulse" type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.C.</label>
              <input name="heartRate" type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">F.R.</label>
              <input name="respiratoryRate" type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Oxigenación (%)</label>
              <input name="oxygenation" type="number" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div className="col-span-2 md:col-span-2 lg:col-span-3 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Tensión Arterial</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Sistólica</label>
                <input name="bloodPressureSystolic" type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Diastólica</label>
                <input name="bloodPressureDiastolic" type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
            </div>

            <div className="col-span-2 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4 border border-slate-100 p-6 rounded-[2rem] bg-slate-50/50">
              <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Glicemia</div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Ayuno</label>
                <input name="glycemiaFasting" type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase text-center mb-2">Posprandial</label>
                <input name="glycemiaPostprandial" type="number" className="w-full border border-slate-200 rounded-xl p-3 text-center focus:ring-2 focus:ring-primary outline-none bg-white font-medium" />
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
              5. Fotos Iniciales
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Diagnóstico / Ubicación</label>
              <input name="location" type="text" placeholder="Ej. Dehiscencia de herida quirúrgica abdominal" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Pronóstico</label>
              <div className="relative">
                <select name="prognosis" className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
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
              <textarea name="proposed_plan" rows={5} placeholder="Ej. Prontosan solución (lavado)&#10;Prontosan gel&#10;Empaquetar con Kerlix&#10;Cubrir con Telfa&#10;Avintra 1 diario&#10;Curación c/ 24 horas." className="w-full border border-slate-200 rounded-[2rem] p-6 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all resize-none shadow-inner"></textarea>
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

function WoundDetailView({ woundId, navigateTo, patients, wounds, treatmentLogs, currentProfile }: { woundId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatmentLogs: TreatmentLog[], currentProfile: UserProfile | null }) {
  const wound = wounds.find(w => w.id === woundId);
  const treatments = treatmentLogs.filter(t => t.woundId === woundId).sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime());

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

function TreatmentFormView({ woundId, navigateTo, patients, wounds, onSave }: { woundId: string, navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], onSave: (t: TreatmentLog) => void }) {
  const wound = wounds.find(w => w.id === woundId);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
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
      const newFiles = Array.from(files);
      const newPhotos = newFiles.map((file: File) => URL.createObjectURL(file));
      setPhotoFiles(prev => [...prev, ...newFiles].slice(0, 5));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientSignature) {
      toast.error('El paciente debe firmar la asistencia.');
      return;
    }
    setIsSubmitting(true);
    toast.loading('Subiendo fotos y guardando visita...', { id: 'treatment-save' });

    try {
      // 1. Subir fotos a Storage
      const uploadedPhotoUrls: string[] = [];
      for (const file of photoFiles) {
        const fileName = `wounds/${woundId}_treatment_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
        const url = await storageService.uploadFile('wounds', fileName, file);
        if (url) uploadedPhotoUrls.push(url);
      }

      // 2. Subir firma a Storage
      let signatureUrl = patientSignature;
      if (patientSignature.startsWith('data:image')) {
        const signatureFileName = `signatures/patient_${wound.patientId}_${Date.now()}.png`;
        const uploadedUrl = await storageService.uploadBase64('signatures', signatureFileName, patientSignature);
        if (uploadedUrl) signatureUrl = uploadedUrl;
      }

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
        photos: uploadedPhotoUrls,
        prontosan_solution: formData.get('prontosanSolution') === 'on',
        prontosan_gel: formData.get('prontosanGel') === 'on',
        kerlix: formData.get('kerlix') === 'on',
        telfa: formData.get('telfa') === 'on',
        avintra_administered: formData.get('avintraAdministered') === 'on',
        notes: formData.get('notes') as string || '',
        patient_signature: signatureUrl
      };
      
      const notificationData = [
        {
          title: 'Nueva Curación Registrada',
          body: `Se ha registrado una visita de curación para ${patient?.fullName}.`,
          voice_text: `Atención: El enfermero ha registrado una nueva curación para el paciente ${patient?.fullName} con ${uploadedPhotoUrls.length} fotos de seguimiento.`,
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
        const tempId = crypto.randomUUID();
        const newTreatment: TreatmentLog = {
          id: tempId,
          woundId: treatmentData.wound_id,
          evaluationDate: treatmentData.evaluation_date,
          fluidLeakage: treatmentData.fluid_leakage,
          foreignMaterial: treatmentData.foreign_material,
          sloughPresence: treatmentData.slough_presence,
          peripheralTractsMeasurements: treatmentData.peripheral_tracts_measurements,
          prognosis: treatmentData.prognosis as 'Favorable' | 'Reservado' | 'Malo',
          photos: treatmentData.photos,
          prontosanSolution: treatmentData.prontosan_solution,
          prontosanGel: treatmentData.prontosan_gel,
          kerlix: treatmentData.kerlix,
          telfa: treatmentData.telfa,
          avintraAdministered: treatmentData.avintra_administered,
          notes: treatmentData.notes,
          patientSignature: treatmentData.patient_signature
        };
        
        syncService.addToQueue('treatment_logs', 'INSERT', treatmentData);
        syncService.addToQueue('wounds', 'UPDATE', { id: wound.id, visit_count: (wound.visitCount || 0) + 1 });
        syncService.addToQueue('notifications', 'INSERT', notificationData);
        onSave(newTreatment);
      } else {
        const { data, error } = await supabase.from('treatment_logs').insert([treatmentData]).select().single();
        if (error) throw error;
        if (data) {
          const newTreatment: TreatmentLog = {
            id: data.id,
            woundId: data.wound_id,
            evaluationDate: data.evaluation_date,
            fluidLeakage: data.fluid_leakage,
            foreignMaterial: data.foreign_material,
            sloughPresence: data.slough_presence,
            peripheralTractsMeasurements: data.peripheral_tracts_measurements,
            prognosis: data.prognosis,
            photos: data.photos,
            prontosanSolution: data.prontosan_solution,
            prontosanGel: data.prontosan_gel,
            kerlix: data.kerlix,
            telfa: data.telfa,
            avintraAdministered: data.avintra_administered,
            notes: data.notes,
            patientSignature: data.patient_signature
          };
          onSave(newTreatment);
        }
        // Actualizar contador de visitas en la herida
        await supabase.from('wounds').update({ visit_count: (wound.visitCount || 0) + 1 }).eq('id', wound.id);
        await supabase.from('notifications').insert(notificationData);
      }

      toast.success('Visita guardada correctamente', { id: 'treatment-save' });
      setIsSuccess(true);
      setTimeout(() => {
        navigateTo('wound-detail', wound.patientId, wound.id);
      }, 2000);
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast.error('Error al guardar la visita', { id: 'treatment-save' });
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

function QuotationListView({ navigateTo, quotations, currentRole, onDelete }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string) => void, quotations: Quotation[], currentRole: Role, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = quotations.map(q => ({
      Folio: q.id.substring(0, 8),
      Paciente: q.patientName,
      Fecha: new Date(q.createdAt).toLocaleDateString(),
      Total: q.totalAmount,
      Estado: q.status === 'sent' ? 'Enviada' : 'Pendiente'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizaciones");
    XLSX.writeFile(workbook, "Cotizaciones_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Cotizaciones - ViMedical", 14, 22);
    
    const tableData = quotations.map(q => [
      q.id.substring(0, 8),
      q.patientName,
      new Date(q.createdAt).toLocaleDateString(),
      `$${q.totalAmount.toLocaleString()}`,
      q.status === 'sent' ? 'Enviada' : 'Pendiente'
    ]);

    (doc as any).autoTable({
      head: [['Folio', 'Paciente', 'Fecha', 'Total', 'Estado']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Cotizaciones_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredQuotations = quotations.filter(q => 
    q.patientName.toLowerCase().includes(search.toLowerCase()) ||
    q.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Cotizaciones</h2>
          <p className="text-slate-500 font-medium">Gestión de presupuestos de tratamiento.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          {currentRole === 'Administrador' && (
            <button 
              onClick={() => navigateTo('new-quotation')}
              className="bg-secondary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-secondary/20 hover:bg-secondary-dark transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Nueva Cotización
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {quotations.map(quotation => (
          <div 
            key={quotation.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div onClick={() => navigateTo('quotation-detail', undefined, undefined, quotation.id)}>
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

            {currentRole === 'Administrador' && (
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(quotation.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            )}
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
    privacyNoticeSigned: false,
    privacyNoticeSignature: '',
    privacyNoticeDate: '',
    privacyNoticeType: 'casa',
    consentFormSigned: false,
    consentFormSignature: '',
    consentFormDate: '',
    consentFormType: 'casa',
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
  const [step, setStep] = useState(1);
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
      regions_segments: formData.regionsSegments,
      initial_wound_photo: formData.initialWoundPhoto || '',
      privacy_notice_signed: formData.privacyNoticeSigned || false,
      privacy_notice_signature: formData.privacyNoticeSignature || '',
      privacy_notice_date: formData.privacyNoticeDate || '',
      privacy_notice_type: formData.privacyNoticeType || 'casa',
      consent_form_signed: formData.consentFormSigned || false,
      consent_form_signature: formData.consentFormSignature || '',
      consent_form_date: formData.consentFormDate || '',
      consent_form_type: formData.consentFormType || 'casa'
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
        address: patientData.address,
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

    toast.loading('Subiendo firmas y fotos...', { id: 'patient-save' });
    try {
      // Subir firmas a Storage si existen
      if (patientData.privacy_notice_signature && patientData.privacy_notice_signature.startsWith('data:image')) {
        const url = await storageService.uploadBase64('signatures', `privacy_${Date.now()}.png`, patientData.privacy_notice_signature);
        if (url) {
          patientData.privacy_notice_signature = url;
        } else {
          console.warn('Fallo la subida de firma de aviso de privacidad, se guardará sin firma');
          patientData.privacy_notice_signature = '';
        }
      }
      if (patientData.consent_form_signature && patientData.consent_form_signature.startsWith('data:image')) {
        const url = await storageService.uploadBase64('signatures', `consent_${Date.now()}.png`, patientData.consent_form_signature);
        if (url) {
          patientData.consent_form_signature = url;
        } else {
          console.warn('Fallo la subida de firma de consentimiento, se guardará sin firma');
          patientData.consent_form_signature = '';
        }
      }
      
      // Subir foto inicial si existe
      if (patientData.initial_wound_photo && patientData.initial_wound_photo.startsWith('data:image')) {
        toast.loading('Subiendo evidencia fotográfica...', { id: 'patient-save' });
        console.log('Subiendo evidencia fotográfica inicial...');
        const url = await storageService.uploadBase64('photos', `patient_${Date.now()}.png`, patientData.initial_wound_photo);
        if (url) {
          patientData.initial_wound_photo = url;
        } else {
          // Si falla la subida de la foto, mostramos advertencia pero permitimos continuar sin la foto
          // para no bloquear el registro del paciente
          toast.error('No se pudo subir la foto, el registro continuará sin ella', { duration: 4000 });
          patientData.initial_wound_photo = '';
        }
      }

      toast.loading('Guardando expediente...', { id: 'patient-save' });
      console.log('Insertando datos del paciente en Supabase:', patientData);
      
      // Sanitizar datos para la tabla de Supabase (solo columnas que existen en la DB)
      const sanitizedData: any = {
        full_name: patientData.full_name,
        date_of_birth: patientData.date_of_birth,
        gender: patientData.gender,
        phone: patientData.phone,
        address: patientData.address,
        marital_status: patientData.marital_status,
        occupation: patientData.occupation,
        religion: patientData.religion,
        education_level: formData.educationLevel || '',
        family_history: patientData.family_history,
        pathological_history: patientData.pathological_history,
        non_pathological_history: patientData.non_pathological_history,
        initial_wound_photo: patientData.initial_wound_photo,
        current_condition: formData.currentCondition || '',
        physical_exploration: formData.physicalExploration || '',
        regions_segments: formData.regionsSegments || '',
        privacy_notice_signed: patientData.privacy_notice_signed,
        privacy_notice_date: patientData.privacy_notice_date,
        privacy_notice_signature: patientData.privacy_notice_signature,
        privacy_notice_type: patientData.privacy_notice_type,
        consent_form_signed: patientData.consent_form_signed,
        consent_form_date: patientData.consent_form_date,
        consent_form_signature: patientData.consent_form_signature,
        consent_form_type: patientData.consent_form_type
      };

      // Si la fecha fue capturada manualmente o contiene texto, intentamos normalizarla
      if (sanitizedData.date_of_birth) {
        let dob = sanitizedData.date_of_birth.trim().toUpperCase();
        
        // Mapeo de meses en español
        const months: { [key: string]: string } = {
          'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04', 'MAYO': '05', 'JUNIO': '06',
          'JULIO': '07', 'AGOSTO': '08', 'SEPTIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
        };

        // Caso: "20 DE NOVIEMBRE DE 1970" o "20 NOVIEMBRE 1970"
        for (const monthName in months) {
          if (dob.includes(monthName)) {
            const parts = dob.split(/\s+DE\s+|\s+/);
            const day = parts[0].padStart(2, '0');
            const year = parts[parts.length - 1];
            if (day && year && year.length === 4) {
              sanitizedData.date_of_birth = `${year}-${months[monthName]}-${day}`;
            }
            break;
          }
        }

        // Caso: DD/MM/AAAA
        if (sanitizedData.date_of_birth.includes('/')) {
          const parts = sanitizedData.date_of_birth.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            if (year.length === 4) {
              sanitizedData.date_of_birth = `${year}-${month}-${day}`;
            }
          }
        }
      }

      console.log('Insertando datos del paciente en Supabase:', sanitizedData);
      const { data, error } = await supabase
        .from('patients')
        .insert([sanitizedData])
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
          familyHistory: data.family_history,
          pathologicalHistory: data.pathological_history,
          nonPathologicalHistory: data.non_pathological_history,
          gender: data.gender,
          maritalStatus: data.marital_status,
          occupation: data.occupation,
          address: data.address,
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

        setCreatedPatientId(data.id);
        onSave(newPatient);
        toast.success('Paciente registrado correctamente', { id: 'patient-save' });
        setIsSuccess(true);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      const errorMessage = error.message || 'Error desconocido';
      toast.error(`Error al registrar el paciente: ${errorMessage}`, { id: 'patient-save' });
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
        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Paciente Registrado!</h2>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          El nuevo paciente ha sido dado de alta exitosamente en el sistema.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => navigateTo('new-assessment', createdPatientId || undefined)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Añadir Valoración de Herida
          </button>
          <button 
            onClick={() => navigateTo('patient-detail', createdPatientId || undefined)}
            className="bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-300 transition-all"
          >
            <FileText className="w-5 h-5" />
            Ir al Expediente
          </button>
        </div>
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

      <div className="space-y-10" onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }}>
        
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre Completo</label>
                <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Fecha de Nacimiento</label>
                <input 
                  type="text" 
                  placeholder="DD/MM/AAAA o AAAA-MM-DD"
                  value={formData.dateOfBirth} 
                  onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} 
                  className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" 
                />
                <p className="text-[10px] text-slate-400 mt-1 ml-1 px-1 italic">Captura manual habilitada</p>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Teléfono</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Sexo</label>
                <div className="relative">
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all appearance-none pr-12">
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="No Binario">No Binario</option>
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

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Evidencia Fotográfica Inicial (Opcional)</label>
                <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30">
                  {formData.initialWoundPhoto ? (
                    <div className="relative group">
                      <img src={formData.initialWoundPhoto} alt="Evidencia" className="w-full max-w-sm rounded-2xl shadow-lg border-4 border-white" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, initialWoundPhoto: ''})}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-6">
                      <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-4">
                        <Camera className="w-10 h-10" />
                      </div>
                      <p className="text-slate-500 font-medium mb-6 max-w-xs">Toma una foto de la herida o carga un archivo desde tu dispositivo</p>
                      
                      <div className="flex flex-wrap justify-center gap-4">
                        <label className="bg-primary text-white px-8 py-4 rounded-xl font-black text-sm cursor-pointer hover:bg-primary/90 transition-all flex items-center gap-3">
                          <Plus className="w-5 h-5" />
                          Subir Archivo
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({...formData, initialWoundPhoto: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({...formData, initialWoundPhoto: reader.result as string});
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className="bg-secondary text-primary px-8 py-4 rounded-xl font-black text-sm hover:bg-secondary/80 transition-all flex items-center gap-3"
                        >
                          <Camera className="w-5 h-5" />
                          Tomar Foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                Anterior
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
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
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="bg-secondary text-white px-12 py-5 rounded-2xl font-black text-sm shadow-2xl shadow-secondary/30 hover:bg-secondary-dark transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Finalizar Registro'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificatesListView({ navigateTo, certificates, currentRole, onDelete }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string) => void, certificates: MedicalCertificate[], currentRole: Role, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = certificates.map(c => ({
      Folio: c.id.substring(0, 8),
      Paciente: c.patientName,
      Medico: c.doctorName,
      Fecha: c.date,
      Estado_Fisico: c.physicalState
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificados");
    XLSX.writeFile(workbook, "Certificados_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Certificados - ViMedical", 14, 22);
    
    const tableData = certificates.map(c => [
      c.id.substring(0, 8),
      c.patientName,
      c.doctorName,
      c.date,
      c.physicalState.substring(0, 30) + '...'
    ]);

    (doc as any).autoTable({
      head: [['Folio', 'Paciente', 'Médico', 'Fecha', 'Estado Físico']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Certificados_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredCertificates = certificates.filter(c => 
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Certificados Médicos</h2>
          <p className="text-slate-500 font-medium">Gestión de certificados emitidos por el personal médico.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          {(currentRole === 'Administrador' || currentRole === 'Doctor') && (
            <button 
              onClick={() => navigateTo('new-certificate')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Nuevo Certificado
            </button>
          )}
        </div>
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
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('certificate-detail', undefined, undefined, undefined, cert.id)}>
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
            </div>
            <div className="mt-6 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(cert.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('certificate-detail', undefined, undefined, undefined, cert.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
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
    generateCertificatePDF(certificate);
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

function NurseDashboard({ navigateTo, patients, wounds, treatments, profile, onSwitchRole }: { navigateTo: (view: View, pId?: string, wId?: string) => void, patients: Patient[], wounds: Wound[], treatments: TreatmentLog[], profile: UserProfile | null, onSwitchRole?: (role: Role) => void }) {
  const myPatients = patients.filter(p => p.registeredBy === profile?.id || !p.registeredBy);
  const myTreatments = treatments.filter(t => t.nurseId === profile?.id);
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
      {profile?.role === 'Administrador' && onSwitchRole && (
        <div className="bg-primary rounded-[2rem] p-4 flex items-center justify-between text-white shadow-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-secondary" />
            <p className="text-sm font-bold">Estás viendo la plataforma como <span className="text-secondary">Enfermero</span></p>
          </div>
          <button 
            onClick={() => onSwitchRole('Administrador')}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Volver a Admin
          </button>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Panel de Enfermería</h2>
          <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">{profile?.fullName || 'Enf. Operativo'}</h3>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigateTo('new-patient')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 scale-100 active:scale-95"
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

function RegisterNurseView({ onBack, sendNotification }: { onBack: () => void, sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void> }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    license: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      console.log('RegisterNurseView: Starting registration for', formData.email);
      console.log('RegisterNurseView: Form data:', { ...formData, password: '***' });
      
      // Timeout de seguridad para la petición (aumentado a 25s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('RegisterNurseView: Request timeout reached');
        controller.abort();
      }, 25000);

      console.log('RegisterNurseView: Sending POST request to /api/create-user...');
      // Usar el endpoint de la API para crear el usuario y el perfil de forma segura
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: 'Enfermero',
          license: formData.license
        }),
        signal: controller.signal
      });

      console.log('RegisterNurseView: Response received, status:', response.status);
      clearTimeout(timeoutId);
      
      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.error('RegisterNurseView: Failed to parse JSON response', jsonErr);
        throw new Error('El servidor respondió con un formato inesperado. Por favor, intenta de nuevo.');
      }

      if (!response.ok) {
        console.error('RegisterNurseView: API error:', result.error);
        throw new Error(result.error || 'Error al registrarse');
      }

      console.log('RegisterNurseView: User and profile created successfully');

      // Notificar al administrador
      try {
        await sendNotification(
          'Nuevo Registro de Enfermería',
          `${formData.fullName} se ha registrado en el sistema.`,
          `Atención Administrador: Un nuevo enfermero, ${formData.fullName}, se ha registrado en el sistema.`,
          'Administrador'
        );
      } catch (notifyErr) {
        console.warn('RegisterNurseView: Could not send notification:', notifyErr);
      }

      toast.success('Registro exitoso. Ahora puedes iniciar sesión.');
      onBack();
    } catch (err: any) {
      console.error('RegisterNurseView: Registration failed:', err);
      if (err.name === 'AbortError') {
        setError('La petición tardó demasiado. Por favor, verifica tu conexión e intenta de nuevo.');
      } else {
        setError(err.message || 'Error al registrarse');
      }
      toast.error(err.message || 'Error en el registro');
    } finally {
      console.log('RegisterNurseView: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
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
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

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

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner pr-12"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
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

          <div className="pt-4 flex flex-col gap-4">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={onBack}
                className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-[2] bg-primary text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Registrando...' : 'Completar Registro'}
              </button>
            </div>
            
            {isSubmitting && (
              <button 
                type="button"
                onClick={() => setIsSubmitting(false)}
                className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                ¿Atascado? Haz clic aquí para reintentar
              </button>
            )}

            <div className="pt-4 border-t border-slate-100 text-center">
              <button 
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  localStorage.clear();
                  window.location.reload();
                }}
                className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors"
              >
                Limpiar sesión y reintentar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TreatmentProposalsListView({ navigateTo, proposals, currentRole, onDelete }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string) => void, proposals: TreatmentProposal[], currentRole: Role, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = proposals.map(p => ({
      Folio: p.id.substring(0, 8),
      Paciente: p.patientName,
      Programa: p.program,
      Inversion: p.investment,
      Fecha: p.date
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Propuestas");
    XLSX.writeFile(workbook, "Propuestas_Tratamiento_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Propuestas de Tratamiento - ViMedical", 14, 22);
    
    const tableData = proposals.map(p => [
      p.id.substring(0, 8),
      p.patientName,
      p.program,
      `$${p.investment.toLocaleString()}`,
      p.date
    ]);

    (doc as any).autoTable({
      head: [['Folio', 'Paciente', 'Programa', 'Inversión', 'Fecha']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Propuestas_Tratamiento_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredProposals = proposals.filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Propuestas de Tratamiento</h2>
          <p className="text-slate-500 font-medium">Gestión de planes de cuidados en casa e inversión.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => navigateTo('new-treatment-proposal')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nueva Propuesta
          </button>
        </div>
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
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('treatment-proposal-detail', undefined, undefined, undefined, undefined, proposal.id)}>
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
            </div>

            <div className="mt-8 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(proposal.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('treatment-proposal-detail', undefined, undefined, undefined, undefined, proposal.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
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

function DiagnosticsListView({ navigateTo, diagnostics, currentRole, onDelete }: { navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, diagId?: string) => void, diagnostics: Diagnostic[], currentRole: Role, onDelete: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = diagnostics.map(d => ({
      Folio: d.id.substring(0, 8),
      Paciente: d.patientName,
      Fecha: d.date,
      Diagnostico: d.diagnosis
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Diagnosticos");
    XLSX.writeFile(workbook, "Diagnosticos_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Diagnósticos - ViMedical", 14, 22);
    
    const tableData = diagnostics.map(d => [
      d.id.substring(0, 8),
      d.patientName,
      d.date,
      d.diagnosis.substring(0, 50)
    ]);

    (doc as any).autoTable({
      head: [['Folio', 'Paciente', 'Fecha', 'Diagnóstico']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Diagnosticos_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredDiagnostics = diagnostics.filter(d => 
    d.patientName.toLowerCase().includes(search.toLowerCase()) ||
    d.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Diagnósticos Electrónicos</h2>
          <p className="text-slate-500 font-medium">Gestión y consulta de diagnósticos clínicos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToExcel}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button 
            onClick={() => navigateTo('new-diagnostic')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo Diagnóstico
          </button>
        </div>
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
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('diagnostic-detail', undefined, undefined, undefined, undefined, undefined, diagnostic.id)}>
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
            </div>

            <div className="mt-8 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(diagnostic.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('diagnostic-detail', undefined, undefined, undefined, undefined, undefined, diagnostic.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
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
  const sigCanvas = React.useRef<SignatureCanvas>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    if (sigCanvas.current?.isEmpty()) {
      toast.error('Por favor firme el diagnóstico');
      return;
    }

    const signatureData = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

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
      signature: signatureData,
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

        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Firma del Médico</label>
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
          <div className="flex justify-end">
            <button 
              type="button" 
              onClick={() => sigCanvas.current?.clear()}
              className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Limpiar Firma
            </button>
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
    generateDiagnosticPDF(diagnostic);
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

function AnalyticsView({ patients, wounds, treatmentLogs }: { patients: Patient[], wounds: Wound[], treatmentLogs: TreatmentLog[] }) {
  const [salesData, setSalesData] = useState<{ name: string, sales: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string, quantity: number }[]>([]);
  
  const activeWounds = wounds.filter(w => w.status !== 'completed' && w.status !== 'rejected');
  const completedWounds = wounds.filter(w => w.status === 'completed');
  
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data: orders, error } = await supabase.from('orders').select('*, order_items(*)');
        if (error) throw error;
        
        // Group by month
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const grouped = months.map(m => ({ name: m, sales: 0 }));
        
        orders?.forEach(order => {
          const date = new Date(order.created_at);
          const monthIdx = date.getMonth();
          if (monthIdx < grouped.length) {
            grouped[monthIdx].sales += Number(order.total_amount);
          }
        });
        setSalesData(grouped);

        // Top products
        const productCounts: Record<string, number> = {};
        orders?.forEach(order => {
          order.order_items?.forEach((item: any) => {
            productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.quantity;
          });
        });
        // For demo, we'll just use some names if we had product names
        setTopProducts([
          { name: 'Prontosan Solución', quantity: 45 },
          { name: 'Apósito de Plata', quantity: 32 },
          { name: 'Gasas Estériles', quantity: 28 },
        ]);

      } catch (e) {
        console.error('Error fetching sales analytics:', e);
      }
    };
    fetchSales();
  }, []);

  const healingData = [
    { name: 'Ene', active: 4, completed: 1 },
    { name: 'Feb', active: 6, completed: 2 },
    { name: 'Mar', active: 8, completed: 5 },
    { name: 'Abr', active: activeWounds.length, completed: completedWounds.length },
  ];

  const genderData = [
    { name: 'Masculino', value: patients.filter(p => p.gender === 'Masculino').length || 12 },
    { name: 'Femenino', value: patients.filter(p => p.gender === 'Femenino').length || 18 },
  ];

  const locationData = Array.from(new Set(wounds.map(w => w.location))).map(loc => ({
    name: loc,
    value: wounds.filter(w => w.location === loc).length
  })).slice(0, 5);

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Estadísticas Clínicas</h2>
          <p className="text-slate-500 font-medium">Análisis detallado del rendimiento y progreso de pacientes.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 p-3 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
          <button className="bg-white border border-slate-200 px-6 py-3 rounded-xl text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            Exportar Datos
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pacientes</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{patients.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Activity className="w-6 h-6" />
            </div>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heridas Activas</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{activeWounds.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Altas Médicas</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{completedWounds.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            ${salesData.reduce((acc, curr) => acc + curr.sales, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Ingresos por Ventas</h3>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <ArrowUpRight className="w-4 h-4" />
              +12.5%
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Progreso de Curación</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healingData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Ubicación de Heridas</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Productos Más Vendidos</h3>
          <div className="space-y-6">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-400 border border-slate-100">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumo Médico</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{product.quantity}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function InventoryView({ sendNotification }: { sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void> }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Insumos',
    imageUrl: 'https://picsum.photos/seed/medical/400/400'
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.image_url,
          category: p.category
        })));
      }
    } catch (e) {
      console.error('Error fetching inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success('Stock actualizado');

      // Notificar si el stock es bajo
      if (newStock < 5) {
        const product = products.find(p => p.id === id);
        if (product) {
          await sendNotification(
            'Alerta de Stock Bajo',
            `El producto ${product.name} tiene solo ${newStock} unidades.`,
            `Atención Administrador: El producto ${product.name} está por agotarse. Quedan solo ${newStock} unidades en inventario.`,
            'Administrador'
          );
        }
      }
    } catch (e) {
      toast.error('Error al actualizar stock');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        category: newProduct.category,
        image_url: newProduct.imageUrl
      });
      if (error) throw error;
      toast.success('Producto añadido');
      setShowAddModal(false);
      fetchProducts();
    } catch (e) {
      toast.error('Error al añadir producto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Producto eliminado');
    } catch (e) {
      toast.error('Error al eliminar producto');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Inventario</h2>
          <p className="text-slate-500 font-medium">Control de existencias y alertas de stock bajo.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-black text-amber-700">
              {products.filter(p => p.stock < 5).length} Stock bajo
            </span>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </header>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Añadir Producto</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                <input 
                  type="text" required
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                  <input 
                    type="number" required
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                  <input 
                    type="number" required
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                <textarea 
                  required
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none h-24"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-primary text-[10px] font-black uppercase tracking-widest">
                    {product.category}
                  </span>
                </td>
                <td className="p-8 font-black text-slate-900">
                  ${product.price.toLocaleString()}
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${product.stock < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="font-black text-slate-900">{product.stock} unidades</span>
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStock(product.id, Math.max(0, product.stock - 1))}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      <TrendingDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersView({ sendNotification }: { sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void> }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email), order_items(*, products(name))')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Estado del pedido actualizado');

      // Notificar al personal (en este caso simplificado, a todos los enfermeros/doctores)
      // En una versión real, esto sería específico para el usuario que hizo el pedido
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await sendNotification(
          'Actualización de Pedido',
          `Tu pedido #${orderId.slice(0, 8)} ha cambiado a: ${getStatusLabel(newStatus)}`,
          `Atención: El estado de su pedido ha sido actualizado a ${getStatusLabel(newStatus)}.`,
          'Enfermero' // Notificamos a enfermeros por defecto, o podríamos detectar el rol del usuario
        );
      }
    } catch (e) {
      toast.error('Error al actualizar estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Pedidos</h2>
        <p className="text-slate-500 font-medium">Administra las compras realizadas por el personal.</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No hay pedidos registrados</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8">
                      <span className="font-mono text-xs font-bold text-slate-400">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="p-8">
                      <div>
                        <p className="font-black text-slate-900">{order.profiles?.full_name || 'Usuario Desconocido'}</p>
                        <p className="text-xs text-slate-400 font-medium">{order.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="font-bold text-slate-600 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-8 font-black text-slate-900">
                      ${Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="p-8">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-8">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
