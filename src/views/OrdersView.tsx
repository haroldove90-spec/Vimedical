import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Role } from '../types';
import { supabase } from '../lib/supabase';

interface OrdersViewProps {
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
}

export function OrdersView({ sendNotification }: OrdersViewProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email), order_items(*, products(name))')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('Error fetching orders:', e);
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Estado del pedido actualizado');

      const order = orders.find(o => o.id === orderId);
      if (order) {
        await sendNotification(
          'Actualización de Pedido',
          `Tu pedido #${orderId.slice(0, 8)} ha cambiado a: ${getStatusLabel(newStatus)}`,
          `Atención: El estado de su pedido ha sido actualizado a ${getStatusLabel(newStatus)}.`,
          'Enfermero'
        );
      }
    } catch (e) {
      toast.error('Error al actualizar estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'Procesando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Pedidos</h2>
        <p className="text-slate-500 font-medium">Administra las compras realizadas por el personal.</p>
      </header>

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando pedidos...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No hay pedidos registrados</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-8">
                      <span className="font-mono text-xs font-bold text-slate-400">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="p-8">
                      <div>
                        <p className="font-black text-slate-900">{order.profiles?.full_name || 'Usuario Desconocido'}</p>
                        <p className="text-xs text-slate-400 font-medium">{order.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="font-bold text-slate-600 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-8 font-black text-slate-900">
                      ${Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="p-8">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-8">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="processing">Procesando</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
