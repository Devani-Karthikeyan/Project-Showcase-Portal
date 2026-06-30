import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The Recruiter
  },
  followedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // The Student
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a recruiter can only follow a student once
followSchema.index({ followerId: 1, followedId: 1 }, { unique: true });

export default mongoose.model('Follow', followSchema);
