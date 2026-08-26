const express = require('express');
const router = express.Router();
const {
  getMyProjects, createProject, getAllProjects,
  updateProjectStatus, getProjectById, getOpenProjects,
  awardProject, completeProject,
  acceptContract, addMilestone, approveMilestone, submitReview, getWonProjects,
} = require('../controllers/projectController');
const { protect, roleGuard } = require('../middleware/auth');
const { cache, invalidateCache } = require('../middleware/cacheMiddleware'); // Issue #16

// ── Client routes ────────────────────────────────────────────────────────────
router.route('/my-projects').get(protect, roleGuard('client'), getMyProjects);
router.post('/', protect, roleGuard('client'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, createProject);

// ── Provider routes ──────────────────────────────────────────────────────────
// Issue #16: cache open projects list for 1 minute
router.route('/open').get(protect, roleGuard('provider'), cache('projects:open', 60), getOpenProjects);
// Provider: get all projects they have won / are working on
router.route('/won').get(protect, roleGuard('provider'), getWonProjects);

// ── Admin routes — MUST be before /:id ──────────────────────────────────────
router.route('/all').get(protect, roleGuard('admin'), getAllProjects);

// ── Auction lifecycle ────────────────────────────────────────────────────────
// Client: award a project to a bid winner
router.put('/:id/award', protect, roleGuard('client'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, awardProject);

// Client: mark project as completed
router.route('/:id/complete').put(protect, roleGuard('client'), completeProject);

// ── Post-Award lifecycle ─────────────────────────────────────────────────────
// Provider: accept the contract (awarded → in-progress)
router.put('/:id/accept', protect, roleGuard('provider'), acceptContract);

// Provider: submit a milestone update
router.post('/:id/milestones', protect, roleGuard('provider'), addMilestone);

// Client: approve a submitted milestone
router.put('/:id/milestones/:milestoneId/approve', protect, roleGuard('client'), approveMilestone);

// Client: submit a star rating + review after completion
router.post('/:id/review', protect, roleGuard('client'), submitReview);

// ── Generic authenticated routes ─────────────────────────────────────────────
router.route('/:id').get(protect, getProjectById);
router.put('/:id/status', protect, roleGuard('admin'), async (req, res, next) => {
  await invalidateCache('projects:open');
  next();
}, updateProjectStatus);

module.exports = router;
