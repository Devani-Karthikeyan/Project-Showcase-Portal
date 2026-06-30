import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String // File upload path or Base64 data URI
  },
  extraImages: [{
    type: String // File upload paths or Base64 data URIs
  }],
  demoUrl: {
    type: String
  },
  githubUrl: {
    type: String
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modules: [{
    type: String // e.g. ["SENG 31242"]
  }],
  department: {
    type: String,
    required: true
  },
  faculty: {
    type: String,
    required: true
  },
  university: {
    type: String,
    required: true,
    default: 'University of Computing'
  },
  status: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval'
  },
  previousStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected']
  },
  restricted: {
    type: Boolean,
    default: false // true = visible only to logged-in university users
  },
  featured: {
    type: Boolean,
    default: false // true = highlighted or top project
  },
  feedback: [feedbackSchema],
  likesCount: {
    type: Number,
    default: 0
  },
  bookmarksCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Project', projectSchema);
