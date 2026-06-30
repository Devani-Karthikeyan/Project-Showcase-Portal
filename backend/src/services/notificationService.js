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

/**
 * Initializes subscribers to the EventBus.
 */
export function initializeEventHandlers() {
  console.log('⚡ Event Handlers initializing...');

  // 1. PROJECT_CREATED -> Notify Lecturers in same department
  eventBus.on(EVENTS.PROJECT_CREATED, async ({ project, student }) => {
    try {
      // Find lecturers who can approve this project (same department / faculty)
      const lecturers = await User.find({
        role: 'lecturer',
        department: student.department
      });

      for (const lecturer of lecturers) {
        await createAndSendNotification({
          recipientId: lecturer._id,
          senderId: student._id,
          type: 'project_created',
          projectId: project._id,
          message: `${student.name} submitted a new project "${project.title}" for approval.`
        });
      }
    } catch (err) {
      console.error('Error handling PROJECT_CREATED event:', err);
    }
  });

  // 2. PROJECT_LIKED -> Notify Student
  eventBus.on(EVENTS.PROJECT_LIKED, async ({ project, liker }) => {
    try {
      // Don't notify if liking own project (though recruiters are likes-only)
      if (project.studentId.toString() === liker._id.toString()) return;

      await createAndSendNotification({
        recipientId: project.studentId,
        senderId: liker._id,
        type: 'project_liked',
        projectId: project._id,
        message: `${liker.name} liked your project "${project.title}".`
      });
    } catch (err) {
      console.error('Error handling PROJECT_LIKED event:', err);
    }
  });

  // 3. PROJECT_APPROVED -> Notify Student
  eventBus.on(EVENTS.PROJECT_APPROVED, async ({ project, reviewer }) => {
    try {
      await createAndSendNotification({
        recipientId: project.studentId,
        senderId: reviewer._id,
        type: 'project_approved',
        projectId: project._id,
        message: `Your project "${project.title}" has been approved by ${reviewer.name} and is now publicly visible.`
      });
    } catch (err) {
      console.error('Error handling PROJECT_APPROVED event:', err);
    }
  });

  // 4. FEEDBACK_ADDED -> Notify Student
  eventBus.on(EVENTS.FEEDBACK_ADDED, async ({ project, lecturer, feedback }) => {
    try {
      await createAndSendNotification({
        recipientId: project.studentId,
        senderId: lecturer._id,
        type: 'feedback_added',
        projectId: project._id,
        message: feedback.comment
      });
    } catch (err) {
      console.error('Error handling FEEDBACK_ADDED event:', err);
    }
  });

  // 5. USER_FOLLOWED -> Notify Student
  eventBus.on(EVENTS.USER_FOLLOWED, async ({ follower, followed }) => {
    try {
      await createAndSendNotification({
        recipientId: followed._id,
        senderId: follower._id,
        type: 'user_followed',
        message: `${follower.name} started following you.`
      });
    } catch (err) {
      console.error('Error handling USER_FOLLOWED event:', err);
    }
  });

  console.log('⚡ Event Handlers listening.');
}
export default initializeEventHandlers;
