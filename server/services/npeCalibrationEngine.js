const Project = require('../models/Project');

/**
 * Issue #7: NPE Statistical Feedback Loop
 *
 * Uses completed projects' actual vs. estimated costs to:
 * 1. Calculate MAPE (Mean Absolute Percentage Error) — accuracy of NPE engine
 * 2. Derive a correction factor to improve future estimates
 * 3. Return a statistical confidence interval
 */

/**
 * Calculate calibration metrics from completed projects
 * @returns {{ mape, correctionFactor, sampleSize, confidenceInterval }}
 */
const calculateCalibration = async () => {
  const completedProjects = await Project.find({
    status: 'completed',
    npeEstimate: { $gt: 0 },
    actualCostLKR: { $exists: true, $gt: 0 },
  }).select('npeEstimate actualCostLKR title').lean();

  if (completedProjects.length === 0) {
    return {
      mape: null,
      correctionFactor: 1.0,
      sampleSize: 0,
      confidenceInterval: null,
      message: 'No completed projects with actual cost data yet.',
    };
  }

  const errors = completedProjects.map((p) => {
    const pct = Math.abs(p.actualCostLKR - p.npeEstimate) / p.npeEstimate;
    return pct;
  });

  const ratios = completedProjects.map((p) => p.actualCostLKR / p.npeEstimate);

  // MAPE: mean of absolute percentage errors
  const mape = (errors.reduce((s, e) => s + e, 0) / errors.length) * 100;

  // Correction factor: geometric mean of actual/estimate ratios
  const logSum = ratios.reduce((s, r) => s + Math.log(r), 0);
  const correctionFactor = Math.exp(logSum / ratios.length);

  // Standard deviation of ratios for confidence interval
  const mean = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  const variance = ratios.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / ratios.length;
  const stdDev = Math.sqrt(variance);

  return {
    mape: parseFloat(mape.toFixed(2)),
    correctionFactor: parseFloat(correctionFactor.toFixed(4)),
    sampleSize: completedProjects.length,
    confidenceInterval: {
      lower: parseFloat((mean - stdDev).toFixed(4)),
      upper: parseFloat((mean + stdDev).toFixed(4)),
    },
    meanRatio: parseFloat(mean.toFixed(4)),
  };
};

/**
 * Apply the correction factor to an NPE estimate
 * @param {number} rawEstimate - Raw NPE benchmark
 * @param {number} correctionFactor - From calculateCalibration()
 * @returns {number} Corrected estimate
 */
const applyCorrectionFactor = (rawEstimate, correctionFactor) => {
  return Math.round(rawEstimate * correctionFactor);
};

module.exports = { calculateCalibration, applyCorrectionFactor };
