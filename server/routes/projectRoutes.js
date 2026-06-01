const express = require('express');
const router = express.Router();
const { getMyProjects, createProject, getAllProjects, updateProjectStatus } = require('../controllers/projectController');
const { protect, roleGuard } = require('../middleware/auth');

// Client routes
router.route('/my-projects').get(protect, roleGuard('client'), getMyProjects);
router.route('/').post(protect, roleGuard('client'), createProject);

// Admin routes
router.route('/all').get(protect, roleGuard('admin'), getAllProjects);
router.route('/:id/status').put(protect, roleGuard('admin'), updateProjectStatus);

module.exports = router;
