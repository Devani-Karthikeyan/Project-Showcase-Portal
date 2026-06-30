import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  streamNotifications
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get recent notifications list
router.get('/', protect, getNotifications);

// Mark single notification as read
router.put('/:id/read', protect, markAsRead);

// Mark all user notifications as read
router.put('/read-all', protect, markAllAsRead);

// Establish SSE stream endpoint
router.get('/stream', protect, streamNotifications);

export default router;
