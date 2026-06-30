import Notification from '../models/Notification.js';
import { registerClient } from '../config/notificationManager.js';

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id })
      .populate('senderId', 'name avatarUrl role')
      .populate('projectId', 'title thumbnail')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Server error retrieving notifications.' });
  }
}

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ message: 'Server error updating notification.' });
  }
}

/**
 * Mark all notifications as read for current user
 * PUT /api/notifications/read-all
 */
export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ message: 'Server error updating notifications.' });
  }
}

/**
 * Establish a Server-Sent Events (SSE) stream for real-time notifications
 * GET /api/notifications/stream
 */
export function streamNotifications(req, res) {
  const userId = req.user.id;

  const origin = req.headers.origin;
  const allowedOrigin = origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
    ? origin
    : (process.env.FRONTEND_URL || 'http://localhost:5173');

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': allowedOrigin
  });

  // Write initial connection confirmation message
  res.write(`data: ${JSON.stringify({ connected: true, userId })}\n\n`);

  // Register client in the connection manager
  registerClient(userId, res);

  console.log(`🔌 SSE Stream established for user: ${userId}`);
}
