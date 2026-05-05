const express = require('express');
const router  = express.Router();
const articleController = require('../controllers/articleController');
const verifyToken       = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// PUBLIC routes — no auth required
// ─────────────────────────────────────────────────────────────

// GET /api/articles?category=ESSAY&limit=12&page=1
router.get('/', articleController.getPublishedArticles);

// GET /api/articles/my-articles  — must come BEFORE /:slug so it isn't
// matched as a slug value when the user is logged in.
router.get('/my-articles', verifyToken, articleController.getMyArticles);

// GET /api/articles/:slug
router.get('/:slug', articleController.getArticleBySlug);

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED (Cinephile-gated inside the controller)
// ─────────────────────────────────────────────────────────────

// POST /api/articles
router.post('/', verifyToken, articleController.createArticle);

// PUT /api/articles/:id
router.put('/:id', verifyToken, articleController.updateArticle);

// DELETE /api/articles/:id
router.delete('/:id', verifyToken, articleController.deleteArticle);

module.exports = router;
