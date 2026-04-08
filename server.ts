import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Supabase Admin Client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sptgoslrysifacycncyc.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabaseAdmin = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null;

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API to create a user (Admin only)
  app.post("/api/create-user", async (req, res) => {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" });
    }

    const { email, password, fullName, role, license, phone, specialty } = req.body;

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create profile in profiles table
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([{
            user_id: authData.user.id,
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

        if (profileError) throw profileError;

        res.json({ user: authData.user, profile: profileData });
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from the 'dist' directory in production
    // Use path.resolve("dist") which is robust in bundled environments
    const distPath = path.resolve("dist");
    app.use(express.static(distPath));

    // Handle SPA routing: serve index.html for all non-API routes
    app.get("*", (req, res) => {
      // Prevent infinite loops or serving index.html for missing assets
      if (req.path.startsWith('/assets/')) {
        return res.status(404).send('Asset not found');
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
