import express from "express";
import cors from "cors";
import path from "path";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";

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

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabase = supabaseUrl && supabaseKey 
    ? createClient(supabaseUrl, supabaseKey)
    : null;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Cron job to keep database awake every 30 minutes
  // Prevents Render free tier from spinning down
  const keepDatabaseAlive = async () => {
    console.log(`[${new Date().toISOString()}] Running keep-alive cron job...`);
    try {
      if (!supabase) {
        console.log("Supabase not configured, skipping keep-alive.");
        return;
      }

      // Query songs table to keep database connection active
      const { data, error } = await supabase
        .from('songs')
        .select('count')
        .limit(1);

      if (error) {
        console.error(`[CRON] Error querying database: ${error.message}`);
      } else {
        console.log(`[CRON] Database keep-alive successful - Songs count retrieved`);
      }
    } catch (e: any) {
      console.error(`[CRON] Failed to keep database alive: ${e.message}`);
    }
  };

  // Run keep-alive every 30 minutes
  cron.schedule("*/30 * * * *", keepDatabaseAlive);
  console.log("✓ Database keep-alive scheduled every 30 minutes");

  // Also run once on startup after a short delay
  setTimeout(() => {
    console.log("Running initial keep-alive on startup...");
    keepDatabaseAlive();
  }, 2000);

  // For production: just serve API (no frontend)
  // Frontend is deployed separately to Netlify
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found. This is the API server.' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎵 LeGe API Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`⏰ Database keep-alive: Every 30 minutes`);
  });
}

startServer();

