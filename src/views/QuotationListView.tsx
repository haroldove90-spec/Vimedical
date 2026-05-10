import React, { useState } from 'react';
import { 
  Download, FileText, PlusCircle, Clock, CheckCircle, ChevronRight, Trash, Search 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Quotation, View, Role } from '../types';

interface QuotationListViewProps {
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string) => void;
  quotations: Quotation[];
  currentRole: Role;
  onDelete: (id: string) => void;
}

export function QuotationListView({ 
  navigateTo, 
  quotations, 
  currentRole, 
  onDelete 
}: QuotationListViewProps) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = quotations.map(q => ({
      Folio: q.id.substring(0, 8),
      Paciente: q.patientName,
      Fecha: q.createdAt,
      Total: q.totalAmount,
      Estado: q.status
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizaciones");
    XLSX.writeFile(workbook, "Cotizaciones_ViMedical.xlsx");
    toast.success('Excel exportado correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Cotizaciones - ViMedical", 14, 22);
    
    const tableData = quotations.map(q => [
      q.id.substring(0, 8),
      q.patientName,
      new Date(q.createdAt).toLocaleDateString(),
      `$${q.totalAmount.toLocaleString()}`,
      q.status
    ]);

    autoTable(doc, {
      head: [['Folio', 'Paciente', 'Fecha', 'Total', 'Estado']],
      body: tableData,
      startY: 30,
      theme: 'grid'
    });

    doc.save("Cotizaciones_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredQuotations = quotations.filter(q => 
    q.patientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Cotizaciones</h2>
          <p className="text-slate-500 font-medium text-lg">Historial de presupuestos y servicios.</p>
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
            onClick={() => navigateTo('new-quotation')}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-[#CBB882] transition-all flex items-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            Nueva Cotización
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Search className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por paciente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuotations.map(quote => (
          <div 
            key={quote.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div onClick={() => navigateTo('quotation-detail', undefined, undefined, quote.id)}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center font-black">
                    {quote.patientName[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{quote.patientName}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(quote.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`p-2 rounded-xl ${quote.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {quote.status === 'accepted' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Folio</span>
                  <span className="font-bold text-slate-900">#{quote.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center text-lg pt-4 border-t border-slate-100">
                  <span className="text-slate-500 font-black uppercase tracking-widest text-xs">Total</span>
                  <span className="font-black text-primary">${quote.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center">
              {currentRole === 'Administrador' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(quote.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash className="w-4 h-4" />
                </button>
              )}
              <div onClick={() => navigateTo('quotation-detail', undefined, undefined, quote.id)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
