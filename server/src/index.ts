import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, getStorageType } from './db.js';
import authRoutes from './routes/auth.js';
import stateRoutes from './routes/state.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : '*';

app.use(cors({
  origin: corsOrigins === '*' ? '*' : corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'god-of-realms-backend',
    storage: getStorageType(),
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);

// Root fallback
app.get('/', (_req, res) => {
  res.send('⚔️ God of Realms Cloud Sync API is active.');
});

// Initialize database and start listening
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🏰 God of Realms API Server running on port ${PORT}`);
      console.log(`⚡ Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();
