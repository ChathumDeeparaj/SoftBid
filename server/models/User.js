const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    required: true,
  },
  // Client specific fields
  companyName: {
    type: String,
    required: function() { return this.role === 'client'; }
  },
  // Provider specific fields
  portfolioUrl: {
    type: String,
    required: function() { return this.role === 'provider'; }
  },
  yearsExperience: {
    type: Number,
    required: function() { return this.role === 'provider'; }
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false, // Only manually set by a DB admin for the super admin account
  },
  // Set to true by admin when user violates platform policies
  isBanned: {
    type: Boolean,
    default: false,
  },

  // Profile specific fields
  description: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  // Bidding Engine (TOPSIS) required metrics
  completedProjects: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 0, // Percentage 0-100
  },
  feedbackScore: {
    type: Number,
    default: 0, // 0.0 to 5.0
  },
  // Computed from client reviews after project completion
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },

  country: {
    type: String,
    default: 'United States',
  },
  avgResponseTime: {
    type: String,
    default: '1 hour',
  },
  lastDelivery: {
    type: String,
    default: '1 day',
  },
  // Issue #5: Token version — increment to invalidate all existing JWTs
  tokenVersion: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Pre-save hook to hash password before saving to DB
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;

  // Hash password with bcrypt cost factor of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
