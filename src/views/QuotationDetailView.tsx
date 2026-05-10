import React from 'react';
import { Download, BarChart3, X } from 'lucide-react';
import { Quotation, View } from '../types';
import { toast } from 'react-hot-toast';

interface QuotationDetailViewProps {
  quotationId: string;
  navigateTo: (view: View) => void;
  quotations: Quotation[];
}

export function QuotationDetailView({ 
  quotationId, 
  navigateTo, 
  quotations 
}: QuotationDetailViewProps) {
  const quotation = quotations.find(q => q.id === quotationId);

  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('quotations')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Detalle de Cotización</h2>
            <p className="text-slate-500 font-medium">#{quotation.id.substring(0, 8).toUpperCase()}</p>
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
            onClick={() => toast.success('Exportando...')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-2xl shadow-slate-200/50 print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start mb-16">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center">
              <img src="https://appdesign.appdesignproyectos.com/vimedical.png" alt="ViMedical" className="w-10 h-10 object-contain mix-blend-multiply" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-[#3C6B94]">VIMEDICAL</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Centro de Atención a Heridas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
            <p className="font-black text-slate-900">{new Date(quotation.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-16">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Para el Paciente</p>
            <p className="text-2xl font-black text-slate-900">{quotation.patientName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Folio de Cotización</p>
            <p className="text-2xl font-black text-primary">#{quotation.id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <table className="w-full mb-16">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
              <th className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Cant.</th>
              <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Unit.</th>
              <th className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {quotation.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-6 font-bold text-slate-800">{item.description}</td>
                <td className="py-6 text-center font-bold text-slate-600">{item.quantity}</td>
                <td className="py-6 text-right font-bold text-slate-600">${item.unitCost.toLocaleString()}</td>
                <td className="py-6 text-right font-black text-slate-900">${item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-start pt-12 border-t border-slate-100">
          <div className="max-w-md">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</p>
            <p className="text-sm text-slate-500 leading-relaxed italic">{quotation.notes || "No hay notas adicionales."}</p>
          </div>
          <div className="text-right min-w-[200px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Inversión</p>
            <p className="text-5xl font-black text-primary">${quotation.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-24 pt-12 border-t border-slate-50 text-[10px] text-slate-400 font-bold flex justify-between items-end uppercase tracking-widest">
          <div>
            <p>ViMedical - Especialistas en Heridas</p>
            <p>Cédula: 3490622-7218923</p>
          </div>
          <p>Aguascalientes, México</p>
        </div>
      </div>
    </div>
  );
}
