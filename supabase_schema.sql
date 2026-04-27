-- ==========================================
-- Tablas Base de Datos ViMedical
-- ==========================================

-- Tabla para Perfiles de Usuario (Admin, Doctor, Enfermero)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  password TEXT,
  phone TEXT,
  license TEXT,
  specialty TEXT,
  photo_url TEXT,
  signature_url TEXT, -- Nueva columna para firma digital
  bio TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Pacientes
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  phone TEXT,
  address TEXT,
  marital_status TEXT,
  occupation TEXT,
  religion TEXT,
  education_level TEXT,
  family_history TEXT,
  pathological_history TEXT,
  non_pathological_history TEXT,
  initial_wound_photo TEXT,
  current_condition TEXT,
  physical_exploration TEXT,
  regions_segments TEXT,
  privacy_notice_signed BOOLEAN DEFAULT FALSE,
  privacy_notice_date TEXT,
  privacy_notice_signature TEXT,
  privacy_notice_type TEXT DEFAULT 'casa',
  consent_form_signed BOOLEAN DEFAULT FALSE,
  consent_form_date TEXT,
  consent_form_signature TEXT,
  consent_form_type TEXT DEFAULT 'casa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Heridas
CREATE TABLE IF NOT EXISTS wounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  proposed_plan TEXT,
  initial_photos TEXT[], -- Array de URLs de fotos
  weight TEXT,
  height TEXT,
  temp TEXT,
  blood_pressure_systolic TEXT,
  blood_pressure_diastolic TEXT,
  pulse TEXT,
  heart_rate TEXT,
  respiratory_rate TEXT,
  oxygenation TEXT,
  glycemia_fasting TEXT,
  glycemia_postprandial TEXT,
  width TEXT,
  length TEXT,
  depth TEXT,
  tunneling TEXT,
  sinus_tract TEXT,
  undermining TEXT,
  pain_level INTEGER,
  shape TEXT,
  tissue_type JSONB,
  etiology JSONB,
  classification JSONB,
  characteristics JSONB,
  abi_arm TEXT,
  abi_left_toe TEXT,
  abi_left_pedal TEXT,
  abi_left_post_tibial TEXT,
  abi_right_toe TEXT,
  abi_right_pedal TEXT,
  abi_right_post_tibial TEXT,
  prognosis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Logs de Tratamiento
CREATE TABLE IF NOT EXISTS treatment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wound_id UUID REFERENCES wounds(id) ON DELETE CASCADE,
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fluid_leakage BOOLEAN DEFAULT FALSE,
  foreign_material BOOLEAN DEFAULT FALSE,
  slough_presence BOOLEAN DEFAULT FALSE,
  peripheral_tracts_measurements TEXT,
  prognosis TEXT,
  photos TEXT[], -- Array de URLs de fotos
  prontosan_solution BOOLEAN DEFAULT FALSE,
  prontosan_gel BOOLEAN DEFAULT FALSE,
  kerlix BOOLEAN DEFAULT FALSE,
  telfa BOOLEAN DEFAULT FALSE,
  avintra_administered BOOLEAN DEFAULT FALSE,
  notes TEXT,
  patient_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  voice_text TEXT,
  target_role TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tablas para Cotizaciones
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT,
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Diagnósticos Electrónicos
CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  date DATE NOT NULL,
  clinical_summary TEXT,
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT,
  recommendations TEXT,
  doctor_name TEXT,
  doctor_license TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Propuestas de Tratamiento
CREATE TABLE IF NOT EXISTS treatment_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  program TEXT NOT NULL,
  num_curations INTEGER NOT NULL,
  materials TEXT,
  investment DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending',
  nurse_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para Certificados Médicos
CREATE TABLE IF NOT EXISTS medical_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  doctor_name TEXT,
  doctor_license TEXT,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Tablas para E-commerce
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL
);

-- ==========================================
-- Habilitar RLS (Row Level Security)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para Pacientes
CREATE POLICY "Patients viewable by authenticated staff" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can insert patients" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update patients" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para Productos (E-commerce)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() AND profiles.role = 'Administrador'
    )
  );

-- Políticas para Notificaciones
CREATE POLICY "Staff can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can view notifications" ON notifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para Cotizaciones
CREATE POLICY "Staff can manage quotations" ON quotations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage quotation items" ON quotation_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Diagnósticos
CREATE POLICY "Staff can manage diagnostics" ON diagnostics
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Propuestas
CREATE POLICY "Staff can manage treatment proposals" ON treatment_proposals
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Certificados
CREATE POLICY "Staff can manage medical certificates" ON medical_certificates
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para E-commerce (Pedidos)
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- ==========================================
-- Habilitar Realtime
-- ==========================================
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quotations; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quotation_items; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE diagnostics; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE treatment_proposals; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE medical_certificates; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profiles; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE patients; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE wounds; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE treatment_logs; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE products; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE orders; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE order_items; EXCEPTION WHEN others THEN END;
END $$;

-- NOTA: Para el almacenamiento de imágenes, se deben crear los siguientes buckets en Supabase Storage:
-- 1. 'photos' (público): Para fotos de perfil y productos.
-- 2. 'wounds' (privado/protegido): Para fotos de heridas de pacientes.
-- 3. 'signatures' (protegido): Para firmas digitales.
