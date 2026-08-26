/**
 * NPE Engine — Neutral Professional Estimation
 * Pure calculation functions, all parameters passed in (no DB calls here).
 * This makes the engine independently testable.
 *
 * Formula: NPE = (UFP × CAF × hoursPerFP) × hourlyRateLKR
 */

/**
 * Step 1: Sum base function points of selected features (UFP)
 * @param {Array<string>} selectedFeatureIds - array of IDs
 * @param {Array<object>} availableFeatures - from NpeConfig document
 */
function calculateUFP(selectedFeatureIds, availableFeatures) {
  return selectedFeatureIds.reduce((sum, id) => {
    const feature = availableFeatures.find(f => f.id === id);
    return sum + (feature ? feature.baseFP : 0);
  }, 0);
}

/**
 * Step 2: Complexity Adjustment Factor (simplified COCOMO II)
 * @param {number} integrations - count of third-party integrations
 * @param {string} securityLevel - 'basic' | 'standard' | 'high'
 * @param {number} ufp - unadjusted function points (used for size factor)
 * @param {object} config - NpeConfig document from DB
 */
function calculateCAF(integrations, securityLevel, ufp, config) {
  let mult = 1.0;

  // Integration multiplier
  if (integrations >= 4) mult *= config.integrationMultipliers.high;
  else if (integrations >= 2) mult *= config.integrationMultipliers.mid;
  else mult *= config.integrationMultipliers.low;

  // Security multiplier
  const secMultiplier = config.securityMultipliers[securityLevel] || config.securityMultipliers.basic;
  mult *= secMultiplier;

  // Size multiplier (team experience defaults to medium for project estimation)
  if (ufp > 100) mult *= config.sizeMultipliers.large;
  else if (ufp > 50) mult *= config.sizeMultipliers.medium;
  else mult *= config.sizeMultipliers.small;

  return parseFloat(mult.toFixed(4));
}

/**
 * Step 3: Convert function points to estimated person-hours
 */
function estimateHours(ufp, caf, hoursPerFP) {
  return ufp * hoursPerFP * caf;
}

/**
 * Step 4: Main NPE calculation
 * @param {object} projectInput - { selectedFeatures, integrations, securityLevel }
 * @param {object} config - NpeConfig document from DB
 * @returns {{ benchmark, confidence, breakdown }}
 */
function calculateNPE(projectInput, config) {
  const { selectedFeatures = [], integrations = 0, securityLevel = 'basic' } = projectInput;

  const ufp = calculateUFP(selectedFeatures, config.features || []);
  const caf = calculateCAF(integrations, securityLevel, ufp, config);
  const totalHours = estimateHours(ufp, caf, config.hoursPerFP);
  const benchmark = Math.round(totalHours * config.hourlyRateLKR);

  // Confidence improves with more features and data
  let confidence = 'low';
  if (selectedFeatures.length >= 3 && integrations !== undefined) confidence = 'medium';
  if (selectedFeatures.length >= 6 && integrations > 0) confidence = 'high';

  return {
    benchmark,
    confidence,
    breakdown: {
      unadjustedFP: ufp,
      complexityMultiplier: caf,
      estimatedHours: Math.round(totalHours),
      hourlyRateLKR: config.hourlyRateLKR,
    },
  };
}

module.exports = { calculateNPE, calculateUFP, calculateCAF, estimateHours };
