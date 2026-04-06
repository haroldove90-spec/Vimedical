import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
