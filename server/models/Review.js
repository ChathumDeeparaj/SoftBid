const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Issue #1: Review must be tied to a specific completed project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

// Issue #1: One review per client per provider per project
reviewSchema.index({ provider: 1, client: 1, project: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
