import express from 'express';
import { createMessage,getAllMessages, updateMessageIsRead, updateMessageResponse } from '../controllers/message.controller.js';
import {protect, adminOnly} from '../middleware/auth.js';

const router = express.Router();


router.post('/createMessage', createMessage);
router.get('/getAllMessages', protect, adminOnly, getAllMessages);
router.put('/updateMessageIsRead/:id', protect, adminOnly, updateMessageIsRead);
router.put('/updateMessageResponse/:id', protect, adminOnly, updateMessageResponse);

export default router;
