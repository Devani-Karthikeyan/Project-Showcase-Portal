import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Configuration imports
import { connectDB } from './config/db.js';
import { initializeEventHandlers } from './services/notificationService.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Setup environment variables
dotenv.config();

// ESM __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and event listeners
connectDB();
initializeEventHandlers();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.VITE_FRONTEND_URL,
  'https://project-showcase-portal-nine.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    || /^https:\/\/[-a-z0-9]+\.vercel\.app$/i.test(origin)
    || /^https:\/\/[-a-z0-9]+\.netlify\.app$/i.test(origin)
    || /^https:\/\/[-a-z0-9]+\.railway\.app$/i.test(origin)
    || /^https:\/\/[-a-z0-9]+\.render\.com$/i.test(origin);
};

// Express Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Set limits high enough to receive base64 representations of images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist and map static folder path
const uploadsFolder = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}
app.use('/uploads', express.static(uploadsFolder));

// Route bindings
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/admin', adminRoutes);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Uncaught API Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API Endpoint not found: ${req.baseUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('💥 Uncaught Express Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`📡 Real-time notification gateway (SSE) ready at: http://localhost:${PORT}/api/notifications/stream`);
  });
}

export { app, server };