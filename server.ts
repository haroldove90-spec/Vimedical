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
    if (!supabaseAdmin) {
      console.error("API: supabaseAdmin is NULL. Check SUPABASE_SERVICE_ROLE_KEY.");
      return res.status(500).json({ error: "El servidor no está configurado correctamente (falta la clave de servicio)." });
    }

    const { email, password, fullName, role, license, phone, specialty } = req.body;
    console.log(`API: Attempting to create user/profile for ${email}`);

    try {
      // 1. Try to create user in Supabase Auth
      console.log(`API: Calling auth.admin.createUser for ${email}...`);
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role }
      });

      let userId = authData?.user?.id;

      if (authError) {
        console.log(`API: Auth error for ${email}:`, authError.message, authError.status);
        if (authError.message.includes("already been registered") || authError.status === 422) {
          console.log(`API: User ${email} already exists in Auth. Searching for user ID...`);
          
          // Try to find the user by email with a timeout
          const listUsersPromise = supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout al listar usuarios de Auth")), 15000)
          );
          
          const { data: listData, error: listError } = await Promise.race([
            listUsersPromise,
            timeoutPromise
          ]) as any;

          if (listError) {
            console.error("API: Error listing users:", listError);
            throw listError;
          }
          
          const users = listData?.users || [];
          console.log(`API: Found ${users.length} users in Auth system.`);
          
          const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (!existingUser) {
            console.error(`API: User ${email} reported as existing but not found in the list.`);
            throw new Error("El usuario ya existe pero no se pudo encontrar en la lista. Por favor, contacta a soporte.");
          }
          
          userId = existingUser.id;
          console.log(`API: Found existing user ID: ${userId}`);
          
          // Update the password for the existing user to ensure they can log in
          console.log(`API: Updating password for existing user ${email}`);
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
          if (updateError) console.warn("API: Could not update password for existing user:", updateError);
        } else {
          throw authError;
        }
      }

      if (!userId) throw new Error("No se pudo obtener el ID de usuario.");

      // 2. Create or update profile in profiles table
      console.log(`API: Checking for existing profile for user_id ${userId}`);
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) console.warn("API: Error checking existing profile:", checkError);

      let profileData, profileError;

      if (existingProfile) {
        console.log(`API: Updating existing profile ${existingProfile.id}`);
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: fullName,
            email,
            role,
            license,
            phone,
            specialty,
            status: 'active'
          })
          .eq('user_id', userId)
          .select()
          .single();
        profileData = data;
        profileError = error;
      } else {
        console.log(`API: Inserting new profile for user_id ${userId}`);
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .insert([{
            user_id: userId,
            full_name: fullName,
            email,
            role,
            license,
            phone,
            specialty,
            status: 'active'
          }])
          .select()
          .single();
        profileData = data;
        profileError = error;
      }

      if (profileError) {
        console.error("API: Profile operation error:", profileError);
        throw profileError;
      }

      console.log(`API: Successfully created/updated profile for ${email}`);
      res.json({ user: { id: userId, email }, profile: profileData });
      
    } catch (err: any) {
      console.error("API: Unexpected error in /api/create-user:", err);
      res.status(500).json({ error: err.message || "Error interno del servidor" });
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
