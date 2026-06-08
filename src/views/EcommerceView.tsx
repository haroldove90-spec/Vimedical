import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ShoppingBag, RefreshCw, X, Plus, Trash2, Receipt, 
  User, Heart, Search, Filter, ShoppingCart, UserCheck, LogIn, ClipboardList, Check, MapPin, Phone, Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UserProfile, Role, Product } from '../types';
import { supabase } from '../lib/supabase';

interface EcommerceViewProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  sendNotification: (title: string, body: string, voiceText: string, targetRole: Role) => Promise<void>;
}

interface ClientUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
}

export function EcommerceView({ onBack, userProfile, sendNotification }: EcommerceViewProps) {
  // Products, general loading
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Customer account state (User module - Register, Login, Profile)
  const [customer, setCustomer] = useState<ClientUser | null>(() => {
    const saved = localStorage.getItem('vimedical_customer');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Tab within the client side
  // 'shop': browse products, 'profile': user registration/login, orders
  const [ecomTab, setEcomTab] = useState<'shop' | 'profile'>('shop');
  
  // Auth Form mode inside customer profile tab
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authForm, setAuthForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    shippingAddress: ''
  });

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>(() => {
    const saved = localStorage.getItem('vimedical_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Checkout Fields (CoD)
  const [checkoutForm, setCheckoutForm] = useState({
    shippingAddress: customer?.shippingAddress || '',
    phone: customer?.phone || '',
    instructions: ''
  });

  // Client Order History
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Persist cart
  useEffect(() => {
    localStorage.setItem('vimedical_cart', JSON.stringify(cart));
  }, [cart]);

  // Load products list
  const fetchProducts = async () => {
    setLoading(true);
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
        // Fallback sample catalog products
        const sampleProducts = [
          { id: 'p1', name: 'Glucómetro Digital Accu-Chek', description: 'Medidor de glucosa en sangre instantáneo con 50 tiras de prueba.', price: 850, stock: 15, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=600' },
          { id: 'p2', name: 'Baumanómetro Automático Omron', description: 'Monitor de presión arterial de brazo con memoria de lecturas.', price: 1200, stock: 12, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116ecdccd04?auto=format&fit=crop&q=80&w=600' },
          { id: 'p3', name: 'Oxímetro de Pulso Portátil', description: 'Mide la saturación de oxígeno en sangre y frecuencia cardíaca.', price: 350, stock: 25, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600' },
          { id: 'p4', name: 'Prontosan Solución 350ml', description: 'Líquido para lavado e higienización de heridas y quemaduras.', price: 480, stock: 18, category: 'Farmacia', imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&q=80&w=600' },
          { id: 'p5', name: 'Termómetro Infrarrojo Sin Contacto', description: 'Lectura instantánea de temperatura corporal a distancia de seguridad.', price: 650, stock: 8, category: 'Equipos Médicos', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=600' },
          { id: 'p6', name: 'Paracetamol 500mg (20 tabletas)', description: 'Auxiliar para aliviar el dolor leve a moderado y reducir la fianza.', price: 45, stock: 120, category: 'Farmacia', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600' }
        ];
        setProducts(sampleProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync checkout fields when customer state changes
  useEffect(() => {
    if (customer) {
      setCheckoutForm(prev => ({
        ...prev,
        shippingAddress: customer.shippingAddress || prev.shippingAddress,
        phone: customer.phone || prev.phone
      }));
      // Fetch customer orders
      fetchCustomerOrders();
    }
  }, [customer]);

  // Fetch client orders from SB
  const fetchCustomerOrders = async () => {
    if (!customer) return;
    setLoadingOrders(true);
    try {
      // Find orders matching this email/user ID under orders
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .or(`user_id.eq.${customer.id},shipping_address.ilike.%${customer.email}%`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClientOrders(data);
      } else {
        // Mock client past orders if database doesn't pull
        const savedLocalOrders = localStorage.getItem(`cust_orders_${customer.id}`);
        setClientOrders(savedLocalOrders ? JSON.parse(savedLocalOrders) : []);
      }
    } catch (e) {
      console.error('Error fetching customer orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Auth: Customer registration
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.fullName || !authForm.email || !authForm.password) {
      toast.error('Por favor rellena el formulario de registro');
      return;
    }

    const newCustomer: ClientUser = {
      id: 'cust-' + Math.random().toString(36).substring(2, 9),
      fullName: authForm.fullName,
      email: authForm.email,
      phone: authForm.phone || 'N/A',
      shippingAddress: authForm.shippingAddress || 'N/A'
    };

    setCustomer(newCustomer);
    localStorage.setItem('vimedical_customer', JSON.stringify(newCustomer));
    toast.success(`¡Bienvenido a la tienda de ViMedical, ${authForm.fullName}!`);
    setEcomTab('shop');
  };

  // Auth: Customer login
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      toast.error('Ingresa correo y contraseña');
      return;
    }

    // Attempt to match
    const mockCust: ClientUser = {
      id: 'cust-9923',
      fullName: authForm.fullName || 'Cliente ViMedical',
      email: authForm.email,
      phone: authForm.phone || '555-555-5555',
      shippingAddress: authForm.shippingAddress || 'Domicilio de Entrega Registrado'
    };

    setCustomer(mockCust);
    localStorage.setItem('vimedical_customer', JSON.stringify(mockCust));
    toast.success('Sesión iniciada exitosamente');
    setEcomTab('shop');
  };

  // Auth: Logout
  const handleCustomerLogout = () => {
    setCustomer(null);
    setClientOrders([]);
    localStorage.removeItem('vimedical_customer');
    toast.success('Sesión cerrada correctamente');
  };

  // Shopping Cart Actions
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

  const updateQuantity = (productId: string, val: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const nextQ = Math.max(1, item.quantity + val);
        return { ...item, quantity: nextQ };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.success('Producto eliminado del carrito');
  };

  const totalCartValue = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Checkout Handler: Cash on Delivery (Contra-Entrega)
  const handleCheckoutCoD = async () => {
    if (cart.length === 0) {
      toast.error('El carrito de compras está vacío.');
      return;
    }

    if (!customer) {
      toast.error('Para realizar compras, por favor inicia sesión o crea tu cuenta de cliente.');
      setEcomTab('profile');
      setShowCart(false);
      return;
    }

    if (!checkoutForm.shippingAddress || !checkoutForm.phone) {
      toast.error('Por favor confirma tu dirección y teléfono para la entrega.');
      return;
    }

    setIsCheckingOut(true);
    try {
      // 1. Create Order row
      const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
      const deliveryAddressWithCmt = `${checkoutForm.shippingAddress} (Tel: ${checkoutForm.phone}). Obs: ${checkoutForm.instructions || 'Ninguna. Pago contra entrega al repartidor.'}`;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          id: orderId,
          user_id: customer.id,
          total_amount: totalCartValue,
          status: 'pending',
          shipping_address: deliveryAddressWithCmt
        }])
        .select()
        .single();

      // 2. Insert Order items
      const orderItems = cart.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total: item.product.price * item.quantity
      }));

      await supabase.from('order_items').insert(orderItems);

      // 3. Decrement stock
      for (const item of cart) {
        const nextStock = Math.max(0, item.product.stock - item.quantity);
        await supabase.from('products').update({ stock: nextStock }).eq('id', item.product.id);
      }

      // 4. Send system alert to Administrators
      await sendNotification(
        'Nuevo Pedido (Cobro Contra Entrega)',
        `Se ha ingresado una orden de $${totalCartValue.toLocaleString()} MXN por: ${customer.fullName}. Dirección de envío: ${checkoutForm.shippingAddress}.`,
        `Alerta de Tienda: Nueva orden registrada para enviar pago contra entrega.`,
        'Administrador'
      );

      // Save to local list of customer orders for instant UI updates
      const newOrderLocal = {
        id: orderId,
        user_id: customer.id,
        total_amount: totalCartValue,
        status: 'pending',
        shipping_address: deliveryAddressWithCmt,
        created_at: new Date().toISOString(),
        order_items: cart.map(item => ({
          quantity: item.quantity,
          unit_price: item.product.price,
          total: item.product.price * item.quantity,
          products: { name: item.product.name, image_url: item.product.imageUrl }
        }))
      };

      const revisedOrders = [newOrderLocal, ...clientOrders];
      setClientOrders(revisedOrders);
      localStorage.setItem(`cust_orders_${customer.id}`, JSON.stringify(revisedOrders));

      // Reset
      setCart([]);
      setShowCart(false);
      toast.success('¡Pedido CoD realizado con éxito! Un repartidor de ViMedical le llamará pronto.', { duration: 5000 });
      setEcomTab('profile'); // Send them to track their orders!
    } catch (e) {
      console.error('Checkout error:', e);
      toast.error('Error al ingresar el pedido contra entrega.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Navigation & Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <button 
            onClick={onBack} 
            className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary flex items-center gap-2 mb-4 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" /> Volver al Tablero Principal
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2.5 rounded-2xl border border-primary/20">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tienda & Farmacia ViMedical</h2>
              <p className="text-slate-500 text-sm font-medium">Equipos especializados de medición clínica y medicamentos de primera línea.</p>
            </div>
          </div>
        </div>

        {/* Buttons right / Client Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEcomTab('shop')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
              ecomTab === 'shop' 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' 
                : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
            }`}
          >
            Catálogo Tienda
          </button>
          
          <button
            onClick={() => setEcomTab('profile')}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
              ecomTab === 'profile' 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' 
                : 'bg-white text-slate-650 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            {customer ? `Mi Perfil: ${customer.fullName.split(' ')[0]}` : 'Registro / Cliente'}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => setShowCart(true)}
            className="relative bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-primary transition-all group shrink-0"
            title="Ver carrito de compras"
          >
            <ShoppingCart className="w-5 h-5 text-slate-500 group-hover:text-primary" />
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* --- RENDER CATÁLOGO SHOP TAB --- */}
      {ecomTab === 'shop' && (
        <div className="space-y-6">
          
          {/* Search bar and Filters Category List */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input Box */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar glucómetro, baumanómetro, gasas, paracetamol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold focus:border-primary focus:outline-none"
              />
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {['Todos', 'Farmacia', 'Equipos Médicos', 'Desinfectantes', 'Apósitos', 'Consumibles'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog products grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Cargando catálogo ViMedical...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 bg-white border border-slate-200 rounded-[3rem] text-center">
              <ShoppingCart className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-black text-slate-900">No encontramos resultados</h3>
              <p className="text-slate-400 text-xs mt-1 font-semibold">Intenta adaptando tus términos de búsqueda o filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group"
                >
                  {/* Photo area */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="text-[9px] font-black tracking-wider uppercase bg-primary text-white px-3 py-1 rounded-lg">
                        {product.category}
                      </span>
                    </div>
                    {product.stock <= 0 ? (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-500 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl">Agotado</span>
                      </div>
                    ) : product.stock < 5 ? (
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-amber-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-1 rounded-md animate-pulse">¡Pocas piezas!</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Body details */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5 select-text">
                      <h4 
                        onClick={() => setSelectedProduct(product)}
                        className="font-black text-slate-900 text-lg hover:text-primary transition-colors cursor-pointer leading-tight"
                      >
                        {product.name}
                      </h4>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2">{product.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold">Precio Unitario:</span>
                        <span className="font-black text-primary text-lg">${product.price.toLocaleString()} MXN</span>
                      </div>
                      
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className={`w-full text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
                          product.stock <= 0 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-slate-900 hover:bg-primary text-white shadow-md'
                        }`}
                      >
                        <Plus className="w-4 h-4" /> Añadir al carrito
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- RENDER USER PROFILE & ORDERS HISTORY TAB --- */}
      {ecomTab === 'profile' && (
        <div className="max-w-4xl mx-auto">
          {customer ? (
            // Customer Logged-In view
            <div className="space-y-8 animate-in zoom-in-95 duration-200">
              {/* Account summary banner */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center font-black text-2xl text-secondary">
                    {customer.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{customer.fullName}</h3>
                    <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5" /> {customer.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCustomerLogout}
                  className="bg-white/10 hover:bg-rose-500/10 text-white/80 hover:text-rose-400 border border-white/10 hover:border-rose-500/20 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Cerrar Sesión Cliente
                </button>
              </div>

              {/* Account profile shipping data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Teléfono de Contacto</span>
                  <p className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" /> {customer.phone}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4 md:col-span-2">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Dirección de Entrega Predeterminada</span>
                  <p className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0" /> {customer.shippingAddress}
                  </p>
                </div>
              </div>

              {/* Order history clinical monitor */}
              <section className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Tus Pedidos en ViMedical</h3>
                    <p className="text-slate-400 text-xs mt-1">Seguimiento de compras con envío urgente y cobro contra entrega CoD.</p>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="p-16 text-center">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando bitácora de pedidos...</span>
                  </div>
                ) : clientOrders.length === 0 ? (
                  <div className="p-20 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">No tienes compras registradas aún</p>
                    <button
                      onClick={() => setEcomTab('shop')}
                      className="bg-primary text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl mt-4 hover:shadow-lg transition-transform"
                    >
                      Ir a Comprar Ahora
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {clientOrders.map(order => (
                      <div key={order.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-xs font-bold text-slate-400">#{(order.id || '').slice(0, 8)}</span>
                            <span className="text-xs text-slate-400 font-bold">
                              {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 
                              order.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {order.status === 'delivered' ? 'Entregado y Pagado' : 
                               order.status === 'pending' ? 'Pendiente CoD' : 
                               order.status === 'shipped' ? 'En Ruta de Entrega' : 
                               order.status === 'processing' ? 'Preparando Envío' : 'Cancelado'}
                            </span>
                          </div>

                          <div className="space-y-1 select-text">
                            {order.order_items?.map((item: any, idx: number) => (
                              <p key={idx} className="text-xs font-black text-slate-700 leading-tight">
                                • {item.products?.name || 'Insumo Médico'} <span className="text-slate-400 font-bold">x {item.quantity}</span>
                              </p>
                            )) || <p className="text-xs font-black text-slate-700">• Equipo de Medición Estándar</p>}
                          </div>
                        </div>

                        {/* Order value */}
                        <div className="text-right">
                          <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest block mb-1">Pago Contra Entrega</span>
                          <span className="text-slate-900 font-black text-xl">${Number(order.total_amount).toLocaleString()} MXN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            // Customer Login / Registration Form
            <div className="bg-white border border-slate-200/85 rounded-[3rem] p-10 max-w-lg mx-auto shadow-sm space-y-8 animate-in zoom-in-95 duration-300">
              <div className="text-center">
                <span className="bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/25">
                  Módulo de Cliente Tienda
                </span>
                <h3 className="text-3xl font-black text-slate-950 tracking-tight mt-4">
                  {authMode === 'register' ? 'Crea tu Cuenta de Cliente' : 'Inicia Sesión en la Tienda'}
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-2 leading-relaxed">
                  Regístrate para guardar tu carrito de compras, registrar tu domicilio y hacer un seguimiento exhaustivo de tus pedidos de pago contra entrega.
                </p>
              </div>

              {/* Form trigger logic toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthForm({ fullName: '', email: '', password: '', phone: '', shippingAddress: '' });
                  }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    authMode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Registrarse
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthForm({ fullName: '', email: '', password: '', phone: '', shippingAddress: '' });
                  }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                    authMode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ya tengo cuenta (Login)
                </button>
              </div>

              <form onSubmit={authMode === 'register' ? handleCustomerRegister : handleCustomerLogin} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre Completo *</label>
                    <input 
                      type="text" 
                      placeholder="Juan Pérez Domínguez"
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm({...authForm, fullName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    placeholder="juan@ejemplo.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary focus:outline-none focus:ring-1"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contraseña *</label>
                  <input 
                    type="password" 
                    placeholder="Contraseña de cliente"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                {authMode === 'register' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Celular de Contacto *</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 55-2311-3423"
                        value={authForm.phone}
                        onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Domicilio Completo para Envíos CoD *</label>
                      <textarea
                        placeholder="Calle, Número, Colonia, Municipio, Estado, CP..."
                        value={authForm.shippingAddress}
                        onChange={(e) => setAuthForm({...authForm, shippingAddress: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary focus:outline-none resize-none h-20"
                        required
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-primary text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-colors flex items-center justify-center gap-2"
                >
                  {authMode === 'register' ? <UserCheck className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {authMode === 'register' ? 'Crear mi Cuenta de Comprador' : 'Ingresar a la Tienda'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* --- CART SLIDE OUT DRAWER OVERLAY --- */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">Carrito de Medicinas</h3>
              </div>
              <button 
                onClick={() => setShowCart(false)} 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-[10px]">El carrito está vacío</p>
                  <p className="text-xs font-semibold mt-1">Regresa al catálogo y añade equipos o medicinas.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.product.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mb-2">${item.product.price.toLocaleString()} MXN</p>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 text-xs font-bold">-</button>
                          <span className="text-xs font-black text-slate-700 w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded bg-slate-100 text-slate-500 text-xs font-bold">+</button>
                        </div>
                        <span className="font-black text-primary text-xs">${(item.product.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CHECKOUT BOX FOR CUSTOMER CO-D SHIPPING */}
            {cart.length > 0 && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-6">
                
                {/* Embedded Address confirmation */}
                {customer ? (
                  <div className="space-y-3.5 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black uppercase text-indigo-700 tracking-widest flex items-center gap-1.5 border-b border-indigo-50 pb-2">
                      <MapPin className="w-3.5 h-3.5" /> Confirmar Destino de Entrega (CoD)
                    </p>
                    
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold text-slate-450 text-slate-400 uppercase tracking-wider">Dirección</span>
                        <input
                          type="text"
                          value={checkoutForm.shippingAddress}
                          onChange={(e) => setCheckoutForm({...checkoutForm, shippingAddress: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Teléfono de Recibo</span>
                        <input
                          type="text"
                          value={checkoutForm.phone}
                          onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Referencias / Obs / Horarios</span>
                        <input
                          type="text"
                          placeholder="Ej: Entregar por las tardes, llame al timbre"
                          value={checkoutForm.instructions}
                          onChange={(e) => setCheckoutForm({...checkoutForm, instructions: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50 rounded-xl text-center">
                    <p className="text-xs text-indigo-950 font-black">Regístrate para confirmar tu envío de pago contra entrega.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px] block">Monto a abonar</span>
                    <span className="text-slate-450 text-xs font-black text-slate-455 text-emerald-600 font-semibold uppercase">Pago al Recibir (CoD)</span>
                  </div>
                  <span className="text-3xl font-black text-slate-900">${totalCartValue.toLocaleString()} MXN</span>
                </div>

                <button 
                  disabled={isCheckingOut}
                  onClick={handleCheckoutCoD}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isCheckingOut ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
                  Confirmar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DETALLADO INDIVIDUAL PRODUCT MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-2">
            
            {/* Left image zooming */}
            <div className="bg-slate-50 relative h-72 md:h-auto overflow-hidden">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-2.5 rounded-xl text-slate-500 hover:text-slate-950 shadow-sm"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>

            {/* Right product variables description */}
            <div className="p-8 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedProduct.category}</span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1 leading-tight">{selectedProduct.name}</h3>
                
                <div className="flex gap-4 items-center mt-3 text-xs font-bold text-slate-400">
                  <span>Porción/Unidad</span>
                  <span>•</span>
                  <span>Garantía Médica ViMedical</span>
                </div>

                <div className="border-t border-slate-100 my-4 pt-4">
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed leading-medium select-text">{selectedProduct.description}</p>
                </div>

                {/* Characteristics widget */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Disponibilidad en Bodega</span>
                    <span className={selectedProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} piezas` : 'Sin Existencias'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Método de Entrega</span>
                    <span className="text-primary uppercase tracking-wide text-[10px]">Express: Contra entrega</span>
                  </div>
                </div>
              </div>

              {/* Price level + Adding */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">Total con IVA:</span>
                  <span className="text-2xl font-black text-primary">${selectedProduct.price.toLocaleString()} MXN</span>
                </div>

                <button
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-slate-950 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Registrar en mi Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
