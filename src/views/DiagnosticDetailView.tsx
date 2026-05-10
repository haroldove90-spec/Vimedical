import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Diagnostic, View } from '../types';
import { generateDiagnosticPDF } from '../services/pdfService';
import { toast } from 'react-hot-toast';

interface DiagnosticDetailViewProps {
  diagnosticId: string;
  navigateTo: (view: View) => void;
  diagnostics: Diagnostic[];
}

export function DiagnosticDetailView({ 
  diagnosticId, 
  navigateTo, 
  diagnostics 
}: DiagnosticDetailViewProps) {
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
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all font-sans"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20 font-sans"
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
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4 uppercase font-sans">Diagnóstico Electrónico</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-sans">Paciente</p>
              <p className="text-2xl font-black text-slate-900 font-sans">{diagnostic.patientName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-sans">Edad</p>
              <p className="text-2xl font-black text-slate-900 font-sans">{diagnostic.patientAge} años</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 font-sans">Resumen Clínico</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed font-sans">{diagnostic.clinicalSummary}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 font-sans">Diagnóstico</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-900 font-black text-lg font-sans">{diagnostic.diagnosis}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 font-sans">Plan de Tratamiento</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed font-sans">{diagnostic.treatmentPlan}</p>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 font-sans">Recomendaciones</h3>
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <p className="text-slate-700 font-medium leading-relaxed font-sans">{diagnostic.recommendations}</p>
              </div>
            </section>
          </div>

          <div className="pt-20 flex flex-col items-center">
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900 font-sans">{diagnostic.doctorName}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-sans">Cédula Profesional: {diagnostic.doctorLicense}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 font-sans">Firma del Médico Responsable</p>
            {diagnostic.signature && (
              <img src={diagnostic.signature} alt="Firma Médico" className="mt-4 h-20 object-contain" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
