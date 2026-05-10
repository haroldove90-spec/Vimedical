import React, { useState } from 'react';
import { Bell, Volume2, Mic, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { requestNotificationPermission, triggerFullNotification, playNotificationSound, speakMessage } from '../services/notificationService';

export function SettingsView() {
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
