require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('./middleware/mongoSanitize'); // Custom — compatible with Express 5
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initAuctionSockets = require('./socket/auctionSocket');
const { connectRedis } = require('./config/redis');
const { generalLimiter, authLimiter, bidLimiter } = require('./middleware/rateLimiter');
const { startAuctionScheduler, stopAuctionScheduler } = require('./services/auctionScheduler');
const requestLogger = require('./middleware/requestLogger'); // Issue #17
const logger = require('./config/logger');                    // Issue #17

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// ── Issue #13 Fix: Restrict CORS to frontend origin ──
const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173').split(',');

// Initialize Socket.io with restricted CORS
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Attach socket channel logic (now with JWT auth — Issue #6)
initAuctionSockets(io);

// Make io accessible in controllers
app.set('io', io);

// Connect to Database
connectDB().then(() => {
  // Issue #3: Start auction scheduler after DB is connected
  startAuctionScheduler();
});
connectRedis();

// ── Security Middleware ──
app.use(helmet());                   // Issue #15: Security headers
app.use(mongoSanitize());           // Issue #15: Strip MongoDB operators from input
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger); // Issue #17: Log every request with user context

// ── Issue #14: Rate limiting ──
app.use('/api/', generalLimiter);    // 100 req / 15 min global
app.use('/api/auth', authLimiter);   // 10 req / 15 min for auth
app.use('/api/bids', bidLimiter);    // 5 req / 1 min for bids

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// Authentication Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Project Routes
app.use('/api/projects', require('./routes/projectRoutes'));

// User Routes
app.use('/api/users', require('./routes/userRoutes'));

// NPE Routes
app.use('/api/npe', require('./routes/npeRoutes'));

// Bid Routes
app.use('/api/bids', require('./routes/bidRoutes'));

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown for Nodemon restarts and process termination
const mongoose = require('mongoose');

const gracefulShutdown = async () => {
  console.log('Shutting down server gracefully...');
  stopAuctionScheduler();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
  process.exit(0);
};

process.on('SIGUSR2', gracefulShutdown); // Nodemon restart signal
process.on('SIGINT', gracefulShutdown);  // Terminal Ctrl+C
