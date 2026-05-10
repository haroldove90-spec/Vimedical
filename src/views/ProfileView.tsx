import React, { useState } from 'react';
import { ChevronRight, Camera, UserCircle, RefreshCw, PenTool, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import SignatureCanvas from 'react-signature-canvas';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
  onBack: () => void;
}

export function ProfileView({ profile, onUpdate, onBack }: ProfileViewProps) {
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
        const fileName = `profiles/${formData.user_id || formData.id || 'temp'}_${Date.now()}.png`;
        const url = await storageService.uploadFile('photos', fileName, file);
        if (url) {
          setFormData({ ...formData, photoUrl: url });
          toast.success('Foto de perfil lista para guardar');
        }
      } catch (error) {
        console.error('Error uploading profile photo:', error);
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
                  value={formData.bio ?? ''}
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
                  value={formData.fullName ?? ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  disabled={!isEditing}
                  value={formData.email ?? ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={formData.phone ?? ''}
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
                  value={formData.license ?? ''}
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
                    value={formData.specialty ?? ''}
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
                  value={formData.username ?? ''}
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
                    value={formData.password ?? ''}
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
