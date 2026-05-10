import React, { useState } from 'react';
import { 
  Download, FileText, PlusCircle, FileCheck, Trash, ChevronRight, UserCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { MedicalCertificate, View, Role } from '../types';

interface CertificatesListViewProps {
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string) => void;
  certificates: MedicalCertificate[];
  currentRole: Role;
  onDelete: (id: string) => void;
}

export function CertificatesListView({ 
  navigateTo, 
  certificates, 
  currentRole, 
  onDelete 
}: CertificatesListViewProps) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = certificates.map(c => ({
      Folio: c.id.substring(0, 8),
      Paciente: c.patientName,
      Medico: c.doctorName,
      Fecha: c.date,
      Estado_Fisico: c.physicalState
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificados");
    XLSX.writeFile(workbook, "Certificados_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Certificados - ViMedical", 14, 22);
    
    const tableData = certificates.map(c => [
      c.id.substring(0, 8),
      c.patientName,
      c.doctorName,
      c.date,
      (c.physicalState || '').substring(0, 30) + '...'
    ]);

    autoTable(doc, {
      head: [['Folio', 'Paciente', 'Médico', 'Fecha', 'Estado Físico']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Certificados_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredCertificates = certificates.filter(c => 
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Certificados Médicos</h2>
          <p className="text-slate-500 font-medium">Gestión de certificados emitidos por el personal médico.</p>
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
          {(currentRole === 'Administrador' || currentRole === 'Doctor') && (
            <button 
              onClick={() => navigateTo('new-certificate')}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all flex items-center gap-3"
            >
              <PlusCircle className="w-5 h-5" />
              Nuevo Certificado
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <FileCheck className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente o médico..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map(cert => (
          <div 
            key={cert.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('certificate-detail', undefined, undefined, undefined, cert.id)}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center">
                  <FileCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{cert.patientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(cert.createdAt).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <UserCircle className="w-4 h-4" />
                  <span className="truncate">Dr. {cert.doctorName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 line-clamp-2 italic">
                  "{cert.conclusions}"
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(cert.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('certificate-detail', undefined, undefined, undefined, cert.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
