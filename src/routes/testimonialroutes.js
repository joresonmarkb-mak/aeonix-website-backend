import express from 'express';
import { getTestimonials, getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonialcontroller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getTestimonials);
router.get('/all', protect, adminOnly, getAllTestimonials);
router.post('/', protect, adminOnly, upload.single('image'), createTestimonial);
router.put('/:id', protect, adminOnly, upload.single('image'), updateTestimonial);
router.delete('/:id', protect, adminOnly, deleteTestimonial);

export default router;