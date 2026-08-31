const express = require('express');
const router = express.Router();
const {
  sendMessage, getMessages,
  getFlaggedMessages, resolveFlag, getFlaggedCount,
} = require('../controllers/messageController');
const { protect, roleGuard } = require('../middleware/auth');

// Admin routes — MUST come before /:projectId to avoid Express matching "flagged" as an ID
router.get('/flagged/count', protect, roleGuard('admin'), getFlaggedCount);
router.get('/flagged', protect, roleGuard('admin'), getFlaggedMessages);
router.put('/:id/resolve', protect, roleGuard('admin'), resolveFlag);

// Participant routes
router.post('/', protect, sendMessage);
router.get('/:projectId', protect, getMessages);

module.exports = router;
