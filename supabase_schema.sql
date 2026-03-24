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

-- Tabla para Comentarios Clínicos
CREATE TABLE IF NOT EXISTS clinical_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_role TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime para estas tablas
ALTER PUBLICATION supabase_realtime ADD TABLE quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE quotation_items;
ALTER PUBLICATION supabase_realtime ADD TABLE clinical_comments;

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

-- Tabla para Perfiles de Usuario (Admin, Doctor, Enfermero)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  username TEXT,
  password TEXT,
  phone TEXT,
  license TEXT,
  specialty TEXT,
  photo_url TEXT,
  bio TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime de forma segura (Evita el error de "already member")
DO $$
BEGIN
  -- Intentar añadir cada tabla individualmente
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quotations; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE quotation_items; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE clinical_comments; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE diagnostics; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE treatment_proposals; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE medical_certificates; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE nurses; EXCEPTION WHEN others THEN END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE profiles; EXCEPTION WHEN others THEN END;
END $$;
