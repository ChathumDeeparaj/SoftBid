const express = require('express');
const router = express.Router();
const {
  getMyProjects, createProject, getAllProjects,
  updateProjectStatus, getProjectById, getOpenProjects,
  awardProject, completeProject,
} = require('../controllers/projectController');
const { protect, roleGuard } = require('../middleware/auth');
const { cache, invalidateCache } = require('../middleware/cacheMiddleware'); // Issue #16

// Client routes — invalidate open projects cache when a new project is created
router.route('/my-projects').get(protect, roleGuard('client'), getMyProjects);
router.post('/', protect, roleGuard('client'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, createProject);

// Provider routes — Issue #16: cache open projects list for 1 minute
router.route('/open').get(protect, roleGuard('provider'), cache('projects:open', 60), getOpenProjects);

// Admin routes — MUST be before /:id to avoid Express capturing "all" as an ID param
router.route('/all').get(protect, roleGuard('admin'), getAllProjects);

// Issue #3: Auction lifecycle — award and complete (also invalidate cache)
router.put('/:id/award', protect, roleGuard('client'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, awardProject);
router.route('/:id/complete').put(protect, roleGuard('client'), completeProject);

// Public or generic authenticated route
router.route('/:id').get(protect, getProjectById);
router.put('/:id/status', protect, roleGuard('admin'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, updateProjectStatus);

module.exports = router;
