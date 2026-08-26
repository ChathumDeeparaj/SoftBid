const jwt = require('jsonwebtoken');

/**
 * Socket.io authentication middleware
 * Verifies JWT from socket.handshake.auth.token before allowing connection
 */
const initAuctionSockets = (io) => {
  console.log('Socket IO initialized. Ready for connections.');

  // ── Issue #6 Fix: Authenticate every socket connection ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required — no token provided'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Authentication failed — invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Authenticated client connected: ${socket.id} (user: ${socket.userId}, role: ${socket.userRole})`);

    socket.on('join_auction', (projectId) => {
      socket.join(projectId);
      console.log(`[Socket] Client ${socket.id} joined auction room: ${projectId}`);
      socket.emit('joined_room', { projectId, message: 'Successfully joined room' });
    });

    socket.on('leave_auction', (projectId) => {
      socket.leave(projectId);
      console.log(`[Socket] Client ${socket.id} left auction room: ${projectId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = initAuctionSockets;
