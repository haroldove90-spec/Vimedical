import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // CORS configurations
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sptgoslrysifacycncyc.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return res.status(500).json({ 
      error: "El servidor no tiene configurada la clave necesaria (SUPABASE_SERVICE_ROLE_KEY) en Vercel." 
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { userId, newPassword } = req.body;
    
    if (!userId || !newPassword) {
      return res.status(400).json({ error: "Faltan datos obligatorios (userId, newPassword)." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    // Update user password in Supabase Auth via Admin Client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (authError) {
      throw authError;
    }

    res.status(200).json({ success: true, message: "Contraseña actualizada exitosamente por el administrador." });
    
  } catch (err: any) {
    res.status(500).json({ 
      error: err.message || "Error interno del servidor",
      details: err.code || err.details || err.hint || String(err)
    });
  }
}
