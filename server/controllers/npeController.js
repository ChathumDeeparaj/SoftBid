const NpeConfig = require('../models/NpeConfig');
const { calculateNPE } = require('../services/npeEngine');
const { calculateCalibration } = require('../services/npeCalibrationEngine');

// Preset profiles for Issue #12
const DEFAULT_PROFILES = [
  {
    profileName: 'default',
    profileLabel: 'General Software Project',
    isDefault: true,
    hoursPerFP: 5,
    hourlyRateLKR: 3000,
    features: [
      { id: 'user_auth',         label: 'User Login / Registration',      baseFP: 8  },
      { id: 'role_based_access', label: 'Role-based Access Control',      baseFP: 6  },
      { id: 'payment',           label: 'Payment Gateway Integration',    baseFP: 15 },
      { id: 'admin_dashboard',   label: 'Admin Dashboard',                baseFP: 12 },
      { id: 'mobile_responsive', label: 'Mobile Responsive UI',           baseFP: 5  },
      { id: 'api_integration',   label: 'Third-party API Integration',    baseFP: 10 },
      { id: 'reporting',         label: 'Reports & Analytics',            baseFP: 10 },
      { id: 'file_uploads',      label: 'File Upload / Management',       baseFP: 6  },
      { id: 'real_time',         label: 'Real-time Updates (WebSockets)', baseFP: 13 },
      { id: 'custom_workflow',   label: 'Custom Workflow Engine',         baseFP: 20 },
    ],
  },
  {
    profileName: 'mobile-app',
    profileLabel: 'Mobile Application (iOS/Android)',
    isDefault: false,
    hoursPerFP: 7,      // Mobile is generally more time-intensive
    hourlyRateLKR: 3500,
    features: [
      { id: 'user_auth',       label: 'User Login / Registration',    baseFP: 8  },
      { id: 'push_notif',      label: 'Push Notifications',           baseFP: 10 },
      { id: 'offline_mode',    label: 'Offline Mode / Local Storage', baseFP: 14 },
      { id: 'camera',          label: 'Camera / Media Access',        baseFP: 8  },
      { id: 'maps',            label: 'Maps / Location Services',     baseFP: 12 },
      { id: 'payment',         label: 'In-App Purchases',             baseFP: 18 },
      { id: 'social_login',    label: 'Social Login (Google/Apple)',  baseFP: 7  },
      { id: 'analytics',       label: 'Analytics & Crash Reporting',  baseFP: 6  },
    ],
  },
  {
    profileName: 'blockchain',
    profileLabel: 'Blockchain / Web3 dApp',
    isDefault: false,
    hoursPerFP: 12,     // Blockchain is very complex and slow
    hourlyRateLKR: 5000,
    features: [
      { id: 'smart_contract',  label: 'Smart Contract Development',   baseFP: 25 },
      { id: 'wallet',          label: 'Wallet Integration',           baseFP: 15 },
      { id: 'nft',             label: 'NFT Minting / Marketplace',    baseFP: 20 },
      { id: 'defi',            label: 'DeFi Protocol Integration',    baseFP: 30 },
      { id: 'token',           label: 'Token / ERC-20 Contract',      baseFP: 18 },
      { id: 'ipfs',            label: 'IPFS / Decentralized Storage', baseFP: 12 },
      { id: 'audit',           label: 'Security Audit Support',       baseFP: 10 },
    ],
  },
];

/**
 * Get or create the default config (for backward compatibility)
 * Issue #12: Now finds by profileName or falls back to isDefault: true
 */
const getOrCreateConfig = async (profileName = 'default') => {
  let config = await NpeConfig.findOne({ profileName });

  if (!config) {
    // Seed all default profiles on first use
    const defaultProfile = DEFAULT_PROFILES.find((p) => p.profileName === profileName)
      || DEFAULT_PROFILES[0];
    config = await NpeConfig.create(defaultProfile);
    console.log(`✅ NPE Config profile "${profileName}" seeded.`);
  } else if (!config.features || config.features.length === 0) {
    const defaultProfile = DEFAULT_PROFILES.find((p) => p.profileName === profileName)
      || DEFAULT_PROFILES[0];
    config.features = defaultProfile.features;
    await config.save();
    console.log(`✅ NPE Config profile "${profileName}" features retroactively seeded.`);
  }

  return config;
};

// @desc    Preview NPE estimate before project submission
// @route   POST /api/npe/preview
// @access  Private
const getNpePreview = async (req, res) => {
  try {
    const { features, integrations, securityLevel, profileName } = req.body;
    const config = await getOrCreateConfig(profileName || 'default');

    const result = calculateNPE(
      {
        selectedFeatures: features || [],
        integrations: integrations || 0,
        securityLevel: securityLevel || 'basic',
      },
      config
    );

    res.status(200).json({ ...result, profile: config.profileLabel });
  } catch (error) {
    console.error('❌ [npe/preview] Error:', error.message);
    res.status(500).json({ message: 'NPE calculation failed', error: error.message });
  }
};

// @desc    Get current NPE configuration
// @route   GET /api/npe/config
// @access  Private (any authenticated user)
const getNpeConfig = async (req, res) => {
  try {
    const profileName = req.query.profile || 'default';
    const config = await getOrCreateConfig(profileName);
    res.status(200).json(config);
  } catch (error) {
    console.error('❌ [npe/config GET] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update NPE configuration parameters
// @route   PUT /api/npe/config
// @access  Super Admin
const updateNpeConfig = async (req, res) => {
  try {
    const profileName = req.query.profile || 'default';
    const config = await getOrCreateConfig(profileName);

    const allowedFields = [
      'hoursPerFP', 'hourlyRateLKR', 'profileLabel',
      'integrationMultipliers', 'securityMultipliers', 'sizeMultipliers',
      'features',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (typeof config[field] === 'object' && !Array.isArray(config[field])) {
          config[field] = { ...config[field].toObject(), ...req.body[field] };
        } else {
          config[field] = req.body[field];
        }
      }
    });

    config.updatedBy = req.user._id;
    await config.save();

    res.status(200).json({ message: 'NPE configuration updated successfully.', config });
  } catch (error) {
    console.error('❌ [npe/config PUT] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List all NPE profiles
// @route   GET /api/npe/profiles
// @access  Private (any authenticated user)
const getNpeProfiles = async (req, res) => {
  try {
    // Ensure default profiles exist
    for (const profile of DEFAULT_PROFILES) {
      const exists = await NpeConfig.findOne({ profileName: profile.profileName });
      if (!exists) await NpeConfig.create(profile);
    }

    const profiles = await NpeConfig.find().select('profileName profileLabel isDefault updatedAt');
    res.status(200).json(profiles);
  } catch (error) {
    console.error('❌ [npe/profiles] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get NPE calibration metrics (how accurate the engine is)
// @route   GET /api/npe/calibration
// @access  Super Admin
const getNpeCalibration = async (req, res) => {
  try {
    const calibration = await calculateCalibration();
    res.status(200).json(calibration);
  } catch (error) {
    console.error('❌ [npe/calibration] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNpePreview, getNpeConfig, updateNpeConfig, getNpeProfiles, getNpeCalibration };
