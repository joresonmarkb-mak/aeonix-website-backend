import express from 'express';
import { subscribe, getSubscribers, deleteSubscriber, notifyNewStock } from '../controllers/subscriberController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', subscribe);
router.get('/', protect, adminOnly, getSubscribers);
router.delete('/:id', protect, adminOnly, deleteSubscriber);
router.post('/notify', protect, adminOnly, notifyNewStock);

export default router;
