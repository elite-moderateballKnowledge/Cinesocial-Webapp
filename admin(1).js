const express = require('express');
const router = express.Router();
const adminController   = require('../controllers/adminController');
const articleController = require('../controllers/articleController');
const verifyAdminToken  = require('../middleware/adminAuth');

router.post('/login', adminController.login);
router.post('/logout', (req, res) => res.status(200).json({ message: 'Logged out successfully' }));

router.get('/stats',        verifyAdminToken, adminController.getStats);

// ── User Management ──────────────────────────────────────────
router.get('/users',        verifyAdminToken, adminController.getUsers);
router.post('/users/:id/ban', verifyAdminToken, adminController.banUserById);
router.post('/users/:id/unban', verifyAdminToken, adminController.unbanUserById);
router.delete('/reviews/:activityId', verifyAdminToken, adminController.deleteReview);

// Legacy ban endpoint
router.put('/ban',          verifyAdminToken, adminController.banUser);

// ── Movie Management ─────────────────────────────────────────
router.get('/movies',       verifyAdminToken, adminController.getMovies);
router.post('/movies',      verifyAdminToken, adminController.addMovie);
router.put('/movies/:id',   verifyAdminToken, adminController.updateMovie);
router.delete('/movies/:id', verifyAdminToken, adminController.deleteMovie);

// Legacy movie endpoint
router.post('/movie',       verifyAdminToken, adminController.addMovie);

router.get('/activity',     verifyAdminToken, adminController.getCombinedActivity);
router.get('/system-report',verifyAdminToken, adminController.getSystemReport);
router.get('/reports/reviewers-in-parties', verifyAdminToken, adminController.getReviewersInParties);
router.get('/reports/expired-subscriptions', verifyAdminToken, adminController.getExpiredSubscriptions);
// ── Article moderation ──────────────────────────────────────
// GET  /api/admin/articles/pending
router.get('/articles/pending', verifyAdminToken, articleController.getPendingArticles);
// POST /api/admin/articles/:id/approve
router.post('/articles/:id/approve', verifyAdminToken, articleController.approveArticle);
// POST /api/admin/articles/:id/reject
router.post('/articles/:id/reject', verifyAdminToken, articleController.rejectArticle);

// ── Analytics ───────────────────────────────────────────────
router.get('/analytics/actor', verifyAdminToken, adminController.getAnalyticsByActor);
router.get('/analytics/year', verifyAdminToken, adminController.getAnalyticsByYear);

module.exports = router;
