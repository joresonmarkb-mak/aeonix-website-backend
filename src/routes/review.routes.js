import express from 'express';
import { createReview, getProductReviews, canReview, getAllReviews, deleteReview } from '../controllers/review.controller.js';
import { upload } from '../config/cloudinary.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', protect, adminOnly, getAllReviews);
router.get('/can-review/:productId', protect, canReview);

// ← dynamic routes LAST
router.get('/:productId', getProductReviews);
router.post('/', protect, upload.array('images', 3), createReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;