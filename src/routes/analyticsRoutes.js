import express from 'express';
import { getMonthlyPerformance, getInventorySummary } from '../controllers/analyticsController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/monthly', protect, adminOnly, getMonthlyPerformance);
router.get('/inventory', protect, adminOnly, getInventorySummary);

export default router;
