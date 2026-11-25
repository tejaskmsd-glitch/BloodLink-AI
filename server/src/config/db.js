const mongoose = require('mongoose');

let mongoMemoryServer = null;
let connectionPromise = null;

const connectDB = async () => {
  // If already connected, reuse existing active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If already connecting, return existing in-flight promise
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-blood-bank';
    const isProduction = process.env.NODE_ENV === 'production';
    const isCloudUri = mongoUri.includes('mongodb+srv') || (!mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1'));

    // Mask credentials for secure logging in production
    const safeUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:*****@');
    console.log(`Connecting to MongoDB at: ${safeUri}...`);

    // In production or when connecting to cloud Atlas, use a generous 15s timeout
    const timeoutMS = isProduction || isCloudUri ? 15000 : 3000;

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: timeoutMS,
        maxPoolSize: isProduction ? 10 : 5
      });
      console.log('MongoDB connected successfully.');
      return mongoose.connection;
    } catch (err) {
      console.warn('Standard MongoDB connection failed or timed out:', err.message);

      if (!isProduction) {
        console.log('Starting in-memory MongoDB fallback server...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create();
          const memUri = mongoMemoryServer.getUri();
          await mongoose.connect(memUri);
          console.log(`In-memory MongoDB connected successfully at ${memUri}`);
          return mongoose.connection;
        } catch (memErr) {
          console.error('Failed to start in-memory MongoDB:', memErr.message);
          throw memErr;
        }
      } else {
        console.error('❌ Production MongoDB connection error. Please verify MONGO_URI in your environment variables.');
        throw err;
      }
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
