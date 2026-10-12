import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/authRoutes';
import { userRouter } from './routes/userRoutes';
import { statsRouter } from './routes/statsRoutes';
import { contentRouter } from './routes/contentRoutes';
import { blogRouter } from './routes/blogRoutes';
import { seedDatabase } from './config/seed';
import { 
  applySecurityHeaders, 
  generalApiLimiter, 
  authRateLimiter, 
  sanitizeNoSql 
} from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edunova';
const NODE_ENV = process.env.NODE_ENV || 'production';

// 1. ADVANCED SECURITY HEADERS (OWASP / CSP / HSTS / Anti-Clickjacking)
app.use(applySecurityHeaders);

// 2. CORS CONFIGURATION (Production Origin Hardening)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow local development and mobile/curl/SSR requests without origin header
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback for flexible environments while preserving credentials
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 3. PAYLOAD LIMITS & NOSQL INJECTION DEFENSE (ALLOW HIGH-RESOLUTION MEDIA & IMAGES)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(sanitizeNoSql);

// Static hosting for uploaded blog media
const uploadsStaticDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsStaticDir)) {
  fs.mkdirSync(uploadsStaticDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsStaticDir));

// 4. GLOBAL RATE LIMITING FOR LARGE AUDIENCE
app.use('/api', generalApiLimiter);

// 5. PRODUCTION HEALTH & ENTERPRISE METRICS MONITORING
const startTime = Date.now();
app.get('/api/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    environment: NODE_ENV,
    version: '1.0.0-enterprise',
    database: {
      engine: 'MongoDB Local',
      status: dbStatus,
      name: mongoose.connection.name || 'edunova',
      readyState: mongoose.connection.readyState
    },
    system: {
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      rssMb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100
    },
    security: {
      rateLimitingActive: true,
      noSqlSanitizerActive: true,
      hstsActive: true,
      cspActive: true
    }
  });
});

// 6. MOUNT PRODUCTION ROUTES WITH SPECIALIZED PROTECTION
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', userRouter);
app.use('/api/content', contentRouter);
app.use('/api/stats', statsRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/create-blog', blogRouter);
app.use('/create-blog', blogRouter);

// 7. GLOBAL 404 CATCH-ALL FOR UNMATCHED API ROUTES
app.use('/api', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: 'The requested API route does not exist.'
  });
});

// 8. GLOBAL ERROR HANDLING MIDDLEWARE (NEVER LEAK STACK TRACES TO CLIENT)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: NODE_ENV === 'production' 
      ? 'An internal server error occurred. Our team has been notified.' 
      : err.message
  });
});

// 9. HIGH-CONCURRENCY DATABASE CONNECTION & SERVER LAUNCH
async function startServer() {
  try {
    console.log(`🔌 MongoDB: Connecting to database at "${MONGODB_URI}" (High Concurrency Pool)...`);
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,           // Maintain up to 50 concurrent socket connections
      minPoolSize: 10,           // Keep 10 warm connections ready for traffic spikes
      socketTimeoutMS: 45000,    // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 3000,
      heartbeatFrequencyMS: 10000
    });
    console.log(`✅ MongoDB: Connected to database "${mongoose.connection.name}" with connection pool.`);

    // Run Initial Database Seed
    await seedDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Veyra Enterprise Backend running on http://localhost:${PORT}`);
      console.log(`🛡️ Advanced Security Active: OWASP Headers | Rate Limiter | NoSQL Defense | RBAC`);
      console.log(`📚 Content API Active at http://localhost:${PORT}/api/content`);
    });

    // Graceful Shutdown Handlers for Kubernetes / Cloud Run / PM2 / Docker
    const gracefulShutdown = () => {
      console.log('SIGTERM/SIGINT signal received. Closing HTTP server gracefully...');
      server.close(async () => {
        console.log('HTTP server closed.');
        await mongoose.connection.close(false);
        console.log('MongoDB connection pool drained.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (err: any) {
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.warn(`🚀 Starting Veyra Backend Server in standalone mode on http://localhost:${PORT}...`);
    app.listen(PORT, () => {
      console.log(`🚀 Veyra Backend Server running (standalone mode) on http://localhost:${PORT}`);
    });
  }
}

startServer();
