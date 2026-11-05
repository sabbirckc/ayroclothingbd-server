import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import clothesRoutes from './routes/clothes.js';
import ordersRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';

const app = express();
const PORT = process.env.PORT || 8000;

// Allowed client origins for CORS
const clientUrls = (process.env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  ...clientUrls
];

    app.use(cors({
      origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
    return callback(null, true); // Dev-friendly fallback
    },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Database connection middleware
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (dbErr) {
      console.error('Database connection middleware error:', dbErr);
      res.status(500).json({ success: false, error: 'Failed to establish database connection.' });
    }
  });

  // Root API Health Check
  app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'ClothSpace Peer-to-Peer Apparel Marketplace Server API is operating smoothly.',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/clothes', clothesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/wishlist', wishlistRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl} not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

// Start Server for local development
if (!process.env.VERCEL) {
  async function startServer() {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`ClothSpace API Server listening on port ${PORT}`);
        console.log(`Endpoint: http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Server boot failed:', err);
      process.exit(1);
    }
  }

  startServer();
}

export default app;
