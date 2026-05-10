import React, { useState } from 'react';
import { 
  Download, FileText, PlusCircle, Users, Trash, ChevronRight 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { TreatmentProposal, View, Role } from '../types';

interface TreatmentProposalsListViewProps {
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string, cId?: string, propId?: string) => void;
  proposals: TreatmentProposal[];
  currentRole: Role;
  onDelete: (id: string) => void;
}

export function TreatmentProposalsListView({ 
  navigateTo, 
  proposals, 
  currentRole, 
  onDelete 
}: TreatmentProposalsListViewProps) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = proposals.map(p => ({
      Folio: p.id.substring(0, 8),
      Paciente: p.patientName,
      Programa: p.program,
      Inversion: p.investment,
      Fecha: p.date
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Propuestas");
    XLSX.writeFile(workbook, "Propuestas_Tratamiento_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Propuestas de Tratamiento - ViMedical", 14, 22);
    
    const tableData = proposals.map(p => [
      p.id.substring(0, 8),
      p.patientName,
      p.program,
      `$${p.investment.toLocaleString()}`,
      p.date
    ]);

    autoTable(doc, {
      head: [['Folio', 'Paciente', 'Programa', 'Inversión', 'Fecha']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Propuestas_Tratamiento_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredProposals = proposals.filter(p => 
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Propuestas de Tratamiento</h2>
          <p className="text-slate-500 font-medium text-lg">Gestión de planes de cuidados en casa e inversión.</p>
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
            onClick={() => navigateTo('new-treatment-proposal')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Nueva Propuesta
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Users className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProposals.map(proposal => (
          <div 
            key={proposal.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('treatment-proposal-detail', undefined, undefined, undefined, undefined, proposal.id)}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center font-black">
                    {proposal.patientName[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{proposal.patientName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(proposal.createdAt).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  proposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                  proposal.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {proposal.status}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Programa</span>
                  <span className="font-bold text-slate-900">{proposal.program}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Curaciones</span>
                  <span className="font-bold text-slate-900">{proposal.numCurations}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-4 border-t border-slate-100">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Inversión</span>
                  <span className="font-black text-primary">${proposal.investment.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(proposal.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('treatment-proposal-detail', undefined, undefined, undefined, undefined, proposal.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
