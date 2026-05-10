import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Product, Role } from '../types';
import { supabase } from '../lib/supabase';

interface InventoryViewProps {
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
}

export function InventoryView({ sendNotification }: InventoryViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Insumos',
    imageUrl: 'https://picsum.photos/seed/medical/400/400'
  });

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('name');
      if (error) throw error;
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.image_url,
          category: p.category
        })));
      }
    } catch (e) {
      console.error('Error fetching inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
      toast.success('Stock actualizado');

      // Notificar si el stock es bajo
      if (newStock < 5) {
        const product = products.find(p => p.id === id);
        if (product) {
          await sendNotification(
            'Alerta de Stock Bajo',
            `El producto ${product.name} tiene solo ${newStock} unidades.`,
            `Atención Administrador: El producto ${product.name} está por agotarse. Quedan solo ${newStock} unidades en inventario.`,
            'Administrador'
          );
        }
      }
    } catch (e) {
      toast.error('Error al actualizar stock');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        category: newProduct.category,
        image_url: newProduct.imageUrl
      });
      if (error) throw error;
      toast.success('Producto añadido');
      setShowAddModal(false);
      fetchProducts();
    } catch (e) {
      toast.error('Error al añadir producto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Producto eliminado');
    } catch (e) {
      toast.error('Error al eliminar producto');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Gestión de Inventario</h2>
          <p className="text-slate-500 font-medium">Control de existencias y alertas de stock bajo.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-black text-amber-700">
              {products.filter(p => p.stock < 5).length} Stock bajo
            </span>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </header>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Añadir Producto</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                <input 
                  type="text" required
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                  <input 
                    type="number" required
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</label>
                  <input 
                    type="number" required
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                <textarea 
                  required
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-2xl p-4 font-bold focus:ring-2 focus:ring-primary outline-none h-24"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Actual</th>
              <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="p-8">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-primary text-[10px] font-black uppercase tracking-widest">
                    {product.category}
                  </span>
                </td>
                <td className="p-8 font-black text-slate-900">
                  ${product.price.toLocaleString()}
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${product.stock < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="font-black text-slate-900">{product.stock} unidades</span>
                  </div>
                </td>
                <td className="p-8">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStock(product.id, Math.max(0, product.stock - 1))}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      <TrendingDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-200 transition-all"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
