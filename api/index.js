const app = require('../server/server');
const { connectDB } = require('../server/src/config/db');
const User = require('../server/src/models/User');
const seedDatabase = require('../server/src/utils/seed');

let isInitialized = false;

module.exports = async (req, res) => {
  // Validate JWT_SECRET on cold start
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET environment variable must be configured with at least 32 characters in Vercel project settings.'
    });
  }

  try {
    // 1. Ensure database connection (reusing existing connection if active)
    await connectDB();

    // 2. Initial seed on newly deployed empty database (creates default campus admin, inventory, camps)
    if (!isInitialized) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Vercel Serverless] Database is empty. Running initial campus seed...');
        await seedDatabase(false);
      }
      isInitialized = true;
    }
  } catch (err) {
    console.error('[Vercel Serverless] Database connection error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI is set to a valid MongoDB Atlas connection string in Vercel environment variables, and Network Access in Atlas allows 0.0.0.0/0.',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }

  // 3. Delegate request to Express app
  return app(req, res);
};
