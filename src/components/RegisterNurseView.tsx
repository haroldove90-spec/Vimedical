import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Role, UserProfile } from '../types';

interface RegisterNurseViewProps {
  onBack: () => void;
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
  onLogin: (role: Role, profile?: UserProfile) => void;
}

export function RegisterNurseView({ onBack, sendNotification, onLogin }: RegisterNurseViewProps) {
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
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password.trim(),
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'Enfermero',
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') || 
            signUpError.message.toLowerCase().includes('already in use') || 
            signUpError.message.toLowerCase().includes('already been registered')) {
          throw new Error('Este correo ya está registrado. Por favor, intenta iniciar sesión.');
        }
        throw new Error(signUpError.message);
      }

      if (signUpData.user) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', signUpData.user.id)
          .maybeSingle();

        let profileError;
        if (existing) {
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: formData.fullName.trim(),
              email: formData.email.trim(),
              license: formData.license.trim(),
              status: 'active'
            })
            .eq('user_id', signUpData.user.id);
          profileError = error;
        } else {
          const { error } = await supabase
            .from('profiles')
            .insert({
              user_id: signUpData.user.id,
              full_name: formData.fullName.trim(),
              email: formData.email.trim(),
              role: 'Enfermero',
              license: formData.license.trim(),
              status: 'active'
            });
          profileError = error;
        }
        
        if (profileError) {
          throw new Error('Tu cuenta se creó pero hubo un error al procesar tu perfil: ' + profileError.message);
        }
      } else {
        throw new Error('No se pudo obtener la información del usuario tras el registro.');
      }

      try {
        await sendNotification(
          'Nuevo Registro de Enfermería',
          `${formData.fullName} se ha registrado en el sistema.`,
          `Atención Administrador: Un nuevo enfermero, ${formData.fullName}, se ha registrado en el sistema.`,
          'Administrador'
        );
      } catch (notifyErr) {
        console.warn('RegisterNurseView: Error sending notification:', notifyErr);
      }

      toast.success('¡Registro completado con éxito!');
      
      if (signUpData.user) {
        onLogin('Enfermero', {
          id: signUpData.user.id,
          role: 'Enfermero',
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          license: formData.license.trim(),
          status: 'active'
        });
      } else {
        window.history.pushState({}, '', '/');
        onBack();
      }
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado durante el registro.');
      toast.error(err.message || 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center">
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
                className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
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
                className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                placeholder="Número de cédula"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner"
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
                  className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 focus:bg-white transition-all shadow-inner pr-12"
                  placeholder="••••••••"
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
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  onBack();
                }}
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
            
            <div className="pt-4 border-t border-slate-100 text-center">
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
