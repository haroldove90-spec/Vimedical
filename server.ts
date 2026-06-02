import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Admin Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sptgoslrysifacycncyc.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("Server: Initializing Supabase Admin Client...");
  console.log("Server: Supabase URL:", supabaseUrl);
  console.log("Server: Service Key present:", !!supabaseServiceKey);

  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  if (!supabaseAdmin) {
    console.error("Server: CRITICAL - SUPABASE_SERVICE_ROLE_KEY is missing!");
  } else {
    // Test the admin client
    supabaseAdmin.auth.admin.listUsers({ perPage: 1 }).then(({ error }) => {
      if (error) console.error("Server: Admin client test failed:", error.message);
      else console.log("Server: Admin client test successful.");
    });
  }

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API to create a user (Admin only)
  app.post("/api/create-user", async (req, res) => {
    console.log("API: POST /api/create-user received");
    try {
      if (!supabaseAdmin) {
        console.error("API: supabaseAdmin is NULL. Check SUPABASE_SERVICE_ROLE_KEY.");
        return res.status(500).json({ 
          error: "El servidor no tiene configurada la clave necesaria (SUPABASE_SERVICE_ROLE_KEY). Por favor, contacta al administrador." 
        });
      }

      const { email, password, fullName, role, license, phone, specialty } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Faltan datos obligatorios (email, password, nombre)." });
      }

      const trimmedEmail = email.trim();
      console.log(`API: Attempting to create user/profile for ${trimmedEmail}`);

      // 1. Try to create user in Supabase Auth
      console.log(`API: Calling auth.admin.createUser for ${trimmedEmail}...`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: trimmedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role }
      });

      let userId = authData?.user?.id;

      if (authError) {
        console.log(`API: Auth error for ${trimmedEmail}:`, authError.message, authError.status);
        if (authError.message.includes("already been registered") || authError.status === 422 || authError.message.includes("already exists")) {
          console.log(`API: User ${trimmedEmail} already exists in Auth. Searching for user ID...`);
          
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

          if (listError) {
            console.error("API: Error listing users:", listError);
            throw listError;
          }
          
          const users = listData?.users || [];
          const existingUser = users.find(u => u.email?.toLowerCase() === trimmedEmail.toLowerCase());
          
          if (!existingUser) {
            console.error(`API: User ${trimmedEmail} reported as existing but not found in the list.`);
            throw new Error("El usuario ya existe pero no se pudo encontrar en el registro interno.");
          }
          
          userId = existingUser.id;
          console.log(`API: Found existing user ID: ${userId}`);
          
          // Update password for existing user to match the one they just provided
          await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        } else {
          throw authError;
        }
      }

      if (!userId) throw new Error("No se pudo obtener el ID de usuario.");

      // 2. Create or update profile in profiles table
      console.log(`API: Ensuring profile exists for user_id ${userId}`);
      
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

      // Resilient profile creation and updating with auto-heal
      let profileData = null;
      let profileError = null;
      let currentPayload = { ...profileToUpsert };
      const maxRetries = 6;
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;
        try {
          // Check if profile exists
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
          
          // Check for undefined column error
          const isMissingColumn = 
            result.error.code === '42703' || 
            result.error.code === 'PGRST204' ||
            errorMsg.toLowerCase().includes('column') || 
            errorMsg.toLowerCase().includes('columna') || 
            errorMsg.toLowerCase().includes('schema cache');

          if (isMissingColumn) {
            // Try to parse the missing column
            const match = errorMsg.match(/column "([^"]+)"/) || 
                          errorMsg.match(/column '([^']+)'/) || 
                          errorMsg.match(/columna "([^"]+)"/) ||
                          errorMsg.match(/columna '([^']+)'/);

            if (match && match[1]) {
              const columnName = match[1];
              console.warn(`[Server Auto-Heal] Column '${columnName}' does not exist on table 'profiles'. Removing it and retrying...`);
              delete currentPayload[columnName];
              continue;
            } else {
              // Try removing suspects
              console.warn(`[Server Auto-Heal] Undefined column on profiles table. Clearing common culprits.`);
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
          
          break; // It's another type of error, break retry loop
        } catch (innerErr: any) {
          console.error(`[Server Auto-Heal] Exception in profile upsert:`, innerErr);
          profileError = innerErr;
          break;
        }
      }

      if (profileError) {
        console.error("API: Profile operation error:", profileError);
        throw profileError;
      }

      console.log(`API: Success for ${trimmedEmail}`);
      res.json({ user: { id: userId, email: trimmedEmail }, profile: profileData });
      
    } catch (err: any) {
      console.error("API: Unexpected error in /api/create-user:", err);
      // Safe error response that avoids circular JOSN structure throw
      res.status(500).json({ 
        error: err.message || "Error interno del servidor",
        details: err.code || err.details || err.hint || String(err)
      });
    }
  });

  // API to delete a user (Admin only)
  app.post("/api/delete-user", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });
    }

    const { userId } = req.body;
    console.log(`API: Attempting to delete user ${userId}`);

    try {
      // 1. Delete from profiles table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) console.warn("API: Error deleting profile:", profileError);

      // 2. Delete from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error("API: Error deleting auth user:", authError);
        throw authError;
      }

      console.log(`API: Successfully deleted user ${userId}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error("API: Unexpected error in /api/delete-user:", err);
      res.status(500).json({ error: err.message || "Error interno del servidor" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
