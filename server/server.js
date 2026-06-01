require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const initAuctionSockets = require('./socket/auctionSocket');
const { connectRedis } = require('./config/redis');

// Initialize Express app
const app = express();

// Create HTTP server (Day 21)
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allows connections from any client
    methods: ['GET', 'POST']
  }
});

// Attach socket channel logic
initAuctionSockets(io);

// Connect to Database
connectDB();
connectRedis();

// Middleware
app.use(cors());
app.use(express.json());

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

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown for Nodemon restarts and process termination
const mongoose = require('mongoose');

const gracefulShutdown = async () => {
  console.log('Shutting down server gracefully...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
  process.exit(0);
};

process.on('SIGUSR2', gracefulShutdown); // Nodemon restart signal
process.on('SIGINT', gracefulShutdown);  // Terminal Ctrl+C
