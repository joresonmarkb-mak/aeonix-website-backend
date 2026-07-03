import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markOrderAsPaid,
} from '../controllers/order.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Private
router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin
router.get('/', protect, adminOnly, getAllOrders);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/pay', protect, adminOnly, markOrderAsPaid);

export default router;