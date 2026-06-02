import React, { useState } from 'react';
import { 
  ChevronRight, Download, FileText, UserPlus, X, Mail, Phone, Award, Activity, 
  CheckCircle, AlertTriangle, Trash2, Users, Edit3, Eye, EyeOff, RefreshCw, Lock 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { UserProfile, View } from '../types';
import { ImageViewer } from '../components/ImageViewer';

interface NursesManagementViewProps {
  nurses: UserProfile[];
  onBack: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export function NursesManagementView({ 
  nurses, 
  onBack, 
  onUpdateProfile, 
  onDeleteProfile 
}: NursesManagementViewProps) {
  const [isAddingNurse, setIsAddingNurse] = useState(false);
  const [isEditingNurse, setIsEditingNurse] = useState(false);
  const [editingNurse, setEditingNurse] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const generateSecurePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    
    // Ensure all criteria are present for extra security
    const ensureChar = (regex: RegExp, replaceChar: string) => {
      if (!regex.test(retVal)) {
        const index = Math.floor(Math.random() * length);
        retVal = retVal.substring(0, index) + replaceChar + retVal.substring(index + 1);
      }
    };
    
    ensureChar(/[a-z]/, "m");
    ensureChar(/[A-Z]/, "W");
    ensureChar(/[0-9]/, "9");
    ensureChar(/[!@#$]/, "$");

    setNewNurseData(prev => ({ ...prev, password: retVal }));
    setShowPassword(true);
    toast.success('¡Contraseña segura generada!');
  };

  const [newNurseData, setNewNurseData] = useState({
    fullName: '',
    password: '',
    email: '',
    phone: '',
    license: '',
    specialty: '',
    role: 'Enfermero' as 'Administrador' | 'Enfermero' | 'Doctor'
  });

  const [editNurseData, setEditNurseData] = useState({
    fullName: '',
    email: '',
    phone: '',
    license: '',
    specialty: '',
    role: 'Enfermero' as 'Administrador' | 'Enfermero' | 'Doctor'
  });

  const exportToExcel = () => {
    const data = nurses.map(n => ({
      'Nombre': n.fullName,
      'Email': n.email,
      'Teléfono': n.phone || 'N/A',
      'Cédula': n.license || 'N/A',
      'Especialidad': n.specialty || 'General',
      'Estatus': n.status === 'suspended' ? 'Suspendido' : 'Activo'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Personal");
    XLSX.writeFile(workbook, `Personal_ViMedical_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Lista de personal exportada a Excel');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("ViMedical - Gestión de Personal", 15, 20);
    
    const tableData = nurses.map(n => [
      n.fullName,
      n.email,
      n.phone || 'N/A',
      n.license || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Nombre', 'Email', 'Teléfono', 'Cédula']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`ViMedical_Personal_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Lista de personal exportada a PDF');
  };

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
          role: newNurseData.role,
          license: newNurseData.license,
          phone: newNurseData.phone,
          specialty: newNurseData.specialty
        })
      });

      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Error de comunicación con el servidor (${response.status}): ${responseText.substring(0, 160) || 'Respuesta vacía'}`);
      }

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Error al crear el perfil');
      }

      const profileData = result.profile;
      
      if (!profileData) {
        throw new Error('El servidor no devolvió los datos del perfil creado.');
      }

      const newNurse: UserProfile = {
        id: profileData.id,
        user_id: profileData.user_id,
        role: profileData.role || newNurseData.role,
        fullName: profileData.full_name,
        email: profileData.email,
        phone: profileData.phone,
        license: profileData.license,
        specialty: profileData.specialty,
        status: 'active'
      };

      onUpdateProfile(newNurse);
      
      setCreatedCredentials({ email: newNurseData.email, password: newNurseData.password });
      setIsAddingNurse(false);
      setNewNurseData({
        fullName: '',
        password: '',
        email: '',
        phone: '',
        license: '',
        specialty: '',
        role: 'Enfermero'
      });
      toast.success(`${newNurseData.role} registrado correctamente`);
    } catch (err: any) {
      console.error('Error adding nurse:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (nurse: UserProfile) => {
    setEditingNurse(nurse);
    setEditNurseData({
      fullName: nurse.fullName,
      email: nurse.email,
      phone: nurse.phone || '',
      license: nurse.license || '',
      specialty: nurse.specialty || '',
      role: (nurse.role as 'Administrador' | 'Enfermero' | 'Doctor')
    });
    setIsEditingNurse(true);
  };

  const handleUpdateNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNurse) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const updatedNurse: UserProfile = {
        ...editingNurse,
        fullName: editNurseData.fullName,
        email: editNurseData.email,
        phone: editNurseData.phone,
        license: editNurseData.license,
        specialty: editNurseData.specialty,
        role: editNurseData.role
      };

      await onUpdateProfile(updatedNurse);
      setIsEditingNurse(false);
      setEditingNurse(null);
      toast.success('Datos actualizados correctamente');
    } catch (err: any) {
      console.error('Error updating nurse:', err);
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
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Personal</h2>
          <p className="text-slate-500 font-medium">Administra el acceso y perfiles del personal administrativo y operativo.</p>
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
            onClick={() => setIsAddingNurse(true)}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all flex items-center gap-3"
          >
            <UserPlus className="w-5 h-5" />
            Registrar Personal
          </button>
        </div>
      </header>

      {createdCredentials && (
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-emerald-900">¡Personal registrado con éxito!</h4>
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
                <p className="text-slate-500 text-sm font-medium">Completa los datos para el nuevo integrante del personal.</p>
              </div>
              <button 
                onClick={() => setIsAddingNurse(false)} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-black"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddNurse} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}
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
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="text-[10px] font-black text-primary hover:text-indigo-600 uppercase tracking-wider flex items-center gap-1 transition-all bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-xl border border-slate-200"
                    >
                      <Lock className="w-3 h-3 text-secondary-dark" />
                      Generar clave segura
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      required
                      type={showPassword ? "text" : "password"}
                      value={newNurseData.password}
                      onChange={e => setNewNurseData({...newNurseData, password: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-12 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Clave de acceso"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      title={showPassword ? "Ocultar clave" : "Mostrar clave"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol / Acceso</label>
                  <select 
                    required
                    value={newNurseData.role}
                    onChange={e => setNewNurseData({...newNurseData, role: e.target.value as 'Administrador' | 'Enfermero' | 'Doctor'})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Enfermero">Enfermero (Operativo)</option>
                    <option value="Doctor">Médico (Especialista)</option>
                    <option value="Administrador">Administrador (Gestión)</option>
                  </select>
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
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all font-black"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all font-black flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="animate-spin mr-2">◌</span> : null}
                  {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingNurse && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">Editar Personal</h3>
                <p className="text-slate-500 text-sm font-medium">Modifica los datos del integrante del personal.</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditingNurse(false);
                  setEditingNurse(null);
                }} 
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-black"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateNurse} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input 
                    required
                    type="text"
                    value={editNurseData.fullName}
                    onChange={e => setEditNurseData({...editNurseData, fullName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input 
                    required
                    type="email"
                    value={editNurseData.email}
                    onChange={e => setEditNurseData({...editNurseData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                  <input 
                    type="tel"
                    value={editNurseData.phone}
                    onChange={e => setEditNurseData({...editNurseData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol / Acceso</label>
                  <select 
                    required
                    value={editNurseData.role}
                    onChange={e => setEditNurseData({...editNurseData, role: e.target.value as 'Administrador' | 'Enfermero' | 'Doctor'})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="Enfermero">Enfermero (Operativo)</option>
                    <option value="Doctor">Médico (Especialista)</option>
                    <option value="Administrador">Administrador (Gestión)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula Profesional</label>
                  <input 
                    type="text"
                    value={editNurseData.license}
                    onChange={e => setEditNurseData({...editNurseData, license: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidad / Área</label>
                  <input 
                    type="text"
                    value={editNurseData.specialty}
                    onChange={e => setEditNurseData({...editNurseData, specialty: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditingNurse(false);
                    setEditingNurse(null);
                  }}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all font-black"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all font-black flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <span className="animate-spin mr-2">◌</span> : null}
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Datos'}
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">@{nurse.username || nurse.email?.split('@')[0]}</p>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2 ${
                  nurse.role === 'Administrador' ? 'bg-indigo-100 text-indigo-600' : 
                  nurse.role === 'Doctor' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
                }`}>
                  {nurse.role === 'Doctor' ? 'Médico' : (nurse.role || 'Personal')}
                </span>
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
              
              {nurse.signatureUrl && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Firma Digital</p>
                  <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center border border-slate-100">
                    <img src={nurse.signatureUrl} alt="Firma" className="h-12 w-auto object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 gap-3">
              <button 
                onClick={() => startEditing(nurse)}
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Editar Datos
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  const newStatus = nurse.status === 'suspended' ? 'active' : 'suspended';
                  onUpdateProfile({ ...nurse, status: newStatus });
                  toast.success(`${nurse.role || 'Personal'} ${newStatus === 'suspended' ? 'suspendido' : 'activado'} correctamente`);
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
            <p className="text-slate-500 font-medium font-black uppercase tracking-widest text-xs text-slate-400">No hay personal registrado.</p>
          </div>
        )}
      </div>

      <ImageViewer 
        isOpen={selectedPhoto !== null} 
        imageUrl={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
      />
    </div>
  );
}
