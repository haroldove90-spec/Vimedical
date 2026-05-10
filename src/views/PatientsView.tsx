import React, { useState } from 'react';
import { 
  Download, FileText, Plus, Clock, Activity, Eye, Edit, Trash, ChevronRight 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-hot-toast';
import { Patient, Wound, View } from '../types';
import { ImageViewer } from '../components/ImageViewer';

interface PatientsViewProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  onDelete: (id: string) => void;
  wounds: Wound[];
}

export function PatientsView({ 
  navigateTo, 
  patients, 
  onDelete, 
  wounds 
}: PatientsViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const exportToExcel = () => {
    const data = patients.map(p => ({
      'ID': p.id.substring(0, 8),
      'Nombre': p.fullName,
      'F. Nacimiento': p.dateOfBirth,
      'Teléfono': p.phone,
      'Género': p.gender || 'N/A',
      'Dirección': p.address || 'N/A',
      'Ocupación': p.occupation || 'N/A',
      'Religión': p.religion || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
    XLSX.writeFile(workbook, `Pacientes_ViMedical_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Pacientes exportados correctamente');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Listado de Pacientes - ViMedical", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const tableData = patients.map(p => [
      p.fullName,
      p.dateOfBirth,
      p.phone,
      p.occupation || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Nombre', 'Fecha Nac.', 'Teléfono', 'Ocupación']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save("Pacientes_ViMedical.pdf");
    toast.success('PDF exportado correctamente');
  };

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">Gestión de Pacientes</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Registro y búsqueda de pacientes activos en el sistema.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex-1 sm:flex-none bg-red-500 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={() => navigateTo('new-patient')}
            className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-center"
          >
            <Plus className="w-4 h-4" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-4 shadow-sm flex items-center gap-3">
        <Activity className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pacientes por nombre o teléfono..." 
          className="flex-1 bg-transparent border-none outline-none font-medium text-slate-600 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id} 
            className="bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div onClick={() => navigateTo('patient-detail', patient.id)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="flex items-center gap-5 mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20">
                  {patient.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors">{patient.fullName}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{patient.occupation || 'Paciente'}</p>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className="flex items-center gap-3 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold text-slate-600">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('es-MX') : patient.dateOfBirth}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-bold text-slate-600">{patient.phone}</span>
                </div>
              </div>

              {/* Evidencias fotográficas (Miniaturas) */}
              {(() => {
                const patientWound = wounds.find(w => w.patientId === patient.id);
                if (patientWound && patientWound.initialPhotos && patientWound.initialPhotos.length > 0) {
                  return (
                    <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {patientWound.initialPhotos.slice(0, 4).map((photo, idx) => (
                        <div 
                          key={idx} 
                          className="relative group/img"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                          }}
                        >
                          <img 
                            src={photo} 
                            alt="Evidencia" 
                            className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm group-hover/img:scale-110 transition-transform cursor-zoom-in"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="pt-6 mt-6 flex flex-col gap-3 border-t border-slate-100 relative z-10">
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo('patient-detail', patient.id);
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Perfil
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Buscar la primera herida del paciente para iniciar curación
                    const patientWounds = wounds.filter(w => w.patientId === patient.id);
                    if (patientWounds.length > 0) {
                      navigateTo('new-treatment', patient.id, patientWounds[0].id);
                    } else {
                      navigateTo('new-assessment', patient.id);
                    }
                  }}
                  className="flex-1 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Curación
                </button>
              </div>
              <div className="flex justify-between items-center px-2">
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigateTo('clinical-history-detail', patient.id); }}
                    className="p-2 text-slate-300 hover:text-primary transition-all"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                    title="Eliminar"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div onClick={() => navigateTo('patient-detail', patient.id)} className="flex items-center gap-1 cursor-pointer group/link">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover/link:text-primary transition-colors">Expediente Completo</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover/link:text-primary group-hover/link:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ImageViewer 
        isOpen={selectedPhoto !== null} 
        imageUrl={selectedPhoto} 
        onClose={() => setSelectedPhoto(null)} 
      />
    </div>
  );
}
