import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  avatarUrl: {
    type: String
  },
  role: {
    type: String,
    enum: ['student', 'recruiter', 'lecturer', 'admin'],
    default: 'student'
  },
  title: {
    type: String
  },
  bio: {
    type: String
  },
  company: {
    type: String // Used primarily for recruiters
  },
  graduationYear: {
    type: Number // Used for students/alumni
  },
  department: {
    type: String // e.g. "Software Engineering"
  },
  faculty: {
    type: String // e.g. "Computing"
  },
  university: {
    type: String
  },
  github: {
    type: String
  },
  linkedin: {
    type: String
  },
  portfolio: {
    type: String
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      activity: { type: Boolean, default: true },
      followers: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      summary: { type: Boolean, default: false },
      projectUpdates: { type: Boolean, default: true },
      commentsMentions: { type: Boolean, default: true },
      likesReactions: { type: Boolean, default: true },
      systemUpdates: { type: Boolean, default: false },
      dndEnabled: { type: Boolean, default: false },
      dndDuration: { type: String, default: '1 hour' },
      dndUntil: { type: Date }
    },
    appearance: {
      theme: { type: String, default: 'light' },
      accent: { type: String, default: 'indigo' },
      fontSize: { type: String, default: 'medium' }
    }
  },
  followedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for checking if the user is an alumnus
userSchema.virtual('isAlumni').get(function() {
  if (this.role !== 'student') return false;
  const currentYear = new Date().getFullYear();
  return this.graduationYear && this.graduationYear < currentYear;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export default mongoose.model('User', userSchema);
