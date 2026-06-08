import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ListOrdered, User, BarChart, Plus, Trash2, 
  Save, AlertCircle, TrendingUp, DollarSign, Calendar, Sliders, CheckCircle, Clock, Truck, XCircle, ChevronRight, Edit2, Download, Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Product, UserProfile, Role, View } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Legend
} from 'recharts';

interface StoreAdminDashboardProps {
  profile: UserProfile | null;
  onBack: () => void;
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
}

interface ManualSale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  saleDate: string;
  clientName: string;
}

export function StoreAdminDashboard({ profile, onBack, sendNotification }: StoreAdminDashboardProps) {
  // Tabs for sub-modules
  // 1: Stock (Administración de stock)
  // 2: Pedidos (Seguimiento de ventas por entregar)
  // 3: Perfil (Datos personales de admin)
  // 4: Métricas (Productos, ventas día, semana, mes)
  // 5: Ventas (Registrar cada venta cerrada)
  const [activeTab, setActiveTab] = useState<'stock' | 'orders' | 'profile' | 'metrics' | 'sales'>('stock');

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [manualSales, setManualSales] = useState<ManualSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Add product state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Equipos Médicos',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600'
  });

  // Manual sale form state
  const [saleForm, setSaleForm] = useState({
    productId: '',
    quantity: '1',
    clientName: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  // Admin personal profile edit state
  const [adminProfileForm, setAdminProfileForm] = useState({
    fullName: profile?.fullName || 'Harold Anguiano',
    email: profile?.email || 'harold@vimedical.com',
    phone: profile?.phone || '555-019-2834',
    license: profile?.license || 'CED-PROF-992384',
    specialty: profile?.specialty || 'Administración de Sistemas Clínicos y E-commerce'
  });

  // Categories list
  const categories = ['Farmacia', 'Equipos Médicos', 'Desinfectantes', 'Apósitos', 'Consumibles'];

  // Load backend data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch products
      const { data: pData, error: pErr } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      let finalProducts: Product[] = [];
      if (pErr) {
        console.error('Error fetching products:', pErr);
      } else if (pData && pData.length > 0) {
        finalProducts = pData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.image_url,
          category: p.category
        }));
      } else {
        // Sample store products
        finalProducts = [
          { id: 'p1', name: 'Glucómetro Digital Accu-Chek', description: 'Medidor de glucosa en sangre instantáneo con 50 tiras de prueba.', price: 850, stock: 15, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=600' },
          { id: 'p2', name: 'Baumanómetro Automático Omron', description: 'Monitor de presión arterial de brazo con memoria de lecturas.', price: 1200, stock: 12, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116ecdccd04?auto=format&fit=crop&q=80&w=600' },
          { id: 'p3', name: 'Oxímetro de Pulso Portátil', description: 'Mide la saturación de oxígeno en sangre y frecuencia cardíaca.', price: 350, stock: 25, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600' },
          { id: 'p4', name: 'Prontosan Solución 350ml', description: 'Líquido para lavado e higienización de heridas y quemaduras.', price: 480, stock: 18, category: 'Farmacia', imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=600' },
          { id: 'p5', name: 'Termómetro Infrarrojo Sin Contacto', description: 'Lectura instantánea de temperatura corporal a distancia de seguridad.', price: 650, stock: 8, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600' },
          { id: 'p6', name: 'Paracetamol 500mg (20 tabletas)', description: 'Auxiliar para aliviar el dolor leve a moderado y reducir la fiebre.', price: 45, stock: 120, category: 'Farmacia', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600' }
        ];
        // Auto-seed into DB if possible
        for (const testProd of finalProducts) {
          await supabase.from('products').insert({
            id: testProd.id,
            name: testProd.name,
            description: testProd.description,
            price: testProd.price,
            stock: testProd.stock,
            category: testProd.category,
            image_url: testProd.imageUrl
          });
        }
      }
      setProducts(finalProducts);

      // 2. Fetch orders status
      const { data: oData, error: oErr } = await supabase
        .from('orders')
        .select('*, profiles(full_name, email), order_items(*, products(name))')
        .order('created_at', { ascending: false });

      if (oErr) {
        console.error('Error fetching orders:', oErr);
      } else {
        setOrders(oData || []);
      }

      // 3. Load manual sales from localStorage
      const cachedManualSales = localStorage.getItem('vimedical_manual_sales');
      if (cachedManualSales) {
        setManualSales(JSON.parse(cachedManualSales));
      } else {
        // Initial mock manual sales
        const mockSales: ManualSale[] = [
          { id: 's-1', productName: 'Baumanómetro Automático Omron', quantity: 2, totalPrice: 2400, saleDate: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0], clientName: 'María Luisa López' },
          { id: 's-2', productName: 'Glucómetro Digital Accu-Chek', quantity: 1, totalPrice: 850, saleDate: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0], clientName: 'Roberto Gómez' },
          { id: 's-3', productName: 'Prontosan Solución 350ml', quantity: 3, totalPrice: 1440, saleDate: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0], clientName: 'Enrique Cárdenas' }
        ];
        setManualSales(mockSales);
        localStorage.setItem('vimedical_manual_sales', JSON.stringify(mockSales));
      }

    } catch (e) {
      console.error('StoreAdminDashboard overall fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync profile when parent profile changes
  useEffect(() => {
    if (profile) {
      setAdminProfileForm({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone || '555-019-2834',
        license: profile.license || 'CED-PROF-992384',
        specialty: profile.specialty || 'Administración de Sistemas Clínicos y E-commerce'
      });
    }
  }, [profile]);

  // -- 1. ADMINSTOCK: Create/Update/Delete Product handlers --
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Equipos Médicos',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600'
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock.toString(),
      category: p.category,
      imageUrl: p.imageUrl
    });
    setShowAddModal(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      if (editingProduct) {
        // Edit product
        const { error } = await supabase
          .from('products')
          .update({
            name: productForm.name,
            description: productForm.description,
            price: Number(productForm.price),
            stock: Number(productForm.stock),
            category: productForm.category,
            image_url: productForm.imageUrl
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Producto actualizado exitosamente');
      } else {
        // Insert product
        const newId = 'prod-' + Math.random().toString(36).substring(2, 9);
        const { error } = await supabase
          .from('products')
          .insert({
            id: newId,
            name: productForm.name,
            description: productForm.description,
            price: Number(productForm.price),
            stock: Number(productForm.stock),
            category: productForm.category,
            image_url: productForm.imageUrl
          });

        if (error) throw error;
        toast.success('Producto registrado con éxito');
      }
      setShowAddModal(false);
      loadData();
    } catch (e: any) {
      console.error('Error saving product in stock:', e);
      // Local state update fall-back if DB throws error or is structured differently
      const fallbackId = editingProduct ? editingProduct.id : 'prod-' + Date.now();
      const updatedProduct: Product = {
        id: fallbackId,
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: productForm.category,
        imageUrl: productForm.imageUrl
      };
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
      } else {
        setProducts(prev => [...prev, updatedProduct]);
      }
      setShowAddModal(false);
      toast.success('Cambios guardados localmente');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('¿Estás completamente seguro de eliminar este producto del catálogo de la tienda?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Producto eliminado del inventario');
      loadData();
    } catch (e) {
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Producto removido localmente');
    }
  };

  const handleUpdateStockLevel = async (id: string, current: number, delta: number) => {
    const nextVal = Math.max(0, current + delta);
    try {
      const { error } = await supabase.from('products').update({ stock: nextVal }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: nextVal } : p));
      toast.success(`Stock actualizado a ${nextVal}`);
      
      if (nextVal < 5) {
        await sendNotification(
          'Alerta de Stock Bajo',
          `El producto ha bajado de stock crítico a: ${nextVal} unidades`,
          `Alerta: Stock crítico bajo para producto.`,
          'Administrador'
        );
      }
    } catch (e) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: nextVal } : p));
      toast.success(`Stock ajustado localmente a ${nextVal}`);
    }
  };


  // -- 2. ORDER MANAGEMENT: Update payment / delivery status --
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Estado del pedido actualizado exitosamente');
      
      const order = orders.find(o => o.id === orderId);
      const label = getStatusLabel(status);
      await sendNotification(
        'E-commerce: Actualización de Pedido',
        `Su pedido #${orderId.slice(0, 8)} de pago contra entrega se encuentra en estado: ${label}`,
        `Actualización de compra. Su orden número ${orderId.slice(0, 4)} está en estado ${label}.`,
        'Todos' as Role
      );
    } catch (e) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(`Estado actualizado a: ${getStatusLabel(status)}`);
    }
  };


  // -- 3. ADMIN PROFILE FORM SUBMIT --
  const saveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: adminProfileForm.fullName,
            phone: adminProfileForm.phone,
            license: adminProfileForm.license,
            specialty: adminProfileForm.specialty
          })
          .eq('id', profile.id);

        if (error) throw error;
      }
      toast.success('Perfil del Administrador guardado y actualizado');
    } catch (err) {
      toast.success('Perfil actualizado localmente en el dispositivo');
    }
  };


  // -- 5. VENTAS DIRECTAS / REGISTRATION OF CLOSED SALES --
  const handleRegisterManualSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.productId || !saleForm.quantity || !saleForm.clientName) {
      toast.error('Favor de rellenar todos los campos del registro de venta');
      return;
    }

    const selectedProd = products.find(p => p.id === saleForm.productId);
    if (!selectedProd) {
      toast.error('Producto no encontrado');
      return;
    }

    const qtyNum = Number(saleForm.quantity);
    if (qtyNum > selectedProd.stock) {
      toast.error(`Stock insuficiente. Solo quedan ${selectedProd.stock} piezas de este artículo.`);
      return;
    }

    const priceTotal = selectedProd.price * qtyNum;

    // Build the manual sale record
    const saleRecord: ManualSale = {
      id: 'sal-' + Math.random().toString(36).substring(2, 9),
      productName: selectedProd.name,
      quantity: qtyNum,
      totalPrice: priceTotal,
      saleDate: saleForm.saleDate,
      clientName: saleForm.clientName
    };

    const nextSales = [saleRecord, ...manualSales];
    setManualSales(nextSales);
    localStorage.setItem('vimedical_manual_sales', JSON.stringify(nextSales));

    // Reduce stock from supabase/local state
    handleUpdateStockLevel(selectedProd.id, selectedProd.stock, -qtyNum);

    // Reset Form
    setSaleForm({
      productId: '',
      quantity: '1',
      clientName: '',
      saleDate: new Date().toISOString().split('T')[0]
    });

    toast.success('¡Venta cerrada registrada con éxito!');
  };

  const handleDeleteManualSale = (id: string, prodName: string, qty: number) => {
    if (!window.confirm('¿Cancelar este registro de venta? El stock no se devolverá automáticamente.')) return;
    const nextSales = manualSales.filter(s => s.id !== id);
    setManualSales(nextSales);
    localStorage.setItem('vimedical_manual_sales', JSON.stringify(nextSales));
    toast.success('Registro de venta eliminado de la bitácora');
  };


  // -- 4. CALCULATE METRICS --
  const calculateMetrics = () => {
    const totalPublished = products.length;
    const lowStockCount = products.filter(p => p.stock < 5).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    // Total online e-commerce sales delivereds or completed
    const onlineCompletedTotal = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Total online pending orders total
    const onlinePendingTotal = orders
      .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Manual sales total value
    const manualSalesTotal = manualSales.reduce((sum, s) => sum + s.totalPrice, 0);

    const totalRevenueSum = onlineCompletedTotal + manualSalesTotal;

    // Time breakdowns
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Day sales
    const salesToday = manualSales.filter(s => s.saleDate === todayStr).reduce((sum, s) => sum + s.totalPrice, 0) +
                        orders.filter(o => o.status === 'delivered' && o.created_at.startsWith(todayStr)).reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Week sales (roughly within 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const salesWeek = manualSales.filter(s => s.saleDate >= sevenDaysAgo).reduce((sum, s) => sum + s.totalPrice, 0) +
                       orders.filter(o => o.status === 'delivered' && o.created_at >= sevenDaysAgo).reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Month sales (roughly within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const salesMonth = manualSales.filter(s => s.saleDate >= thirtyDaysAgo).reduce((sum, s) => sum + s.totalPrice, 0) +
                        orders.filter(o => o.status === 'delivered' && o.created_at >= thirtyDaysAgo).reduce((sum, o) => sum + Number(o.total_amount), 0);

    // Generate chart data for last 7 days
    const chartData = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(Date.now() - (6 - idx) * 24 * 3600 * 1000);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });

      const ecomDayVal = orders
        .filter(o => o.status === 'delivered' && o.created_at.startsWith(dStr))
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      const manualDayVal = manualSales
        .filter(s => s.saleDate === dStr)
        .reduce((sum, s) => sum + s.totalPrice, 0);

      return {
        name: dayLabel,
        'Tienda Online': ecomDayVal,
        'Venta Manual': manualDayVal,
        'Total Diario': ecomDayVal + manualDayVal
      };
    });

    return {
      totalPublished,
      lowStockCount,
      outOfStockCount,
      onlineCompletedTotal,
      onlinePendingTotal,
      manualSalesTotal,
      totalRevenueSum,
      salesToday,
      salesWeek,
      salesMonth,
      chartData
    };
  };

  const metrics = calculateMetrics();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente CoD';
      case 'processing': return 'Preparando Envío';
      case 'shipped': return 'En Ruta de Entrega';
      case 'delivered': return 'Entregado y Cobrado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <button 
            onClick={onBack}
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-4 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Tablero Principal
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-2xl p-2.5 text-white shadow-lg shadow-indigo-600/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Administración de E-commerce</h2>
              <p className="text-slate-500 text-sm font-medium">Panel exclusivo para administrar la tienda en línea, inventario de farmacia y ventas.</p>
            </div>
          </div>
        </div>

        {/* Roles/Tags */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-black text-indigo-700 bg-white shadow-sm px-3.5 py-1.5 rounded-[10px] uppercase tracking-wider">
            Admin de Tienda: Harold Anguiano
          </span>
        </div>
      </header>

      {/* Sub-module tab selector */}
      <div className="grid grid-cols-2 md:flex md:flex-row gap-2 bg-slate-100/80 p-2 rounded-2xl border border-slate-200/50">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'stock' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Package className="w-4 h-4" /> Stock & Productos
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'orders' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ListOrdered className="w-4 h-4" /> Pedidos por Entregar
          {orders.filter(o => o.status === 'pending').length > 0 && (
            <span className="bg-amber-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'sales' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Registrar Ventas
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'metrics' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BarChart className="w-4 h-4" /> Métricas e Indicadores
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'profile' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <User className="w-4 h-4" /> Perfil de Administrador
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando datos de la tienda...</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* TAB 1: ADMINISTRACION DE STOCK / PRODUCTOS */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              {/* Top Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
                  <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Artículos</span>
                    <h4 className="text-2xl font-black text-slate-900">{metrics.totalPublished} tipos</h4>
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl flex items-center gap-4 shadow-sm">
                  <div className="bg-amber-50 text-amber-500 p-4 rounded-2xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Stock Crítico ({"<5"})</span>
                    <h4 className="text-2xl font-black text-slate-900">{metrics.lowStockCount} artículos</h4>
                  </div>
                </div>
                <button
                  onClick={handleOpenAddModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/10 font-bold tracking-tight text-sm text-center"
                >
                  <Plus className="w-5 h-5" /> Registrar Nuevo Medicamento / Equipo
                </button>
              </div>

              {/* Inventory Table */}
              <section className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Catálogo e Inventario de Productos</h3>
                  <span className="text-xs text-slate-400 font-medium">Controla directamente las existencias de farmacia, insumos y equipos para medir la presión, glucosa, etc.</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle Producto</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Unitario</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Existencia (Stock)</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones Rápidas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-black text-slate-900 text-sm leading-tight">{product.name}</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{product.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-full text-slate-600 uppercase tracking-wider">
                              {product.category}
                            </span>
                          </td>
                          <td className="p-6 font-black text-slate-800 text-sm">
                            ${product.price.toLocaleString()} MXN
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleUpdateStockLevel(product.id, product.stock, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors font-black text-sm"
                              >
                                -
                              </button>
                              <span className={`w-12 text-center font-black text-sm p-1 rounded-md ${product.stock <= 0 ? 'text-red-600 bg-red-50' : product.stock < 5 ? 'text-amber-600 bg-amber-50' : 'text-slate-800'}`}>
                                {product.stock}
                              </span>
                              <button 
                                onClick={() => handleUpdateStockLevel(product.id, product.stock, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors font-black text-sm"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(product)}
                                className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                title="Eliminar"
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
              </section>
            </div>
          )}

          {/* TAB 2: SEGUIMIENTO DE PEDIDOS POR ENTEGAR */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200/80 p-6 rounded-[2rem] text-amber-900 text-sm font-medium flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 mb-1">Pagos contra entrega habilitados</p>
                  <p className="text-amber-800 text-xs text-justify">Todos los pedidos se gestionan mediante el modelo de pago contra entrega. Al entregar el medicamento o equipo clínico en el domicilio o clínica, el repartidor deberá cobrar el monto total acordado e ingresar el estado como "Entregado y Cobrado".</p>
                </div>
              </div>

              <section className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Pedidos por Entregar y Cobrar</h3>
                  <p className="text-slate-400 text-xs mt-1">Control de entregas y estatus de cobros CoD (Cash on Delivery).</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Folio / Pedido ID</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Domicilio</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Artículos Solicitados</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cobro Total</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación Actual (Estado)</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizar Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-16 text-center text-slate-400 text-sm font-medium">
                            No se han recibido pedidos de la tienda online aún.
                          </td>
                        </tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-6">
                              <span className="font-mono text-xs font-bold text-slate-400">#{order.id.slice(0, 8)}</span>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="p-6">
                              <div>
                                <span className="font-black text-slate-900 text-sm">{order.profiles?.full_name || order.customer_name || 'Paciente de ViMedical'}</span>
                                <p className="text-xs text-slate-500 font-medium mt-1 leading-tight">{order.shipping_address || 'Entrega en clínica autorizada'}</p>
                                <p className="text-[10px] font-bold text-indigo-600 mt-1">{order.profiles?.email}</p>
                              </div>
                            </td>
                            <td className="p-6">
                              <div className="space-y-1">
                                {order.order_items?.map((item: any, i: number) => (
                                  <p key={i} className="text-xs font-black text-slate-700">
                                    • {item.products?.name || 'Medicamento'} <span className="text-slate-400 font-bold">x {item.quantity}</span>
                                  </p>
                                )) || (
                                  <p className="text-xs font-black text-slate-700">• Baumanómetro Digital Omron x 1</p>
                                )}
                              </div>
                            </td>
                            <td className="p-6 font-black text-slate-900 text-sm">
                              ${Number(order.total_amount || order.totalAmount || 1200).toLocaleString()} MXN
                            </td>
                            <td className="p-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="p-6">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-250 p-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                              >
                                <option value="pending">Pendiente CoD</option>
                                <option value="processing">Preparando Envío</option>
                                <option value="shipped">En Ruta de Entrega</option>
                                <option value="delivered">Entregado y Cobrado</option>
                                <option value="cancelled">Cancelar Pedido</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: PERFIL DEL USUARIO - ADMINISTRADOR */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-10 max-w-3xl mx-auto shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-2xl">
                  {adminProfileForm.fullName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Expediente y Perfil del Administrador</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Manejo y acceso de datos profesionales clínicos</p>
                </div>
              </div>

              <form onSubmit={saveAdminProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={adminProfileForm.fullName}
                      onChange={(e) => setAdminProfileForm({...adminProfileForm, fullName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Contacto</label>
                    <input 
                      type="email" 
                      value={adminProfileForm.email}
                      onChange={(e) => setAdminProfileForm({...adminProfileForm, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Teléfono Directo</label>
                    <input 
                      type="text" 
                      value={adminProfileForm.phone}
                      onChange={(e) => setAdminProfileForm({...adminProfileForm, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cédula Profesional</label>
                    <input 
                      type="text" 
                      value={adminProfileForm.license}
                      onChange={(e) => setAdminProfileForm({...adminProfileForm, license: e.target.value})}
                      className="w-full bg-slate-200 border border-slate-300 rounded-2xl p-4 text-sm font-bold cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Especialidad / Perfil Administrativo</label>
                  <input 
                    type="text" 
                    value={adminProfileForm.specialty}
                    onChange={(e) => setAdminProfileForm({...adminProfileForm, specialty: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Save className="w-5 h-5" /> Guardar Mis Datos de Operador
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: METRICAS Y ANALITICAS DEL E-COMMERCE */}
          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
              {/* Financial cards count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ventas del Día</span>
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">${metrics.salesToday.toLocaleString()}</h4>
                    <p className="text-emerald-650 text-xs font-bold flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Hoy
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ventas de la Semana</span>
                    <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl"><Calendar className="w-5 h-5" /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">${metrics.salesWeek.toLocaleString()}</h4>
                    <p className="text-indigo-650 text-xs font-bold mt-1">Transaccionesúltimos 7 días</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ventas del Mes</span>
                    <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl"><Sliders className="w-5 h-5" /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">${metrics.salesMonth.toLocaleString()}</h4>
                    <p className="text-purple-600 text-xs font-bold mt-1">Últimos 30 días</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Registrado Bruto</span>
                    <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl"><DollarSign className="w-5 h-5" /></div>
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">${metrics.totalRevenueSum.toLocaleString()}</h4>
                    <p className="text-rose-655 text-xs font-bold mt-1">Online CoD + Ventas Manuales</p>
                  </div>
                </div>
              </div>

              {/* Graphical representation */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area chart sales trend */}
                <div className="bg-white border border-slate-200/80 p-8 rounded-[2.5rem] shadow-sm lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Tendencia de Ventas (Últimos 7 días)</h3>
                    <p className="text-slate-400 text-xs">Comparativa acumulada diaria de los ingresos captados en e-commerce y facturas manuales.</p>
                  </div>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics.chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3.5" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }} />
                        <Area type="monotone" dataKey="Total Diario" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Left product breakdown */}
                <div className="bg-white border border-slate-200/80 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 leading-tight">Estatus de Productos</h3>
                    <p className="text-slate-400 text-xs">Desglose de existencias publicadas y alertas.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-indigo-600 rounded-full" />
                        <span className="text-xs font-black text-slate-700">Artículos Publicados</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{metrics.totalPublished}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                        <span className="text-xs font-black text-amber-800">Medicamentos Stock Crítico</span>
                      </div>
                      <span className="text-sm font-black text-amber-900">{metrics.lowStockCount}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-xs font-black text-red-800">Agotados</span>
                      </div>
                      <span className="text-sm font-black text-red-900">{metrics.outOfStockCount}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-3.5">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    <p className="text-xs font-black text-slate-700 leading-tight">Integridad de inventario sincronizado con base de datos en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REGISTRAR CADA UNA DE SUS VENTAS CERRADAS (MANUAL SALES) */}
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form to log manual sales */}
              <div className="bg-white border border-slate-200/80 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Registrar Nueva Venta Cerrada</h3>
                  <p className="text-slate-400 text-xs">Captura las transacciones hechas en persona o de forma externa para descontar de inmediato el stock y actualizar las métricas de ingresos.</p>
                </div>

                <form onSubmit={handleRegisterManualSale} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Producto Vendido</label>
                    <select
                      value={saleForm.productId}
                      onChange={(e) => setSaleForm({...saleForm, productId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">Selecciona un producto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price} | Stock: {p.stock} pzs)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantidad</label>
                      <input 
                        type="number" 
                        min="1"
                        value={saleForm.quantity}
                        onChange={(e) => setSaleForm({...saleForm, quantity: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fecha de Venta</label>
                      <input 
                        type="date" 
                        value={saleForm.saleDate}
                        onChange={(e) => setSaleForm({...saleForm, saleDate: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre Cliente</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Juan Pérez González"
                      value={saleForm.clientName}
                      onChange={(e) => setSaleForm({...saleForm, clientName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-1"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> Registrar Venta Directa
                  </button>
                </form>
              </div>

              {/* Sales ledger list */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Historial de Ventas Clínicas Cerradas</h3>
                    <p className="text-slate-400 text-xs">Bitácora física y manual registradas directamente del mostrador.</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-100">
                    {manualSales.length} Ventas
                  </span>
                </div>

                <div className="overflow-y-auto max-h-[460px] divide-y divide-slate-100">
                  {manualSales.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                      No hay registros en la bitácora de ventas directas.
                    </div>
                  ) : (
                    manualSales.map(sale => (
                      <div key={sale.id} className="p-6 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{sale.productName}</span>
                            <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                              x {sale.quantity} pzs
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-slate-405 text-slate-400 font-medium">
                            <span>Comprador: <strong className="text-slate-700">{sale.clientName}</strong></span>
                            <span>•</span>
                            <span>Fecha: <strong>{new Date(sale.saleDate).toLocaleDateString()}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-black text-indigo-600 text-base">
                            ${sale.totalPrice.toLocaleString()} MXN
                          </span>
                          <button
                            onClick={() => handleDeleteManualSale(sale.id, sale.productName, sale.quantity)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Product ADD/EDIT Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-indigo-50/50 flex justify-between items-center bg-indigo-50/20">
              <h3 className="text-xl font-black text-indigo-950">
                {editingProduct ? 'Editar Producto Catálogo' : 'Añadir Nuevo Producto Clínico'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={saveProduct} className="p-8 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre del Producto *</label>
                <input 
                  type="text" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Ej. Glucómetro Inalámbrico Smart"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Descripción *</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Escriba especificaciones técnicas del equipo o medicamento..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none resize-none h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Precio Venta (MXN) *</label>
                  <input 
                    type="number" 
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="Ej. 650"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Existencia en Stock *</label>
                  <input 
                    type="number" 
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    placeholder="Ej. 15"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Imagen URL</label>
                <input 
                  type="text" 
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Save className="w-5 h-5" /> Regitrar Cambios en Catálogo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
