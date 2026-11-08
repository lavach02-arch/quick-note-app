import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import noteRoutes from './routes/noteRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files if available
const frontendPublicDir = path.resolve(__dirname, '../../frontend/public');
app.use(express.static(frontendPublicDir));

// Healthcheck & API Info
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Quick Note Application REST API is healthy and operational.',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/notes (Search, filter, sort)',
      'GET /api/notes/:id',
      'POST /api/notes',
      'PUT /api/notes/:id',
      'PATCH /api/notes/:id/pin',
      'DELETE /api/notes/:id',
    ],
  });
});

// API Routes
app.use('/api', noteRoutes);

// Fallback for API routes (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint [${req.method}] ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: err.message,
  });
});

export default app;
