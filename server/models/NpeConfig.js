const mongoose = require('mongoose');

// Single-document config — Super Admin edits these via the dashboard UI
const npeConfigSchema = new mongoose.Schema({
  // Hours to complete 1 function point of work
  hoursPerFP: {
    type: Number,
    default: 5,
  },
  // Market rate in LKR for a mid-level Sri Lankan developer
  hourlyRateLKR: {
    type: Number,
    default: 3000,
  },
  // Integration count multipliers
  integrationMultipliers: {
    low: { type: Number, default: 1.0 },   // 0–1 integrations
    mid: { type: Number, default: 1.2 },   // 2–3 integrations
    high: { type: Number, default: 1.4 },  // 4+ integrations
  },
  // Security level multipliers
  securityMultipliers: {
    basic: { type: Number, default: 1.0 },
    standard: { type: Number, default: 1.15 },
    high: { type: Number, default: 1.35 },
  },
  // Project size (UFP) multipliers
  sizeMultipliers: {
    small: { type: Number, default: 1.0 },  // UFP < 50
    medium: { type: Number, default: 1.1 }, // UFP 50–100
    large: { type: Number, default: 1.2 },  // UFP > 100
  },
  // Dynamic list of selectable features
  features: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    baseFP: { type: Number, required: true }
  }],
  // Track who last changed parameters
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

const NpeConfig = mongoose.model('NpeConfig', npeConfigSchema);
module.exports = NpeConfig;
