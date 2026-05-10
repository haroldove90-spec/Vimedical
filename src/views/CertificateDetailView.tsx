import React from 'react';
import { X, BarChart3, Download } from 'lucide-react';
import { MedicalCertificate, View } from '../types';
import { generateCertificatePDF } from '../services/pdfService';
import { toast } from 'react-hot-toast';

interface CertificateDetailViewProps {
  certificateId: string;
  navigateTo: (view: View) => void;
  certificates: MedicalCertificate[];
}

export function CertificateDetailView({ 
  certificateId, 
  navigateTo, 
  certificates 
}: CertificateDetailViewProps) {
  const certificate = certificates.find(c => c.id === certificateId);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    generateCertificatePDF(certificate as any);
    toast.success('PDF exportado correctamente');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('certificates')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Detalle del Certificado</h2>
            <p className="text-slate-500 font-medium">Visualiza y exporta el certificado médico.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Imprimir
          </button>
          <button 
            onClick={handleExportPDF}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-2xl shadow-slate-200/50 max-w-[800px] mx-auto print:shadow-none print:border-none print:p-0 print:rounded-none">
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6">
            <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-16 h-16 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#3C6B94]">VIMEDICAL</h1>
        </div>

        <div className="space-y-8 text-slate-800 leading-relaxed text-justify">
          <p className="text-sm">
            El Doctor <span className="font-bold">{certificate.doctorName}</span> legalmente autorizado por la Dirección General de Profesiones para ejercer la profesión de Médico Cirujano, Maestro en heridas por la Universidad Autónoma de México del Estado de Hidalgo y Universidad Panamericana, con cédula profesional {certificate.doctorLicense}.
          </p>

          <h2 className="text-center text-xl font-black tracking-widest uppercase mt-12 mb-8">CERTIFICA</h2>

          <p>
            Que habiendo practicado reconocimiento médico el día <span className="font-bold">{certificate.date}</span>, a <span className="font-bold">{certificate.patientName}</span>, de <span className="font-bold">{(certificate as any).patientAge}</span> años de edad, lo encontré:
          </p>

          <p>{(certificate as any).physicalState}</p>
          <p>{(certificate as any).woundDetails}</p>
          
          <p>
            Con tratamiento de: <span className="italic">{(certificate as any).treatment}</span>
          </p>

          <div className="grid grid-cols-1 gap-2 text-sm mt-8">
            <p><span className="font-bold">Campo visual:</span> {(certificate as any).visualStatus}</p>
            <p><span className="font-bold">Agudeza auditiva:</span> {(certificate as any).auditoryStatus}</p>
            <p><span className="font-bold">Aparato locomotor:</span> {(certificate as any).locomotorStatus}</p>
            <p><span className="font-bold">Examen neurológico:</span> {(certificate as any).neurologicalStatus}</p>
          </div>

          <div className="mt-12">
            <h3 className="font-black text-lg mb-4">CONCLUSIONES:</h3>
            <p className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
              {(certificate as any).conclusions}
            </p>
          </div>

          <div className="mt-24 flex flex-col items-center">
            {(certificate as any).signature && (
              <img src={(certificate as any).signature} alt="Firma" className="h-24 object-contain mb-4" />
            )}
            <div className="w-64 h-px bg-slate-300 mb-4" />
            <p className="font-black text-slate-900">Dr. {certificate.doctorName}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cédula: {certificate.doctorLicense}</p>
          </div>
        </div>

        <div className="mt-20 pt-12 border-t border-slate-100 flex justify-between items-end text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <div>
            <p>Agua potable 113 Col. Pri Chacón</p>
            <p>Mineral de la Reforma, Hgo.</p>
          </div>
          <div className="text-right">
            <p>admon.vipach@gmail.com</p>
            <p>771.285.40-46</p>
          </div>
        </div>
      </div>
    </div>
  );
}
