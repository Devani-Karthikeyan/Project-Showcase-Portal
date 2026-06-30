import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // User who triggered the action, can be empty for system/anonymous actions
  },
  type: {
    type: String,
    enum: ['project_created', 'project_liked', 'project_approved', 'feedback_added', 'user_followed'],
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project' // Associated project if applicable
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast query of unread notifications for a user
notificationSchema.index({ recipientId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
