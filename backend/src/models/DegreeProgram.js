import mongoose from 'mongoose';

const degreeProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  universities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'University'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('DegreeProgram', degreeProgramSchema);
