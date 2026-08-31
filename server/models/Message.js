const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Which project this conversation belongs to
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // What the receiver actually sees (sanitized by MessageGuard)
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  // Original text — only visible to admins
  rawContent: {
    type: String,
    required: true,
    maxlength: 2000,
  },

  // ── MessageGuard flags ──────────────────────────────────────────────────────
  flagged: {
    type: Boolean,
    default: false,
    index: true,
  },
  flagSeverity: {
    type: String,
    enum: ['none', 'suspicious', 'critical'],
    default: 'none',
  },
  // Array of human-readable reasons, e.g. ["phone number detected", "whatsapp keyword"]
  flagReasons: {
    type: [String],
    default: [],
  },
  // Whether content was actually modified (redacted) before delivery
  wasRedacted: {
    type: Boolean,
    default: false,
  },

  // ── Admin review ─────────────────────────────────────────────────────────────
  flagReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  flagReviewedAt: {
    type: Date,
  },
  flagResolution: {
    type: String,
    enum: ['pending', 'dismissed', 'warned', 'banned'],
    default: 'pending',
  },
  // Admin's note when resolving
  adminNote: {
    type: String,
    default: '',
  },

  // Soft-delete — keep record but hide from participants
  deleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index for fast per-project message retrieval
messageSchema.index({ project: 1, createdAt: 1 });
// Index for admin: all unresolved flagged messages
messageSchema.index({ flagged: 1, flagResolution: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
