import React, { useState } from 'react';
import { 
  PlusCircle, Trash, Save, X, ChevronRight, Calculator, UserPlus 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Patient, Quotation, QuotationItem, View } from '../types';

interface NewQuotationViewProps {
  navigateTo: (view: View, pId?: string, wId?: string, qId?: string) => void;
  patients: Patient[];
  onSave: (q: Quotation) => void;
}

export function NewQuotationView({ 
  navigateTo, 
  patients, 
  onSave 
}: NewQuotationViewProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Partial<QuotationItem>[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitCost: 0, total: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitCost: 0, total: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          const qty = field === 'quantity' ? value : item.quantity || 0;
          const cost = field === 'unitCost' ? value : item.unitCost || 0;
          newItem.total = qty * cost;
        }
        return newItem;
      }
      return item;
    }));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) {
      toast.error('Por favor seleccione un paciente');
      return;
    }

    if (items.some(i => !i.description || !i.unitCost)) {
      toast.error('Complete todos los campos de los conceptos');
      return;
    }

    const newQuotation: Quotation = {
      id: crypto.randomUUID(),
      patientId: selectedPatientId,
      patientName: patient.fullName,
      createdAt: new Date().toISOString(),
      items: items as QuotationItem[],
      totalAmount,
      status: 'pending',
      notes
    };

    onSave(newQuotation);
    toast.success('Cotización generada correctamente');
    navigateTo('quotations');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <header className="flex items-center gap-4">
        <button onClick={() => navigateTo('quotations')} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all">
          <X className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Nueva Cotización</h2>
          <p className="text-slate-500 font-medium">Crea un presupuesto detallado para un paciente.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <UserPlus className="w-4 h-4" />
            </div>
            Selección de Paciente
          </h3>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Paciente *</label>
            <select 
              required 
              value={selectedPatientId} 
              onChange={e => setSelectedPatientId(e.target.value)} 
              className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50"
            >
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Calculator className="w-4 h-4" />
              </div>
              Conceptos de la Cotización
            </h3>
            <button 
              type="button" 
              onClick={addItem}
              className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-all"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100 items-end animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
                  <input 
                    type="text" 
                    required 
                    value={item.description} 
                    onChange={e => updateItem(item.id!, 'description', e.target.value)} 
                    placeholder="Ej. Curación simple..."
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none bg-white font-medium" 
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cant.</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={item.quantity} 
                    onChange={e => updateItem(item.id!, 'quantity', parseInt(e.target.value))} 
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none bg-white font-medium text-center" 
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Costo Unit.</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={item.unitCost} 
                    onChange={e => updateItem(item.id!, 'unitCost', parseFloat(e.target.value))} 
                    className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none bg-white font-medium text-center" 
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subtotal</label>
                  <div className="p-3 font-black text-slate-900 border border-transparent">
                    ${(item.total || 0).toLocaleString()}
                  </div>
                </div>
                <div className="col-span-1 flex justify-end pb-3">
                  <button 
                    type="button" 
                    onClick={() => removeItem(item.id!)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas Adicionales</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows={2}
                placeholder="Notas que el cliente verá en la cotización..."
                className="w-full border border-slate-200 rounded-2xl p-4 font-medium focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 transition-all resize-none"
              ></textarea>
            </div>
            <div className="bg-slate-900 text-white p-8 rounded-3xl min-w-[240px] text-center shadow-2xl shadow-slate-900/20">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Inversión Final</p>
              <p className="text-4xl font-black">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            <Save className="w-5 h-5" />
            Generar Cotización
          </button>
        </div>
      </form>
    </div>
  );
}
