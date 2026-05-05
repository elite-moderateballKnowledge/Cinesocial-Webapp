const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/', movieController.getAllMovies);
router.get('/top-rated', movieController.getTopRatedMovies);
router.get('/popular/:min', movieController.getPopularByReviews);
router.get('/unreviewed', movieController.getUnreviewedMovies);
router.get('/average-ratings', movieController.getAverageRatings);
router.get('/highest-rated', movieController.getHighestRatedMovie);
router.get('/genre/:genreId', movieController.getMoviesByGenre);
router.get('/search', movieController.searchMovies);
router.get('/:id', movieController.getMovieById);

module.exports = router;

