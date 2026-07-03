import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', process.env.CLIENT_URL], credentials: true }));

// Only parse JSON if content-type is application/json (skip multipart)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) return next();
  express.json()(req, res, next);
});

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Watch Store API running' }));

export default app;