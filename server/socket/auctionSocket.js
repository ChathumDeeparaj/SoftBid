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

    // Auto-join personal room for direct notifications (warnings, bans)
    socket.join(socket.userId);

    // Auto-join admin alert room if admin
    if (socket.userRole === 'admin') {
      socket.join('admin:alerts');
      console.log(`[Socket] Admin ${socket.id} joined admin:alerts room`);
    }

    // ── Auction rooms ─────────────────────────────────────────────────────────
    socket.on('join_auction', (projectId) => {
      socket.join(projectId);
      console.log(`[Socket] Client ${socket.id} joined auction room: ${projectId}`);
      socket.emit('joined_room', { projectId, message: 'Successfully joined room' });
    });

    socket.on('leave_auction', (projectId) => {
      socket.leave(projectId);
      console.log(`[Socket] Client ${socket.id} left auction room: ${projectId}`);
    });

    // ── Chat rooms (same room ID as project ID) ───────────────────────────────
    socket.on('join_chat', (projectId) => {
      socket.join(projectId);
      console.log(`[Socket] Client ${socket.id} joined chat room: ${projectId}`);
    });

    socket.on('leave_chat', (projectId) => {
      socket.leave(projectId);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = initAuctionSockets;
