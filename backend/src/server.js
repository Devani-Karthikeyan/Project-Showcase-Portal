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
import notificationRoutes from './routes/notificationRoutes.js';



// Setup environment variables
dotenv.config();

// ESM __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and event listeners
connectDB();
initializeEventHandlers();

const app = express();

// Express Middlewares
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    // Allow localhost connections from any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS policy'), false);
  },
  credentials: true
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
app.use('/api/notifications', notificationRoutes);

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