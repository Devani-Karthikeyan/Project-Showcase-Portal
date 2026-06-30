import mongoose from 'mongoose';
import seedDatabase from './seed.js';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_showcase';
  
  try {
    console.log(`🔌 Attempting connection to MongoDB at: ${uri.split('@').pop()}`); // Don't log credentials if any
    
    // Connect with timeout configuration so it fails fast if not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 
    });
    console.log(`📡 MongoDB Connected: ${mongoose.connection.host}`);
    await seedDatabase();
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Falling back: Attempting to start In-Memory MongoDB Server...');
    
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri();
      
      console.log('⚙️ In-Memory MongoDB Server running at:', fallbackUri);
      await mongoose.connect(fallbackUri);
      console.log('📡 Connected to Fallback In-Memory MongoDB.');
      await seedDatabase();
    } catch (fallbackErr) {
      console.error('❌ Fallback connection failed:', fallbackErr.message);
      console.error('🚨 Please make sure MongoDB is running or specify MONGODB_URI in your .env file.');
      process.exit(1);
    }
  }
}

export default connectDB;
