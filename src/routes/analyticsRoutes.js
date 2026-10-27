import express from 'express';
import {
  getMonthlyPerformance,
  getInventorySummary,
  getBestByCategory,
  getSalesByChannel,
} from '../controllers/analyticsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/monthly', protect, adminOnly, getMonthlyPerformance);
router.get('/inventory', protect, adminOnly, getInventorySummary);
router.get('/best-by-category', protect, adminOnly, getBestByCategory);
router.get('/channels', protect, adminOnly, getSalesByChannel);

export default router;