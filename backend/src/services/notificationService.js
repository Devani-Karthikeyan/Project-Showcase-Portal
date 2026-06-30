import eventBus, { EVENTS } from '../config/eventBus.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendRealtimeNotification } from '../config/notificationManager.js';

/**
 * Creates a notification in the database and pushes it to active SSE clients if online.
 */
async function createAndSendNotification({ recipientId, senderId, type, projectId, message }) {
  try {
    // Check recipient's notification preferences
    const recipient = await User.findById(recipientId);
    if (!recipient) return null;

    const prefs = recipient.settings?.notifications;
    if (prefs) {
      // 1. Check Do Not Disturb (DND)
      if (prefs.dndEnabled && prefs.dndUntil && new Date(prefs.dndUntil) > new Date()) {
        return null; // User has paused notifications
      }

      // 2. Check follower notifications
      if (type === 'user_followed' && prefs.followers === false) {
        return null;
      }
      
      // 3. Check Likes & Reactions
      if (type === 'project_liked' && prefs.likesReactions === false) {
        return null;
      }

      // 4. Check Comments & Mentions
      if (type === 'feedback_added' && prefs.commentsMentions === false) {
        return null;
      }

      // 5. Check Project Updates (created / approved)
      const projectUpdateTypes = ['project_created', 'project_approved'];
      if (projectUpdateTypes.includes(type) && prefs.projectUpdates === false) {
        return null;
      }

      // 6. General check for activity settings (fallback)
      const activityTypes = ['project_liked', 'project_approved', 'feedback_added', 'project_created'];
      if (activityTypes.includes(type) && prefs.activity === false) {
        return null;
      }
    }

    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      projectId,
      message
    });

    // Populate sender details for frontend usage
    const populated = await Notification.findById(notification._id)
      .populate('senderId', 'name avatarUrl role')
      .populate('projectId', 'title thumbnail');

    // Push real-time over SSE
    sendRealtimeNotification(recipientId, populated);
    return populated;
  } catch (err) {
    console.error('Error creating event-driven notification:', err);
  }
}

