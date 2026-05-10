import React, { useState } from 'react';
import { 
  Download, FileText, PlusCircle, PenTool, Trash, ChevronRight, UserCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Diagnostic, View, Role } from '../types';

interface DiagnosticsListViewProps {
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string, diagId?: string) => void;
  diagnostics: Diagnostic[];
  currentRole: Role;
  onDelete: (id: string) => void;
}

export function DiagnosticsListView({ 
  navigateTo, 
  diagnostics, 
  currentRole, 
  onDelete 
}: DiagnosticsListViewProps) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = diagnostics.map(d => ({
      Folio: d.id.substring(0, 8),
      Paciente: d.patientName,
      Medico: d.doctorName,
      Fecha: d.date,
      Diagnostico: d.diagnosis
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Diagnosticos");
    XLSX.writeFile(workbook, "Diagnosticos_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Diagnósticos - ViMedical", 14, 22);
    
    const tableData = diagnostics.map(d => [
      d.id.substring(0, 8),
      d.patientName,
      d.doctorName,
      d.date,
      (d.diagnosis || '').substring(0, 30) + '...'
    ]);

    autoTable(doc, {
      head: [['Folio', 'Paciente', 'Médico', 'Fecha', 'Diagnóstico']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Diagnosticos_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredDiagnostics = diagnostics.filter(d => 
    d.patientName.toLowerCase().includes(search.toLowerCase()) ||
    d.doctorName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Diagnósticos Médicos</h2>
          <p className="text-slate-500 font-medium">Historial de diagnósticos y valoraciones clínicas.</p>
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
              onClick={() => navigateTo('new-diagnostic')}
              className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all flex items-center gap-3"
            >
              <PlusCircle className="w-5 h-5" />
              Nuevo Diagnóstico
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <PenTool className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente o médico..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiagnostics.map(diag => (
          <div 
            key={diag.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('diagnostic-detail', undefined, undefined, undefined, undefined, undefined, diag.id)}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-primary flex items-center justify-center">
                  <PenTool className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{diag.patientName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(diag.createdAt).toLocaleString('es-MX', {
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
                  <span className="truncate">Dr. {diag.doctorName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 line-clamp-2 italic">
                  "{diag.diagnosis}"
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(diag.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('diagnostic-detail', undefined, undefined, undefined, undefined, undefined, diag.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
