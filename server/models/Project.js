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
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
