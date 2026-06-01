const initAuctionSockets = (io) => {
  console.log('Socket IO initialized. Ready for connections.');

  io.on('connection', (socket) => {
    // Day 24: Safety drop logs
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Day 22: Channel management
    socket.on('join_auction', (projectId) => {
      socket.join(projectId);
      console.log(`[Socket] Client ${socket.id} joined auction room: ${projectId}`);
      
      // Optional: Confirm to the client that they joined
      socket.emit('joined_room', { projectId, message: 'Successfully joined room' });
    });

    socket.on('leave_auction', (projectId) => {
      socket.leave(projectId);
      console.log(`[Socket] Client ${socket.id} left auction room: ${projectId}`);
    });

    // Day 23: Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = initAuctionSockets;
