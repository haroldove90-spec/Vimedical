import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { TreatmentProposal, View } from '../types';

interface TreatmentProposalDetailViewProps {
  proposalId: string;
  navigateTo: (view: View) => void;
  proposals: TreatmentProposal[];
}

export function TreatmentProposalDetailView({ 
  proposalId, 
  navigateTo, 
  proposals 
}: TreatmentProposalDetailViewProps) {
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
            <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Propuesta #{proposal.id.substring(0, 8)}</p>
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Fecha de Emisión</p>
            <p className="font-black text-slate-900">{proposal.date}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-4 font-sans uppercase">PROPUESTA DE TRATAMIENTO</h2>
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
                <p className="text-xl font-black text-primary font-sans">{proposal.program}</p>
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
                <span className="text-3xl font-black text-primary font-sans">${proposal.investment.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm font-sans underline decoration-primary decoration-4 underline-offset-4">Condiciones de prestación de servicios</h3>
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
                  <p className="text-xs font-medium text-slate-600 font-sans">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col items-center">
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900 font-sans">Victor Ismael Medécigo Escudero</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-sans">Responsable Médico MD. | 3490622-7218923</p>
          </div>
        </div>
      </div>
    </div>
  );
}
