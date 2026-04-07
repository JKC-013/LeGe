import express from "express";
import cors from "cors";
import path from "path";
import cron from "node-cron";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // CORS configuration - allow requests from Netlify and localhost
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://lege-backend.onrender.com',
    process.env.FRONTEND_URL || ''  // Add Netlify URL as env var
  ].filter(Boolean);

  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('netlify.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Cron job to keep database awake every 7 days
  // "0 0 * * 0" runs every Sunday at midnight
  cron.schedule("0 0 * * 0", async () => {
    console.log("Running cron job to keep database awake...");
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      if (supabaseUrl) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        console.log(`Supabase ping status: ${response.status}`);
      } else {
        console.log("Supabase URL not configured, skipping ping.");
      }
    } catch (e) {
      console.error("Failed to ping Supabase:", e);
    }
  });

  // For production: just serve API (no frontend)
  // Frontend is deployed separately to Netlify
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found. This is the API server.' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎵 LeGe API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
  });
}

startServer();

