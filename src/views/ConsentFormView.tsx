import React, { useState, useRef, useEffect } from 'react';
import { FileText, CheckSquare, X, Eraser, Check, RotateCcw, Download } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { View, Patient } from '../types';
import { toast } from 'react-hot-toast';
import { generateConsentFormPDF } from '../services/pdfService';
import { trimCanvas } from '../utils/canvasHelper';

interface ConsentFormViewProps {
  patientId: string;
  navigateTo: (view: View, pId?: string) => void;
  onSaveSignature: (pId: string, signature: string, type: 'privacy' | 'consent') => Promise<void>;
  patient?: Patient;
}

export function ConsentFormView({ 
  patientId, 
  navigateTo, 
  onSaveSignature,
  patient
}: ConsentFormViewProps) {
  const [accepted, setAccepted] = useState(patient?.consentFormSigned || false);
  const [localSigned, setLocalSigned] = useState(patient?.consentFormSigned || false);
  const [localSignature, setLocalSignature] = useState(patient?.consentFormSignature || '');
  const [localDate, setLocalDate] = useState(patient?.consentFormDate || '');
  const [isReSigning, setIsReSigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };
  
  const resizeCanvas = () => {
    if (sigCanvas.current && containerRef.current) {
      const canvas = sigCanvas.current.getCanvas();
      const container = containerRef.current;
      
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
      }
      sigCanvas.current.clear();
    }
  };

  useEffect(() => {
    // Only resize if signature canvas is rendered (not signed or in re-signing mode)
    if (!localSigned || isReSigning) {
      window.addEventListener('resize', resizeCanvas);
      const timer = setTimeout(resizeCanvas, 300);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        clearTimeout(timer);
      };
    }
  }, [localSigned, isReSigning]);

  useEffect(() => {
    if (patient && !isReSigning) {
      if (patient.consentFormSigned) {
        setLocalSigned(true);
        setAccepted(true);
        if (patient.consentFormSignature) setLocalSignature(patient.consentFormSignature);
        if (patient.consentFormDate) setLocalDate(patient.consentFormDate);
      }
    }
  }, [patient?.consentFormSigned, patient?.consentFormSignature, patient?.consentFormDate, isReSigning]);

  const handleSaveSignature = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!accepted) {
      toast.error('Debe aceptar de conformidad los términos antes de proceder a la firma.');
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Por favor, dibuje su firma digital en el recuadro antes de guardar.');
      return;
    }

    const rawCanvas = sigCanvas.current.getCanvas();
    const trimmedCanvas = rawCanvas ? trimCanvas(rawCanvas) : null;
    let signature = '';
    
    if (trimmedCanvas) {
      // Create offscreen canvas to paint white background under signature for high contrast and compatibility in PDFs without transparent rendering glitches
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = trimmedCanvas.width;
      offscreenCanvas.height = trimmedCanvas.height;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        ctx.drawImage(trimmedCanvas, 0, 0);
        signature = offscreenCanvas.toDataURL('image/png');
      } else {
        signature = trimmedCanvas.toDataURL('image/png');
      }
    }
    
    setIsSaving(true);
    try {
      await onSaveSignature(patientId, signature, 'consent');
      toast.success('Consentimiento informado firmado y guardado correctamente.');
      setLocalSigned(true);
      setLocalSignature(signature);
      setLocalDate(new Date().toISOString());
      setIsReSigning(false);
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error('Ocurrió un error al intentar guardar la firma.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (patient) {
      const patientForPdf: Patient = {
        ...patient,
        consentFormSigned: localSigned,
        consentFormSignature: localSignature,
        consentFormDate: localDate,
      };
      generateConsentFormPDF(patientForPdf);
      toast.success('PDF descargado con éxito.');
    }
  };

  const hasSigned = localSigned && !isReSigning;
  const displayYMD = localDate 
    ? new Date(localDate).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'No registrada';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button 
          type="button"
          onClick={() => navigateTo('patient-detail', patientId)} 
          className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Consentimiento Informado</h2>
          <p className="text-slate-500 font-medium">
            Paciente: <span className="text-primary font-bold">{patient?.fullName || 'Carga técnica...'}</span>
          </p>
        </div>
      </header>

      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-xl shadow-slate-200/50 space-y-8">
        <div className="flex items-center justify-between py-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Autorización de Atención Médica y de Enfermería</h3>
          </div>
          {localSigned && (
            <button 
              type="button"
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              PDF Firmado
            </button>
          )}
        </div>

        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-6 text-justify">
          <p>
            Por medio de la presente, el paciente o su representante legal de manera voluntaria e informada, otorga su consentimiento expreso a ViMedical y su personal calificado (enfermeros especialistas y médicos) para realizar las maniobras de valoración, diagnóstico y procedimientos terapéuticos necesarios para el adecuado cuidado de sus heridas y lesiones cutáneas.
          </p>
          <p>
            <span className="font-bold text-slate-900">Alcance de Procedimientos:</span> Esto abarca la limpieza profunda de heridas, debridación enzimática, autolítica o mecánica de tejidos no viables, toma de cultivos, aplicación de apósitos especializados avanzados, vendajes de compresión y toma de registros fotográficos destinados estrictamente al expediente clínico confidencial para el monitoreo biológico de cicatrización.
          </p>
          <p>
            <span className="font-bold text-slate-900">Riesgos Conocidos:</span> Se me ha instruido que los tratamientos sugeridos pueden conllevar riesgos colaterales inherentes como dolor localizado menor, ardor transitorio, reacciones dérmicas de hipersensibilidad a los agentes o insumos colocados, o sangrado controlable localmente. Entiendo que la eficacia cicatrizal depende también del manejo de mis patologías de base y apego a indicaciones.
          </p>
          <p>
            <span className="font-bold text-slate-900">Derechos del Titular:</span> Se me informa que el consentimiento puede revocarse voluntariamente de manera escrita en cualquier momento sin afectar la ética de tratamientos posteriores.
          </p>
          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/70 italic text-indigo-950 font-semibold">
            "Doy mi consentimiento libre, espontáneo e informado para recibir atención de enfermería avanzada clínica."
          </div>
        </div>

        {hasSigned ? (
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <div className="bg-emerald-50/70 border border-emerald-100/70 rounded-[2rem] p-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 font-black" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-emerald-950">Documento Firmado Electrónicamente</h4>
                <p className="text-sm text-emerald-800 font-bold">
                  La firma digital ha sido capturada y consolidada de forma segura en nuestro servidor.
                </p>
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-widest mt-2 block">
                  Registrado el: <span className="text-slate-700 font-black">{displayYMD}</span>
                </p>
              </div>

              <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-200/60 shadow-inner flex flex-col items-center justify-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Digital del Paciente</p>
                <img 
                  src={localSignature} 
                  alt="Firma Digital Consentimiento" 
                  className="max-h-24 object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReSigning(true)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Volver a Firmar
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-[2] py-4 bg-primary text-white hover:bg-primary-dark rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar en PDF de Alta Resolución
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <label className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-primary/20 cursor-pointer transition-all group">
              <input 
                type="checkbox" 
                checked={accepted} 
                onChange={e => setAccepted(e.target.checked)}
                className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-slate-300" 
              />
              <span className="font-extrabold text-slate-700 group-hover:text-primary transition-colors text-sm">
                Acepto de conformidad los términos descritos y otorgo mi consentimiento informado clínico.
              </span>
            </label>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Firma Digital del Paciente (Dibuje abajo):
                </label>
                <button 
                  type="button" 
                  onClick={clear}
                  className="text-[9px] font-black uppercase text-slate-400 hover:text-red-500 tracking-wider flex items-center gap-1 transition-colors"
                  disabled={!accepted}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Limpiar Recuadro
                </button>
              </div>

              <div 
                ref={containerRef}
                className={`w-full h-64 rounded-3xl border-2 border-dashed relative overflow-hidden transition-all duration-300 ${
                  accepted 
                    ? 'bg-slate-50 border-slate-300 shadow-sm' 
                    : 'bg-slate-100/50 border-slate-200 opacity-65 cursor-not-allowed'
                }`}
              >
                {!accepted && (
                  <div className="absolute inset-0 bg-slate-100/40 backdrop-blur-[1px] flex items-center justify-center z-10 p-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white/90 px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                      Debe marcar la casilla de conformidad primero
                    </p>
                  </div>
                )}
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#0f172a"
                  canvasProps={{
                    className: "w-full h-full cursor-crosshair"
                  }}
                />
              </div>
            </div>

            <button 
              type="button"
              disabled={!accepted || isSaving}
              onClick={handleSaveSignature}
              className="w-full bg-secondary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-secondary/35 hover:scale-[1.01] active:scale-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando Firma en Base de Datos...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-5 h-5" />
                  <span>Confirmar & Guardar Consentimiento Firmado</span>
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
