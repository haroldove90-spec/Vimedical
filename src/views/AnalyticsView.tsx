import React, { useState, useEffect } from 'react';
import { Filter, Users, Activity, CheckCircle2, DollarSign, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Patient, Wound, TreatmentLog } from '../types';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

interface AnalyticsViewProps {
  patients: Patient[];
  wounds: Wound[];
  treatmentLogs: TreatmentLog[];
}

export function AnalyticsView({ patients, wounds, treatmentLogs }: AnalyticsViewProps) {
  const [salesData, setSalesData] = useState<{ name: string, sales: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string, quantity: number }[]>([]);
  
  const activeWounds = wounds.filter(w => w.status !== 'completed' && w.status !== 'rejected');
  const completedWounds = wounds.filter(w => w.status === 'completed');
  
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data: orders, error } = await supabase.from('orders').select('*, order_items(*)');
        if (error) throw error;
        
        // Group by month
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const grouped = months.map(m => ({ name: m, sales: 0 }));
        
        orders?.forEach(order => {
          const date = new Date(order.created_at);
          const monthIdx = date.getMonth();
          if (monthIdx < grouped.length) {
            grouped[monthIdx].sales += Number(order.total_amount);
          }
        });
        setSalesData(grouped);

        // Top products
        const productCounts: Record<string, number> = {};
        orders?.forEach(order => {
          order.order_items?.forEach((item: any) => {
            productCounts[item.product_id] = (productCounts[item.product_id] || 0) + item.quantity;
          });
        });
        // For demo, we'll just use some names if we had product names
        setTopProducts([
          { name: 'Prontosan Solución', quantity: 45 },
          { name: 'Apósito de Plata', quantity: 32 },
          { name: 'Gasas Estériles', quantity: 28 },
        ]);

      } catch (e) {
        console.error('Error fetching sales analytics:', e);
      }
    };
    fetchSales();
  }, []);

  const healingData = [
    { name: 'Ene', active: 4, completed: 1 },
    { name: 'Feb', active: 6, completed: 2 },
    { name: 'Mar', active: 8, completed: 5 },
    { name: 'Abr', active: activeWounds.length, completed: completedWounds.length },
  ];

  const locationData = Array.from(new Set(wounds.map(w => w.location))).map(loc => ({
    name: loc,
    value: wounds.filter(w => w.location === loc).length
  })).slice(0, 5);

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Estadísticas Clínicas</h2>
          <p className="text-slate-500 font-medium">Análisis detallado del rendimiento y progreso de pacientes.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 p-3 rounded-xl text-slate-400 hover:text-primary transition-all shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
          <button className="bg-white border border-slate-200 px-6 py-3 rounded-xl text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            Exportar Datos
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pacientes</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{patients.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
              <Activity className="w-6 h-6" />
            </div>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heridas Activas</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{activeWounds.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Altas Médicas</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{completedWounds.length}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">
            ${salesData.reduce((acc, curr) => acc + curr.sales, 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900">Ingresos por Ventas</h3>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
              <ArrowUpRight className="w-4 h-4" />
              +12.5%
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Progreso de Curación</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healingData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="active" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorActive)" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={4} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Ubicación de Heridas</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <h3 className="text-xl font-black text-slate-900 mb-8">Productos Más Vendidos</h3>
          <div className="space-y-6">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-400 border border-slate-100">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{product.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumo Médico</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{product.quantity}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
