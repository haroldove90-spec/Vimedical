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
    const { email, password, fullName, role, license, phone, specialty } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Faltan datos obligatorios (email, password, nombre)." });
    }

    const trimmedEmail = email.trim();

    // 1. Try to create user in Supabase Auth via Admin Client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    let userId = authData?.user?.id;

    if (authError) {
      if (authError.message.includes("already been registered") || authError.status === 422 || authError.message.includes("already exists")) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          throw listError;
        }
        
        const users = listData?.users || [];
        const existingUser = users.find(u => u.email?.toLowerCase() === trimmedEmail.toLowerCase());
        
        if (!existingUser) {
          throw new Error("El usuario ya existe pero no se pudo encontrar en el registro interno.");
        }
        
        userId = existingUser.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      } else {
        throw authError;
      }
    }

    if (!userId) throw new Error("No se pudo obtener el ID de usuario.");

    // 2. Create or update profile in profiles table
    const profileToUpsert: any = {
      user_id: userId,
      full_name: fullName,
      email: trimmedEmail,
      role: role || 'Enfermero',
      license: license || '',
      phone: phone || '',
      specialty: specialty || '',
      status: 'active'
    };

    let profileData = null;
    let profileError = null;
    let currentPayload = { ...profileToUpsert };
    const maxRetries = 6;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const { data: existing, error: selectError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (selectError) {
          profileError = selectError;
          break;
        }

        let result;
        if (existing) {
          result = await supabaseAdmin
            .from('profiles')
            .update(currentPayload)
            .eq('user_id', userId)
            .select()
            .single();
        } else {
          result = await supabaseAdmin
            .from('profiles')
            .insert(currentPayload)
            .select()
            .single();
        }

        if (!result.error) {
          profileData = result.data;
          profileError = null;
          break; // Success!
        }

        profileError = result.error;
        const errorMsg = result.error.message || "";
        
        // Handle database table columns mismatch (Auto-healing)
        const isMissingColumn = 
          result.error.code === '42703' || 
          result.error.code === 'PGRST204' ||
          errorMsg.toLowerCase().includes('column') || 
          errorMsg.toLowerCase().includes('columna') || 
          errorMsg.toLowerCase().includes('schema cache');

        if (isMissingColumn) {
          const match = errorMsg.match(/column "([^"]+)"/) || 
                        errorMsg.match(/column '([^']+)'/) || 
                        errorMsg.match(/columna "([^"]+)"/) ||
                        errorMsg.match(/columna '([^']+)'/);

          if (match && match[1]) {
            const columnName = match[1];
            delete currentPayload[columnName];
            continue;
          } else {
            const suspects = ['license', 'specialty', 'phone', 'status', 'signature_url', 'bio'];
            let removedAny = false;
            for (const suspect of suspects) {
              if (suspect in currentPayload) {
                delete currentPayload[suspect];
                removedAny = true;
              }
            }
            if (removedAny) continue;
          }
        }
        
        break;
      } catch (innerErr: any) {
        profileError = innerErr;
        break;
      }
    }

    if (profileError) {
      throw profileError;
    }

    res.status(200).json({ user: { id: userId, email: trimmedEmail }, profile: profileData });
    
  } catch (err: any) {
    res.status(500).json({ 
      error: err.message || "Error interno del servidor",
      details: err.code || err.details || err.hint || String(err)
    });
  }
}
