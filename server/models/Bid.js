const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bidAmountLKR: {
    type: Number,
    required: true,
  },
  // The Closeness Coefficient (Ci) calculated via AHP-TOPSIS
  trustScore: {
    type: Number,
    default: 0,
  },
  // Current dynamic rank based on trustScore
  rank: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'withdrawn', 'accepted', 'rejected'],
    default: 'active',
  },
  // Issue #11: Bid revision history for audit trail
  revisionHistory: [{
    amount: { type: Number, required: true },
    changedAt: { type: Date, default: Date.now },
  }],
  withdrawnAt: {
    type: Date,
  },
}, { timestamps: true });

// A provider can only have one active bid per project.
bidSchema.index({ project: 1, provider: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
