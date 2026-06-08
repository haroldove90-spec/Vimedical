import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Ruler, Sparkles, Maximize, Camera, Layers, Activity, 
  ArrowLeft, CheckCircle2, ShieldAlert, Cpu
} from 'lucide-react';

interface WoundMeasurementViewProps {
  onBack: () => void;
}

export function WoundMeasurementView({ onBack }: WoundMeasurementViewProps) {
  // Mock interactive control for caliper simulator
  const [point1, setPoint1] = useState({ x: 30, y: 45 });
  const [point2, setPoint2] = useState({ x: 70, y: 55 });
  const [draggingPoint, setDraggingPoint] = useState<1 | 2 | null>(null);

  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const distancePx = Math.sqrt(dx * dx + dy * dy);
  const distanceCm = (distancePx * 0.18).toFixed(1);
  const mockArea = (parseFloat(distanceCm) * parseFloat(distanceCm) * 0.65).toFixed(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (draggingPoint === 1) {
      setPoint1({ x, y });
    } else {
      setPoint2({ x, y });
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] mb-4 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Tablero
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Medición Digital de Heridas</h1>
            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse-subtle shrink-0">
              Próximamente
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">Reconstrucción fotogramétrica 3D, profundidad y estimación automática de área de regeneración tisular.</p>
        </div>
      </div>

      {/* Main Info Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-primary to-slate-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <Sparkles className="w-4 h-4 text-secondary-light" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Módulo en Desarrollo Clínico</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
            Medición de heridas de nivel profesional con la cámara de tu celular.
          </h2>
          
          <p className="text-slate-200 leading-relaxed font-medium text-sm md:text-base">
            Estamos integrando un revolucionario motor de análisis de imágenes médicas con IA. Los enfermeros podrán capturar una fotografía del lecho de la úlcera y el sistema calculará automáticamente el diámetro, perímetro, volumen, profundidad y porcentaje de tejido de granulación de forma instantánea y segura.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-3">
              <Ruler className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Caliper Digital</h4>
                <p className="text-[11px] text-slate-300 font-medium">Marcado interactivo con regla de calibridad física.</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-3">
              <Layers className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">Análisis 3D</h4>
                <p className="text-[11px] text-slate-300 font-medium font-sans">Estimación de profundidad y profundidad media de bordes.</p>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex gap-3">
              <Activity className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Porcentaje Tisular</h4>
                <p className="text-[11px] text-slate-300 font-medium">Diferenciación exacta entre tejido esfacelado, necrótico y sano.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Simulator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Interactive Playground */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" /> Calibrador Conceptual Interactivo
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Prueba cómo funcionará el trazado de diámetros principales en la previsualización.</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2.5 py-1 rounded-xl border border-slate-200">
              SIMULACIÓN
            </span>
          </div>

          {/* Interactive Screen Container */}
          <div 
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="aspect-video relative rounded-[2rem] bg-slate-900 border border-slate-800 overflow-hidden select-none cursor-crosshair group shadow-inner"
          >
            {/* Background Texture mock camera image representing a wound with clean visual representation */}
            <div className="absolute inset-0 opacity-40 bg-radial-gradient from-emerald-500/10 via-slate-950 to-slate-950 pointer-events-none" />
            
            {/* Grid line representation */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10 pointer-events-none">
              {Array.from({ length: 72 }).map((_, i) => (
                <div key={i} className="border-r border-b border-white" />
              ))}
            </div>

            {/* Target Ring mockup silhouette */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Silhouette outline */}
              <ellipse 
                cx="50%" 
                cy="50%" 
                rx="25%" 
                ry="18%" 
                fill="rgba(239, 68, 68, 0.08)" 
                stroke="rgba(239, 68, 68, 0.35)" 
                strokeWidth="2" 
                strokeDasharray="4 4"
              />
              <path 
                d="M 50% 10% L 50% 90% M 10% 50% L 90% 50%" 
                stroke="rgba(255, 255, 255, 0.1)" 
                strokeWidth="1"
              />
              {/* Line between points */}
              <line 
                x1={`${point1.x}%`} 
                y1={`${point1.y}%`} 
                x2={`${point2.x}%`} 
                y2={`${point2.y}%`} 
                stroke="#CBB882" 
                strokeWidth="3" 
                className="opacity-95"
              />
              {/* Center text badge anchor */}
              <g transform={`translate(${(point1.x + point2.x)/2}%, ${(point1.y + point2.y)/2}%)`}>
                <rect x="-35" y="-12" width="70" height="24" rx="8" fill="#1e1b4b" stroke="#CBB882" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fill="#CBB882" fontSize="10" fontWeight="900">{distanceCm} cm</text>
              </g>
            </svg>

            {/* Draggable Point 1 */}
            <div 
              style={{ left: `${point1.x}%`, top: `${point1.y}%` }}
              onMouseDown={() => setDraggingPoint(1)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-20 ${draggingPoint === 1 ? 'ring-4 ring-indigo-500/35' : ''}`}
            >
              <div className="w-2.5 h-2.5 bg-secondary-light rounded-full" />
            </div>

            {/* Draggable Point 2 */}
            <div 
              style={{ left: `${point2.x}%`, top: `${point2.y}%` }}
              onMouseDown={() => setDraggingPoint(2)}
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-20 ${draggingPoint === 2 ? 'ring-4 ring-indigo-500/35' : ''}`}
            >
              <div className="w-2.5 h-2.5 bg-secondary-light rounded-full" />
            </div>

            {/* Guidance Badge overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-secondary-light animate-pulse" />
              <p className="text-[10px] text-white font-bold uppercase tracking-wider">Alineación del Caliper Automática</p>
            </div>
            
            <div className="absolute top-4 right-4 bg-emerald-500/90 text-white rounded-xl px-3 py-1 text-[9px] font-black uppercase tracking-wider">
              Enfoque Optimo
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-semibold mt-4 text-center italic">
            *Arrastra los extremos de color azul para probar la simulación interactiva antes del lanzamiento real.*
          </p>
        </div>

        {/* Right Info Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="text-lg font-black text-slate-900">Métricas Estimuladas</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                    D
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Diámetro Longitudinal</h5>
                    <p className="text-[10px] font-bold text-slate-400">Distancia lineal entre puntos de anclaje</p>
                  </div>
                </div>
                <p className="text-lg font-black text-primary">{distanceCm} cm</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                    A
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Área de Superficie</h5>
                    <p className="text-[10px] font-bold text-slate-400">Estimación planimétrica elíptica</p>
                  </div>
                </div>
                <p className="text-lg font-black text-primary">{mockArea} cm²</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-primary font-black text-sm">
                    P
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider font-sans">Profundidad</h5>
                    <p className="text-[10px] font-bold text-slate-400">Estimación por mapeo de sombras</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">Requiere 3D Scan</span>
                  <p className="text-xs font-bold text-slate-400">--- mm</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="bg-amber-50 border border-amber-200/75 rounded-2xl p-4 flex gap-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold space-y-1">
                  <p className="font-black">Requisito de Dispositivo:</p>
                  <p className="text-amber-800">Esta funcionalidad utilizará la API `getUserMedia()`, habilitando la corrección por giroscopio del dispositivo y un algoritmo de compensación de perspectiva esférica para asegurar exactitud clínica del 98%.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
