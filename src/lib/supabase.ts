import { createClient } from '@supabase/supabase-js';

// Usamos las variables de entorno si existen, o los valores directos proporcionados para el prototipo
console.log('Supabase: Initializing client');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sptgoslrysifacycncyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdGdvc2xyeXNpZmFjeWNuY3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDk4MDcsImV4cCI6MjA4ODcyNTgwN30.HAc0HVh2_h0UdSXt1McVpNnxUjtPqUkekD5h-zMS_zs';

console.log('Supabase: URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase: Client initialized');
