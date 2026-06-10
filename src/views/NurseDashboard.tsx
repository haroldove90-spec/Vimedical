import React from 'react';
import { 
  Shield, PlusCircle, Users, DollarSign, BarChart3, Clock, 
  Activity, ChevronRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, 
  Tooltip, Line 
} from 'recharts';
import { Patient, Wound, TreatmentLog, Role, UserProfile, View } from '../types';

interface NurseDashboardProps {
  navigateTo: (view: View, pId?: string, wId?: string) => void;
  patients: Patient[];
  wounds: Wound[];
  treatments: TreatmentLog[];
  profile: UserProfile | null;
  onSwitchRole?: (role: Role) => void;
}

export function NurseDashboard({ 
  navigateTo, 
  patients, 
  wounds, 
  treatments, 
  profile, 
  onSwitchRole 
}: NurseDashboardProps) {
  const myPatients = patients
    .filter(p => p.registeredBy === profile?.id || !p.registeredBy)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  const myTreatments = treatments.filter(t => t.nurseId === profile?.id);
  const approvedWounds = wounds.filter(w => w.status === 'approved');

  // Metrics calculations
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const dailyEarnings = myTreatments
    .filter(t => t.date.startsWith(today))
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const weeklyEarnings = myTreatments
    .filter(t => t.date >= oneWeekAgo)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const monthlyEarnings = myTreatments
    .filter(t => t.date >= oneMonthAgo)
    .reduce((sum, t) => sum + (t.cost || 0), 0);

  const chartData = [
    { name: 'Lun', earnings: 400 },
    { name: 'Mar', earnings: 300 },
    { name: 'Mie', earnings: 600 },
    { name: 'Jue', earnings: 800 },
    { name: 'Vie', earnings: 500 },
    { name: 'Sab', earnings: 900 },
    { name: 'Dom', earnings: dailyEarnings || 200 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {profile?.role === 'Administrador' && onSwitchRole && (
        <div className="bg-primary rounded-[2rem] p-4 flex items-center justify-between text-white shadow-lg border border-white/10">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-secondary" />
            <p className="text-sm font-bold">Estás viendo la plataforma como <span className="text-secondary">Enfermero</span></p>
          </div>
          <button 
            onClick={() => onSwitchRole('Administrador')}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            Volver a Admin
          </button>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Panel de Enfermería</h2>
          <h3 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">{profile?.fullName || 'Enf. Operativo'}</h3>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button 
            onClick={() => navigateTo('new-patient')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 scale-100 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            Nuevo Paciente
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mis Pacientes</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">{myPatients.length}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos Hoy</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">${dailyEarnings}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingresos Mes</p>
          </div>
          <h3 className="text-4xl font-black text-slate-900">${monthlyEarnings}</h3>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pendientes</p>
          </div>
          <h3 className="text-4xl font-black text-amber-500">{approvedWounds.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Desempeño Semanal</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                +12% vs semana pasada
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '1rem', 
                      color: '#fff',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3C6B94" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#3C6B94', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#CBB882', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Lista de Trabajo</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400">
                  <tr>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Paciente</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Herida</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Progreso</th>
                    <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedWounds.map(wound => {
                    const patient = patients.find(p => p.id === wound.patientId);
                    return (
                      <tr key={wound.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                              {patient?.fullName[0]}
                            </div>
                            <span className="font-bold text-slate-900">{patient?.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-slate-600 font-medium">{wound.location}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
                              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${((wound.visitCount || 0) / (wound.targetVisits || 1)) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-black text-slate-400">{wound.visitCount || 0}/{wound.targetVisits || 1}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => navigateTo('new-treatment', wound.patientId, wound.id)}
                            className="bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-primary/20"
                          >
                            Registrar Visita
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/30">
            <h3 className="font-black uppercase tracking-widest text-xs mb-6 text-secondary">Resumen de Ingresos</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Esta Semana</p>
                  <p className="text-2xl font-black">${weeklyEarnings}</p>
                </div>
                <div className="text-emerald-400 text-xs font-bold">+8%</div>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[65%]" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Visitas</p>
                  <p className="text-lg font-black">{myTreatments.length}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Promedio</p>
                  <p className="text-lg font-black">${Math.round(monthlyEarnings / (myTreatments.length || 1))}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">Mis Pacientes</h3>
              <button onClick={() => navigateTo('patients')} className="text-primary font-bold text-xs hover:underline">Ver todos</button>
            </div>
            <div className="space-y-4">
              {myPatients.slice(0, 8).map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => navigateTo('patient-detail', patient.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                      {patient.fullName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{patient.fullName}</p>
                      <p className="text-[10px] font-medium text-slate-500">{patient.phone}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
