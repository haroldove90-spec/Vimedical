import React, { useState } from 'react';
import { Bell, Volume2, Mic, Activity, Database, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { requestNotificationPermission, triggerFullNotification, playNotificationSound, speakMessage } from '../services/notificationService';

export function SettingsView() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [copied, setCopied] = useState(false);

  const migrationSQL = `-- AGREGAR COLUMNAS PARA ADVERTENCIA DE PRIVACIDAD Y CONSENTIMIENTO INFORMADO EN TABLA DE PACIENTES
ALTER TABLE patients ADD COLUMN IF NOT EXISTS privacy_notice_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS privacy_notice_date TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS privacy_notice_signature TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS privacy_notice_type TEXT DEFAULT 'casa';

ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_form_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_form_date TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_form_signature TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consent_form_type TEXT DEFAULT 'casa';

ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS initial_photos TEXT[];
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registered_by TEXT;

-- ASEGURAR COLUMNAS EN LA TABLA DE PERFILES (PROFILES)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- COMPLEMENTO: CREAR TABLA DE ASISTENCIAS (ATTENDANCES) SI NO EXISTE
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT,
  nurse_id TEXT,
  nurse_name TEXT,
  status TEXT, -- 'check_in' | 'check_out'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  location TEXT,
  signature TEXT,
  signee_name TEXT,
  signee_type TEXT DEFAULT 'Paciente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para la tabla de asistencias
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla de asistencias
DROP POLICY IF EXISTS "Staff can manage attendances" ON attendances;
CREATE POLICY "Staff can manage attendances" ON attendances
  FOR ALL USING (auth.role() = 'authenticated');

-- Intentar registrar en Realtime
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE attendances; EXCEPTION WHEN others THEN END;
END $$;`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(migrationSQL);
    setCopied(true);
    toast.success('¡Consulta SQL copiada al portapapeles!');
    setTimeout(() => setCopied(false), 3000);
  };

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

        {/* Actualización / Migración de BD */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Database className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Soporte & Migración de Base de Datos</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  ¿Los consentimientos o firmas no se guardan tras recargar/sincronizar? Esto ocurre si tu tabla <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">patients</code> en Supabase carece de las columnas necesarias para almacenar las firmas electrónicas o el aviso de privacidad. 
                  Ejecuta este script en la sección <b>SQL Editor</b> de tu panel de Supabase para solucionarlo:
                </p>
              </div>

              <div className="relative rounded-2xl bg-slate-950 p-5 font-mono text-[11px] text-slate-300 border border-slate-800 leading-relaxed overflow-x-auto max-h-56">
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white rounded-xl transition-all border border-slate-700/50 flex items-center gap-1.5 font-sans text-[10px] font-black uppercase tracking-wider"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 text-slate-400" />
                      Copiar SQL
                    </>
                  )}
                </button>
                <pre className="pr-20">{migrationSQL}</pre>
              </div>
              
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/70 text-[11px] text-amber-800 font-bold leading-relaxed">
                Aviso: Ejecutar este script únicamente agrega los campos nuevos e inexistentes de forma segura. Tus registros y pacientes actuales no sufrirán ninguna modificación ni pérdida de información.
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
