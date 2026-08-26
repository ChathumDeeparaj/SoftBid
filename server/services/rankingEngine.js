/**
 * AHP-TOPSIS Bid Ranking Engine
 * Calculates the Trust Score (Closeness Coefficient) for incoming bids.
 *
 * Issue #2: Weights are now passed in (client-configurable per project)
 * Issue #9: Price deviation is now asymmetric (overbidding penalized more)
 */

// Default weights — used if project doesn't specify custom weights
const DEFAULT_WEIGHTS = {
  experience: 0.40,
  quality:    0.40,
  price:      0.20,
};

/**
 * Validates that AHP weights sum to approximately 1.0
 */
const validateWeights = (weights) => {
  const sum = weights.experience + weights.quality + weights.price;
  return Math.abs(sum - 1.0) <= 0.02; // Tolerance of ±0.02
};

/**
 * Calculates the Euclidean distance between two vectors
 */
const euclideanDistance = (vec1, vec2) => {
  return Math.sqrt(
    Math.pow(vec1.c1 - vec2.c1, 2) +
    Math.pow(vec1.c2 - vec2.c2, 2) +
    Math.pow(vec1.c3 - vec2.c3, 2)
  );
};

/**
 * Main TOPSIS calculation function
 * @param {Array} bids - Array of bid objects (must have populated provider details)
 * @param {Number} npeEstimate - The baseline cost estimate (NPE) for the project
 * @param {Object} weights - AHP weights { experience, quality, price }
 * @returns {Array} Array of bids with updated trustScore and rank
 */
const calculateRankings = (bids, npeEstimate, weights = null) => {
  if (!bids || bids.length === 0) return [];
  if (bids.length === 1) {
    return [{ ...bids[0].toObject(), trustScore: 1, rank: 1 }];
  }

  // Issue #2: Use provided weights or defaults, validate they sum to ~1.0
  const w = weights && validateWeights(weights) ? weights : DEFAULT_WEIGHTS;

  // 1. Construct Decision Matrix
  const decisionMatrix = bids.map(bid => {
    const p = bid.provider;

    // C1: Experience (Benefit) — higher is better
    const experienceScore = (p.completedProjects || 0) + ((p.yearsExperience || 0) * 5);

    // C2: Quality Rating (Benefit) — higher is better (max ~200)
    const qualityScore = ((p.feedbackScore || 0) * 20) + (p.successRate || 0);

    // C3: Price Deviation (Cost — lower is better)
    // Issue #9: Asymmetric — overbidding penalized 2× more than underbidding
    const rawDeviation = bid.bidAmountLKR - npeEstimate;
    const priceDeviation = rawDeviation > 0
      ? rawDeviation * 2.0         // Penalty: bid above NPE (overbidding)
      : Math.abs(rawDeviation);    // Mild: bid below NPE (client saves money)

    return {
      bidId: bid._id,
      c1: experienceScore,
      c2: qualityScore,
      c3: priceDeviation,
    };
  });

  // 2. Vector Normalization
  const sumSq = decisionMatrix.reduce((acc, row) => {
    acc.c1 += Math.pow(row.c1, 2);
    acc.c2 += Math.pow(row.c2, 2);
    acc.c3 += Math.pow(row.c3, 2);
    return acc;
  }, { c1: 0, c2: 0, c3: 0 });

  const denoms = {
    c1: Math.sqrt(sumSq.c1) || 1,
    c2: Math.sqrt(sumSq.c2) || 1,
    c3: Math.sqrt(sumSq.c3) || 1,
  };

  // 3. Weighted Normalized Matrix (Issue #2: using client-provided weights)
  const weightedMatrix = decisionMatrix.map(row => ({
    bidId: row.bidId,
    c1: (row.c1 / denoms.c1) * w.experience,
    c2: (row.c2 / denoms.c2) * w.quality,
    c3: (row.c3 / denoms.c3) * w.price,
  }));

  // 4. Determine Positive Ideal (A+) and Negative Ideal (A-) Solutions
  // C1, C2 are benefit (max is best). C3 is cost (min is best).
  const A_plus = {
    c1: Math.max(...weightedMatrix.map(r => r.c1)),
    c2: Math.max(...weightedMatrix.map(r => r.c2)),
    c3: Math.min(...weightedMatrix.map(r => r.c3)),
  };

  const A_minus = {
    c1: Math.min(...weightedMatrix.map(r => r.c1)),
    c2: Math.min(...weightedMatrix.map(r => r.c2)),
    c3: Math.max(...weightedMatrix.map(r => r.c3)),
  };

  // 5 & 6. Calculate Euclidean Distances and Closeness Coefficient (Trust Score)
  const scoredBids = bids.map(bid => {
    const row = weightedMatrix.find(r => r.bidId.toString() === bid._id.toString());

    const distanceToPositive = euclideanDistance(row, A_plus);
    const distanceToNegative = euclideanDistance(row, A_minus);

    let trustScore = 0;
    if (distanceToPositive + distanceToNegative > 0) {
      trustScore = distanceToNegative / (distanceToPositive + distanceToNegative);
    }

    return {
      ...bid.toObject(),
      trustScore: Number(trustScore.toFixed(4)),
    };
  });

  // 7. Rank the bids (sort descending by trustScore)
  scoredBids.sort((a, b) => b.trustScore - a.trustScore);
  scoredBids.forEach((bid, index) => {
    bid.rank = index + 1;
  });

  return scoredBids;
};

module.exports = { calculateRankings, validateWeights, DEFAULT_WEIGHTS };
