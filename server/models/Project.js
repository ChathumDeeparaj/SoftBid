const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  timeframe: {
    type: String,
    default: 'Not specified',
  },
  // Client's stated budget in LKR
  clientBudgetLKR: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'awarded', 'in-progress', 'completed', 'cancelled'],
    default: 'open',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // ── Issue #3: Auction Lifecycle ──
  auctionEndsAt: {
    type: Date,
    required: true,
  },
  awardedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  awardedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
  },
  awardedAt: {
    type: Date,
  },

  // ── Issue #7: NPE Feedback Loop ──
  actualCostLKR: {
    type: Number,
  },
  completedAt: {
    type: Date,
  },

  // ── Issue #2: Client-configurable AHP Weights ──
  ahpWeights: {
    experience: { type: Number, default: 0.40, min: 0, max: 1 },
    quality:    { type: Number, default: 0.40, min: 0, max: 1 },
    price:      { type: Number, default: 0.20, min: 0, max: 1 },
  },

  // --- NPE Fields ---
  selectedFeatures: {
    type: [String],
    default: [],
  },
  integrations: {
    type: Number,
    default: 0,
  },
  securityLevel: {
    type: String,
    enum: ['basic', 'standard', 'high'],
    default: 'basic',
  },
  // NPE estimate stored at submission time (snapshot)
  npeEstimate: {
    type: Number,
    default: 0,
  },
  npeBreakdown: {
    unadjustedFP: Number,
    complexityMultiplier: Number,
    estimatedHours: Number,
    hourlyRateLKR: Number,
  },
  npeConfidence: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  // Set true if client confirmed submission despite budget below NPE
  riskAccepted: {
    type: Boolean,
    default: false,
  },

  // Clients can invite up to 5 favorite service providers
  invitedProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // ── Post-Award Lifecycle ──

  // When the provider formally accepted the contract (status → in-progress)
  contractAcceptedAt: {
    type: Date,
  },

  // Milestones defined and submitted by the provider, approved by the client
  milestones: [{
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved'],
      default: 'pending',
    },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    providerNote: { type: String, default: '' },   // provider's update message
    clientNote:   { type: String, default: '' },   // client feedback on approval
  }],

  // Client's review after project is completed
  clientReview: {
    rating: { type: Number, min: 1, max: 5 },      // 1-5 stars
    comment: { type: String, default: '' },
    createdAt: { type: Date },
  },

}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
