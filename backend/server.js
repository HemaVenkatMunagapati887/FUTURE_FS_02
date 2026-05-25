import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configurations
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';

// Middlewares
import { errorHandler } from './middlewares/errorMiddleware.js';

// Initialize environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security HTTP headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration - critical for cookie-based JWT auth
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Blocked by CORS policy'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors({
   origin: "https://your-vercel-url.vercel.app",
   credentials: true
}));

// Global API rate limiter (prevent abuse)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});
app.use('/api', globalLimiter);

// Stricter rate limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Built-in request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Route Engines
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communications', communicationRoutes);

// Root test endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'CRM API is running', version: '2.0.0' });
});

// Fallback for unmatched API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found`,
  });
});

// Register global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CRM Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
