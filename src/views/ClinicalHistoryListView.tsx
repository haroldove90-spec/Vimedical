import React, { useState } from 'react';
import { Download, FileText, Users, Clock, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Patient, View } from '../types';

interface ClinicalHistoryListViewProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
}

export function ClinicalHistoryListView({ navigateTo, patients }: ClinicalHistoryListViewProps) {
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = patients.map(p => ({
      'ID de Paciente': p.id.substring(0, 8),
      'Nombre Completo': p.fullName,
      'Teléfono': p.phone,
      'Fecha de Nacimiento': p.dateOfBirth,
      'Edad': new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear(),
      'Género': p.gender || 'N/A',
      'Estado Civil': p.maritalStatus || 'N/A',
      'Ocupación': p.occupation || 'N/A',
      'Dirección': p.address || 'N/A',
      'Religión': p.religion || 'N/A',
      'Escolaridad': p.educationLevel || 'N/A',
      'Herida Inicial': p.initialWoundPhoto ? 'Sí' : 'No',
      'Aviso Privacidad': p.privacyNoticeSigned ? `Firmado (${p.privacyNoticeDate})` : 'No',
      'Consentimiento': p.consentFormSigned ? `Firmado (${p.consentFormDate})` : 'No',
      'Antecedentes Familiares': p.familyHistory || 'Sin datos',
      'Antecedentes Patológicos': p.pathologicalHistory || 'Sin datos',
      'Antecedentes No Patológicos': p.nonPathologicalHistory || 'Sin datos'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historiales");
    XLSX.writeFile(workbook, `Historial_Clinico_ViMedical_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Historiales exportados correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("ViMedical - Historiales Clínicos", 15, 20);
    
    const tableData = patients.map(p => [
      p.fullName,
      p.phone,
      p.dateOfBirth,
      p.pathologicalHistory?.substring(0, 50) || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Nombre', 'Teléfono', 'Nacimiento', 'Antecedentes']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`ViMedical_Historiales_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado con identidad ViMedical');
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Historial Clínico</h2>
          <p className="text-slate-500 font-medium">Consulta y gestión de antecedentes de pacientes.</p>
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
        </div>
      </header>

      <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
        <Users className="w-6 h-6 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar paciente por nombre o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => navigateTo('clinical-history-detail', patient.id)}
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl group-hover:bg-secondary group-hover:text-primary transition-colors">
                {patient.fullName[0]}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">{patient.fullName}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{patient.phone}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Nacimiento: {patient.dateOfBirth}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 line-clamp-2">
                {patient.pathologicalHistory || 'Sin antecedentes registrados'}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
