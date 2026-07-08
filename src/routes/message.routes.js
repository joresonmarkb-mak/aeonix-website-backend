import express from 'express';
import { createMessage,getAllMessages, updateMessageStatus } from '../controllers/message.controller.js';
import {protect, adminOnly} from '../middleware/auth.js';

const router = express.Router();


router.post('/createMessage', createMessage);
router.get('/getAllMessages', protect, adminOnly, getAllMessages);
router.put('/updateMessageStatus/:id', protect, adminOnly, updateMessageStatus);
export default router;
