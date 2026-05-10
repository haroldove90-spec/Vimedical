import React, { useState, useEffect } from 'react';
import { ChevronRight, ShoppingBag, RefreshCw, X, Plus, Trash2, Receipt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserProfile, Product, Role } from '../types';
import { supabase } from '../lib/supabase';

interface EcommerceViewProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
}

export function EcommerceView({ onBack, userProfile, sendNotification }: EcommerceViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProducts(data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            imageUrl: p.image_url,
            category: p.category
          })));
        } else {
          // Mock data if DB is empty
          setProducts([
            { id: 'p1', name: 'Prontosan Solución 350ml', description: 'Solución para el lavado de heridas.', price: 450, stock: 20, category: 'Lavado', imageUrl: 'https://picsum.photos/seed/prontosan/400/400' },
            { id: 'p2', name: 'Prontosan Gel 30ml', description: 'Gel para el desbridamiento autolítico.', price: 380, stock: 15, category: 'Gel', imageUrl: 'https://picsum.photos/seed/gel/400/400' },
            { id: 'p3', name: 'Apósito de Plata 10x10', description: 'Apósito antimicrobiano.', price: 120, stock: 50, category: 'Apósitos', imageUrl: 'https://picsum.photos/seed/silver/400/400' },
            { id: 'p4', name: 'Gasa Estéril 10x10', description: 'Paquete con 5 gasas.', price: 25, stock: 100, category: 'Consumibles', imageUrl: 'https://picsum.photos/seed/gauze/400/400' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!userProfile) return;
    setIsCheckingOut(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userProfile.user_id,
          total_amount: total,
          status: 'pending',
          shipping_address: 'Dirección de la clínica'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      // Decrementar stock y notificar si es bajo
      for (const item of cart) {
        const newStock = item.product.stock - item.quantity;
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
        
        if (newStock < 5) {
          await sendNotification(
            'Alerta de Stock Bajo',
            `El producto ${item.product.name} tiene solo ${newStock} unidades después de la venta.`,
            `Atención Administrador: El producto ${item.product.name} está por agotarse. Quedan solo ${newStock} unidades.`,
            'Administrador'
          );
        }
      }
      
      // Notificar al administrador sobre el nuevo pedido
      await sendNotification(
        'Nuevo Pedido Recibido',
        `Se ha recibido un nuevo pedido de ${userProfile.fullName} por un total de $${total.toLocaleString()}`,
        `Atención Administrador: Se ha registrado un nuevo pedido en la tienda por parte de ${userProfile.fullName}. El monto total es de ${total} pesos.`,
        'Administrador'
      );

      setCart([]);
      setShowCart(false);
      toast.success('Pedido realizado con éxito');
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Error al procesar el pedido');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-6 transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Panel
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black tracking-tighter text-slate-900">Tienda de Insumos</h2>
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              Próximamente
            </span>
          </div>
          <p className="text-slate-500 font-medium">Adquiere los mejores productos para el cuidado de heridas.</p>
        </div>
        
        <button 
          onClick={() => setShowCart(true)}
          className="relative bg-white border border-slate-200 p-4 rounded-2xl shadow-xl shadow-slate-200/50 hover:border-primary transition-all group"
        >
          <ShoppingBag className="w-6 h-6 text-slate-400 group-hover:text-primary" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-[3rem] shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2">Sin productos</h3>
          <p className="text-slate-500 font-medium max-w-md text-center px-6">
            No se encontraron productos disponibles en este momento. Por favor, intenta más tarde.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-primary/10 transition-all group">
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm">
                  <span className="text-sm font-black text-primary">${product.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 block">{product.category}</span>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{product.name}</h4>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{product.description}</p>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Añadir al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Carrito Lateral */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tighter text-slate-900">Tu Carrito</h3>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">El carrito está vacío</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{item.product.name}</h4>
                      <p className="text-xs text-slate-500 mb-2">{item.quantity} x ${item.product.price.toLocaleString()}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary">${(item.product.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total a pagar</span>
                  <span className="text-3xl font-black text-slate-900">${total.toLocaleString()}</span>
                </div>
                <button 
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                >
                  {isCheckingOut ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                  Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
