import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  getAllUsers,
  deleteUser,
  firebaseLogin,
  firebaseRegister
} from '../controllers/user.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/firebase-login', firebaseLogin);
router.post('/firebase-register', firebaseRegister);

// Private
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me', protect, upload.single('avatar'), updateMe);

// Admin
router.get('/', protect, adminOnly, getAllUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

export default router;