import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reviewRoutes from './routes/review.routes.js';
import messageRoutes from './routes/message.routes.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// --- CORS must come first so preflight (OPTIONS) requests
// always get a response, even if later middleware would block/limit them ---
const allowedOrigins = [
  'http://localhost:5173',
  'https://aeonixtimepieces.vercel.app', // replace with your real deployed frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// --- Security headers ---
app.use(helmet());

// --- Rate limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' },
});
app.use(limiter);
app.use('/api/auth', authLimiter);

// --- Body parsing ---
// Only parse JSON if content-type is application/json (skip multipart)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) return next();
  express.json()(req, res, next);
});

// --- Routes ---
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Watch Store API running' }));

// --- CORS error handler ---
// Without this, a blocked origin throws an unhandled error that can crash
// the request instead of returning a clean 403
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

export default app;