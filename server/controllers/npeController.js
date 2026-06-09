const NpeConfig = require('../models/NpeConfig');
const { calculateNPE } = require('../services/npeEngine');

const getOrCreateConfig = async () => {
  let config = await NpeConfig.findOne();
  
  const defaultFeatures = [
    { id: 'user_auth',          label: 'User Login / Registration',       baseFP: 8  },
    { id: 'role_based_access',  label: 'Role-based Access Control',       baseFP: 6  },
    { id: 'payment',            label: 'Payment Gateway Integration',     baseFP: 15 },
    { id: 'admin_dashboard',    label: 'Admin Dashboard',                 baseFP: 12 },
    { id: 'mobile_responsive',  label: 'Mobile Responsive UI',            baseFP: 5  },
    { id: 'api_integration',    label: 'Third-party API Integration',     baseFP: 10 },
    { id: 'reporting',          label: 'Reports & Analytics',             baseFP: 10 },
    { id: 'file_uploads',       label: 'File Upload / Management',        baseFP: 6  },
    { id: 'real_time',          label: 'Real-time Updates (WebSockets)',  baseFP: 13 },
    { id: 'custom_workflow',    label: 'Custom Workflow Engine',          baseFP: 20 },
  ];

  if (!config) {
    config = await NpeConfig.create({ features: defaultFeatures });
    console.log('✅ NPE Config seeded with defaults including features.');
  } else if (!config.features || config.features.length === 0) {
    // If config exists but features array is missing/empty (due to legacy DB), seed them
    config.features = defaultFeatures;
    await config.save();
    console.log('✅ NPE Config features retroactively seeded.');
  }
  return config;
};

// @desc    Preview NPE estimate before project submission
// @route   POST /api/npe/preview
// @access  Private
const getNpePreview = async (req, res) => {
  try {
    const { features, integrations, securityLevel } = req.body;
    const config = await getOrCreateConfig();

    const result = calculateNPE(
      {
        selectedFeatures: features || [],
        integrations: integrations || 0,
        securityLevel: securityLevel || 'basic',
      },
      config
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ [npe/preview] Error:', error.message);
    res.status(500).json({ message: 'NPE calculation failed', error: error.message });
  }
};

// @desc    Get current NPE configuration (Super Admin only)
// @route   GET /api/npe/config
// @access  Super Admin
const getNpeConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();
    res.status(200).json(config);
  } catch (error) {
    console.error('❌ [npe/config GET] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update NPE configuration parameters (Super Admin only)
// @route   PUT /api/npe/config
// @access  Super Admin
const updateNpeConfig = async (req, res) => {
  try {
    const config = await getOrCreateConfig();

    // Only update fields that were sent — merge cleanly
    const allowedFields = [
      'hoursPerFP', 'hourlyRateLKR',
      'integrationMultipliers', 'securityMultipliers', 'sizeMultipliers',
      'features'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof config[field] === 'object' && !Array.isArray(config[field])) {
          // Deep merge nested objects (multiplier tables)
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

module.exports = { getNpePreview, getNpeConfig, updateNpeConfig };
