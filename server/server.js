const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./src/config/db');
const { errorHandler } = require('./src/middleware/errorMiddleware');
const User = require('./src/models/User');
const seedDatabase = require('./src/utils/seed');
const ensureDemoAccounts = require('./src/utils/ensureDemoAccounts');

// Load environment variables (from root .env and server/.env)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();

// Body Parser & CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');

    // 1. Allow wildcard if configured
    if (envOrigins.includes('*')) {
      return callback(null, true);
    }

    // 2. Allow explicit origins from CLIENT_URL
    if (envOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 3. Allow Vercel preview & production deployments (*.vercel.app)
    if (normalizedOrigin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // 4. In development, allow any localhost or 127.0.0.1 port to prevent port mismatch issues
    if (isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// Ensure database connection in both serverless & traditional server lifecycles
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request lifecycle:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection unavailable. Please verify MONGO_URI configuration.'
    });
  }
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/donors', require('./src/routes/donorRoutes'));
app.use('/api/hospitals', require('./src/routes/hospitalRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));
app.use('/api/requests', require('./src/routes/requestRoutes'));
app.use('/api/demand', require('./src/routes/demandRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/donations', require('./src/routes/donationRoutes'));
app.use('/api/camps', require('./src/routes/campRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));
app.use('/api/thresholds', require('./src/routes/thresholdRoutes'));
app.use('/api/nearby-facilities', require('./src/routes/nearbyFacilityRoutes'));
app.use('/api/documents', require('./src/routes/documentRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'UP',
    system: 'SMART BLOOD BANK API Engine',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  await connectDB();
  
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Database is empty. Running seed script...');
    await seedDatabase(false);
  } else if (process.env.NODE_ENV !== 'production') {
    const createdDemoAccounts = await ensureDemoAccounts();
    if (createdDemoAccounts.length > 0) {
      console.log(`Added missing demo accounts: ${createdDemoAccounts.join(', ')}`);
    }
  }

  const listenPort = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`🚀 SMART BLOOD BANK API Server listening on port ${portToTry} in ${process.env.NODE_ENV || 'development'} mode`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(portToTry) + 1;
        console.warn(`⚠️ Port ${portToTry} is already in use. Trying fallback port ${nextPort}...`);
        listenPort(nextPort);
      } else {
        console.error(`Server error:`, err);
        process.exit(1);
      }
    });
  };

  listenPort(PORT);
};

if (require.main === module) {
  startServer();
}

module.exports = app;
