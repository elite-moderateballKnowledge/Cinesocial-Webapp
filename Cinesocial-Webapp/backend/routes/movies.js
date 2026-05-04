const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/', movieController.getAllMovies);
router.get('/popular/:min', movieController.getPopularByReviews);
router.get('/unreviewed', movieController.getUnreviewedMovies);
router.get('/search', movieController.searchMovies);
router.get('/:id', movieController.getMovieById);

module.exports = router;
