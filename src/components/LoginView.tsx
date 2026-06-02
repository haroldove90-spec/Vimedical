import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Role, UserProfile } from '../types';

export function LoginView({ onLogin }: { onLogin: (role: Role, profile?: UserProfile) => void }) {
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

    // Timeout de seguridad de 30 segundos
    const timeoutId = setTimeout(() => {
      setIsSubmitting(current => {
        if (current) {
          console.warn('LoginView: Login timeout reached');
          setError('La verificación está tardando demasiado. Por favor, intenta de nuevo o verifica tu conexión.');
          return false;
        }
        return current;
      });
    }, 30000);

    try {
      console.log('LoginView: Calling signInWithPassword for', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        clearTimeout(timeoutId);
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
        console.log('LoginView: Login successful, navigating to dashboard...');
        
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        clearTimeout(timeoutId);

        if (profileErr) {
          console.error('LoginView: Profile fetch error:', profileErr);
        }

        if (profileData) {
          console.log('LoginView: Profile found, calling onLogin');
          let normalizedRole: Role = 'Enfermero';
          const dbRole = profileData.role?.toLowerCase();
          if (dbRole === 'administrador' || dbRole === 'admin') normalizedRole = 'Administrador';
          else if (dbRole === 'doctor' || dbRole === 'médico') normalizedRole = 'Doctor';
          else if (dbRole === 'coordinador' || dbRole?.includes('coordinador')) normalizedRole = 'Coordinador';

          const profile: UserProfile = {
            id: profileData.id,
            role: normalizedRole,
            fullName: profileData.full_name,
            email: profileData.email,
            phone: profileData.phone,
            license: profileData.license,
            status: profileData.status as 'active' | 'suspended'
          };
          onLogin(normalizedRole, profile);
        } else {
          console.warn('LoginView: Profile missing after login, attempting auto-creation');
          
          const { data: existing } = await supabase.from('profiles').select('id').eq('user_id', data.user.id).maybeSingle();
          
          let opResult;
          if (existing) {
            opResult = await supabase.from('profiles').update({
              full_name: data.user.user_metadata?.full_name || 'Usuario ViMedical',
              email: data.user.email,
              status: 'active'
            }).eq('user_id', data.user.id).select().maybeSingle();
          } else {
            opResult = await supabase.from('profiles').insert({
              user_id: data.user.id,
              full_name: data.user.user_metadata?.full_name || 'Usuario ViMedical',
              email: data.user.email,
              role: data.user.user_metadata?.role || 'Enfermero',
              status: 'active'
            }).select().maybeSingle();
          }

          const { data: newProfile, error: createError } = opResult;

          if (!createError && newProfile) {
            onLogin('Enfermero', {
              id: newProfile.id,
              role: 'Enfermero',
              fullName: newProfile.full_name,
              email: newProfile.email,
              status: 'active'
            });
          } else {
            setError('Tu cuenta existe pero no encontramos tu perfil clínico. Por favor intenta registrarte de nuevo o contacta a soporte.');
          }
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('LoginView: Unexpected error', err);
      setError('Error inesperado: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center">
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

          <div className="text-center mt-6 space-y-4">
            <p className="text-slate-500 text-xs font-medium">
              ¿Eres enfermero y no tienes cuenta?{' '}
              <button 
                type="button"
                onClick={() => (window as any).navigateToRegister?.()}
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
                  sessionStorage.clear();
                  window.location.href = '/';
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
