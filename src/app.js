
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import messageRoutes from './routes/message.routes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import subscriberRoutes from './routes/subscriberRoutes.js';
import testimonialRoutes from './routes/testimonialroutes.js';


dotenv.config();

const app = express();

// Trust Render's reverse proxy for client IPs and rate limiting.
app.set('trust proxy', 1);

// --- CORS configuration ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://aeonixtimepieces.vercel.app',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : []),
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- Security headers ---
app.use(helmet());

// --- Rate limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests, please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts, please try again later.',
  },
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// --- Body parsing ---
// Skip JSON parsing for multipart requests so file uploads are not consumed here.
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }

  express.json()(req, res, next);
});

// --- Health checks ---
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Watch Store API running',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// --- API routes ---
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/testimonials', testimonialRoutes);



app.get('/api/analytics/test', (req, res) => {
  res.json({ message: 'Analytics route is reachable' });
});

// --- Error handling ---
app.use((err, req, res, next) => {
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  console.error('API Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
});

export default app;
